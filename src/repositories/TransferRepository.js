const pool = require("../config/Database");

function transferError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

async function findUserById(userId) {
	const { rows } = await pool.query(
		`SELECT first_name, last_name
		 FROM users
		 WHERE id = $1`,
		[userId]
	);
	return rows[0] || null;
}

async function findAccountsByUserId(userId) {
	const { rows } = await pool.query(
		`SELECT id, account_number, account_type, rib, iban, balance, currency
		 FROM accounts
		 WHERE user_id = $1 AND status = 'active'
		 ORDER BY created_at DESC`,
		[userId]
	);
	return rows;
}

async function findBeneficiariesByUserId(userId) {
	const { rows } = await pool.query(
		`SELECT id, name, rib, bank_name
		 FROM beneficiaries
		 WHERE user_id = $1 AND status = 'active'
		 ORDER BY name`,
		[userId]
	);
	return rows;
}

async function findHistoryByUserId(userId) {
	const { rows } = await pool.query(
		`SELECT * FROM (
			SELECT tr.id, 'Virement envoyé' AS direction,
			       tr.amount * -1 AS amount, tr.currency, tr.status,
			       tr.recipient_name AS other_party,
			       COALESCE(tr.recipient_rib, tr.recipient_account_number, tr.recipient_iban) AS other_rib,
			       tr.created_at
			FROM transfers tr
			JOIN accounts source_account ON source_account.id = tr.sender_account_id
			WHERE source_account.user_id = $1
			UNION ALL
			SELECT tr.id, 'Virement reçu', tr.amount, tr.currency, tr.status,
			       sender.first_name || ' ' || sender.last_name,
			       COALESCE(source_account.rib, source_account.account_number, source_account.iban),
			       tr.created_at
			FROM transfers tr
			JOIN accounts receiver_account ON (
				tr.recipient_rib = receiver_account.rib
				OR tr.recipient_account_number = receiver_account.account_number
				OR tr.recipient_iban = receiver_account.iban
			)
			JOIN accounts source_account ON source_account.id = tr.sender_account_id
			JOIN users sender ON sender.id = source_account.user_id
			WHERE receiver_account.user_id = $1
		) transfer_history
		ORDER BY created_at DESC`,
		[userId]
	);
	return rows;
}

async function createTransfer(data) {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const sourceResult = await client.query(
			`SELECT id, user_id, account_number, rib, iban, balance, currency, status
			 FROM accounts
			 WHERE id = $1 AND user_id = $2`,
			[data.sourceAccountId, data.userId]
		);
		const sourcePreview = sourceResult.rows[0];
		if (!sourcePreview) throw transferError("Compte source introuvable.", 404);

		let beneficiaryId = null;
		let recipientName = "Destinataire";
		let recipientRib = data.recipientRib;

		if (data.beneficiaryId) {
			const beneficiaryResult = await client.query(
				`SELECT id, name, rib
				 FROM beneficiaries
				 WHERE id = $1 AND user_id = $2 AND status = 'active'`,
				[data.beneficiaryId, data.userId]
			);
			const beneficiary = beneficiaryResult.rows[0];
			if (!beneficiary) throw transferError("Bénéficiaire introuvable.", 404);
			beneficiaryId = beneficiary.id;
			recipientName = beneficiary.name;
			recipientRib = beneficiary.rib;
		}

		const destinationResult = await client.query(
			`SELECT id, user_id, account_number, rib, iban
			 FROM accounts
			 WHERE rib = $1`,
			[recipientRib]
		);
		const destinationPreview = destinationResult.rows[0] || null;
		const accountIds = [sourcePreview.id];
		if (destinationPreview) accountIds.push(destinationPreview.id);

		const lockedResult = await client.query(
			`SELECT id, user_id, account_number, rib, iban, balance, currency, status
			 FROM accounts
			 WHERE id = ANY($1::bigint[])
			 ORDER BY id
			 FOR UPDATE`,
			[accountIds]
		);

		let sourceAccount = null;
		let destinationAccount = null;
		for (const account of lockedResult.rows) {
			if (String(account.id) === String(sourcePreview.id)) sourceAccount = account;
			if (destinationPreview && String(account.id) === String(destinationPreview.id)) destinationAccount = account;
		}

		if (!sourceAccount || String(sourceAccount.user_id) !== String(data.userId)) {
			throw transferError("Compte source introuvable.", 404);
		}
		if (sourceAccount.status !== "active") {
			throw transferError("Le compte source doit être actif.", 400);
		}
		if (destinationPreview && !destinationAccount) {
			throw transferError("Compte destinataire introuvable.", 404);
		}
		if (destinationAccount) {
			if (destinationAccount.rib !== recipientRib) {
				throw transferError("Le RIB destinataire n'est plus valide.", 404);
			}
			if (String(destinationAccount.id) === String(sourceAccount.id)) {
				throw transferError("Le compte destinataire doit être différent du compte source.", 400);
			}
			if (destinationAccount.status !== "active") {
				throw transferError("Le compte destinataire n'est pas actif.", 400);
			}
			if (destinationAccount.currency !== sourceAccount.currency) {
				throw transferError("Les comptes doivent utiliser la même devise.", 400);
			}
			recipientName = "Client HosBank";
			const recipientResult = await client.query(
				"SELECT first_name, last_name FROM users WHERE id = $1",
				[destinationAccount.user_id]
			);
			if (recipientResult.rows[0]) {
				recipientName = recipientResult.rows[0].first_name + " " + recipientResult.rows[0].last_name;
			}
		}

		if (Number(sourceAccount.balance) < Number(data.amount)) {
			throw transferError("Solde insuffisant pour effectuer ce virement.", 400);
		}

		const debitResult = await client.query(
			`UPDATE accounts
			 SET balance = balance - $1, updated_at = NOW()
			 WHERE id = $2 AND user_id = $3 AND status = 'active' AND balance >= $1
			 RETURNING balance`,
			[data.amount, sourceAccount.id, data.userId]
		);
		if (!debitResult.rows[0]) {
			throw transferError("Solde insuffisant pour effectuer ce virement.", 400);
		}

		let creditBalance = null;
		if (destinationAccount) {
			const creditResult = await client.query(
				`UPDATE accounts
				 SET balance = balance + $1, updated_at = NOW()
				 WHERE id = $2 AND status = 'active'
				 RETURNING balance`,
				[data.amount, destinationAccount.id]
			);
			if (!creditResult.rows[0]) {
				throw transferError("Compte destinataire introuvable.", 404);
			}
			creditBalance = creditResult.rows[0].balance;
		}

		const transferResult = await client.query(
			`INSERT INTO transfers (
				sender_account_id, beneficiary_id, recipient_name,
				recipient_account_number, recipient_iban, recipient_rib,
				amount, currency, status, reference, executed_at
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', $9, NOW())
			RETURNING id, status, created_at, reference`,
			[
				sourceAccount.id,
				beneficiaryId,
				recipientName,
				destinationAccount ? destinationAccount.account_number : null,
				destinationAccount ? destinationAccount.iban : null,
				recipientRib,
				data.amount,
				sourceAccount.currency,
				data.reference,
			]
		);
		const transfer = transferResult.rows[0];

		await client.query(
			`INSERT INTO transactions (account_id, transfer_id, transaction_type, amount, balance_after, description, reference)
			 VALUES ($1, $2, 'transfer_out', $3, $4, $5, $6)`,
			[
				sourceAccount.id,
				transfer.id,
				(-Number(data.amount)).toFixed(2),
				debitResult.rows[0].balance,
				data.description,
				data.reference + "-OUT",
			]
		);

		if (destinationAccount) {
			await client.query(
				`INSERT INTO transactions (account_id, transfer_id, transaction_type, amount, balance_after, description, reference)
				 VALUES ($1, $2, 'transfer_in', $3, $4, $5, $6)`,
				[
					destinationAccount.id,
					transfer.id,
					data.amount,
					creditBalance,
					data.description,
					data.reference + "-IN",
				]
			);
		}

		await client.query("COMMIT");
		return transfer;
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

module.exports = {
	findUserById,
	findAccountsByUserId,
	findBeneficiariesByUserId,
	findHistoryByUserId,
	createTransfer,
};