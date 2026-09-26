const crypto = require("crypto");
const TransferRepository = require("../repositories/TransferRepository");

function transferError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function validateId(value, label) {
	const id = Number(value);
	if (!Number.isInteger(id) || id <= 0) {
		throw transferError(label + " invalide.", 400);
	}
	return id;
}

async function getPageData(userId) {
	const user = await TransferRepository.findUserById(userId);
	if (!user) throw transferError("Client introuvable.", 404);

	const accounts = await TransferRepository.findAccountsByUserId(userId);
	const beneficiaries = await TransferRepository.findBeneficiariesByUserId(userId);
	const history = await TransferRepository.findHistoryByUserId(userId);

	return {
		userRole: 1,
		userName: user.first_name + " " + user.last_name,
		accounts: accounts,
		beneficiaries: beneficiaries,
		history: history,
	};
}

async function createTransfer(userId, formData) {
	const sourceAccountId = validateId(formData.source_account_id, "Compte source");
	const amount = Number(formData.amount);
	if (!Number.isFinite(amount) || amount <= 0) {
		throw transferError("Le montant doit être supérieur à zéro.", 400);
	}
	if (amount > 9999999999999.99 || Math.round(amount * 100) / 100 !== amount) {
		throw transferError("Le montant doit être valide et comporter au maximum deux décimales.", 400);
	}

	let beneficiaryId = null;
	let recipientRib = "";
	if (formData.beneficiary_id) {
		beneficiaryId = validateId(formData.beneficiary_id, "Bénéficiaire");
		if (formData.recipient_rib && formData.recipient_rib.trim()) {
			throw transferError("Choisissez un bénéficiaire ou saisissez un RIB, pas les deux.", 400);
		}
	} else if (typeof formData.recipient_rib === "string") {
		recipientRib = formData.recipient_rib.trim();
	}
	if (!beneficiaryId && !recipientRib) {
		throw transferError("Choisissez un bénéficiaire ou saisissez un RIB destinataire.", 400);
	}
	if (recipientRib.length > 50) {
		throw transferError("Le RIB ne doit pas dépasser 50 caractères.", 400);
	}

	const description = typeof formData.description === "string" ? formData.description.trim() : "";
	if (!description) throw transferError("Le motif du virement est obligatoire.", 400);
	if (description.length > 255) {
		throw transferError("Le motif ne doit pas dépasser 255 caractères.", 400);
	}

	return TransferRepository.createTransfer({
		userId: userId,
		sourceAccountId: sourceAccountId,
		beneficiaryId: beneficiaryId,
		recipientRib: recipientRib,
		amount: amount.toFixed(2),
		description: description,
		reference: "TRF-" + crypto.randomUUID(),
	});
}

module.exports = { getPageData, createTransfer };