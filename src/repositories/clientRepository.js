const pool = require("../config/Database");

async function findClientById(userId) {
	const result = await pool.query(
		`SELECT id, first_name, last_name, email, phone, status, created_at
		 FROM users
		 WHERE id = $1 AND role_id = 1`,
		[userId]
	);

	return result.rows[0] || null;
}

async function findAccountsByClientId(userId) {
	const result = await pool.query(
		`SELECT id, account_number, account_type, iban, rib, balance, currency, status, created_at, updated_at
		 FROM accounts
		 WHERE user_id = $1
		 ORDER BY created_at ASC`,
		[userId]
	);

	return result.rows;
}

async function findRecentTransactionsByClientId(userId) {
	const result = await pool.query(
		`SELECT t.id, t.account_id, a.account_number, t.transaction_type, t.amount,
				t.balance_after, t.description, t.reference, t.created_at
		 FROM transactions t
		 JOIN accounts a ON a.id = t.account_id
		 WHERE a.user_id = $1
		 ORDER BY t.created_at DESC
		 LIMIT 10`,
		[userId]
	);

	return result.rows;
}

async function findPendingRequestsByClientId(userId) {
	const result = await pool.query(
		`SELECT id, request_type, status, details, resolution_note, created_at, updated_at
		 FROM bank_requests
		 WHERE user_id = $1 AND status IN ('pending', 'in_review')
		 ORDER BY created_at DESC`,
		[userId]
	);

	return result.rows;
}

module.exports = {
	findClientById,
	findAccountsByClientId,
	findRecentTransactionsByClientId,
	findPendingRequestsByClientId,
};