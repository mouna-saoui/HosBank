const beneficiaryRepository = require("../repositories/beneficiaryRepository");

function validateId(id) {
	const numericId = Number(id);
	if (isNaN(numericId) || numericId <= 0) {
		const error = new Error("Invalid beneficiary id");
		error.statusCode = 400;
		throw error;
	}
}

function validateData(data) {
	let name = "";
	let rib = "";
	let bankName = "";

	if (data && data.name && typeof data.name === "string") {
		name = data.name.trim();
	}
	if (data && data.rib && typeof data.rib === "string") {
		rib = data.rib.trim();
	}
	if (data && data.bank_name && typeof data.bank_name === "string") {
		bankName = data.bank_name.trim();
	}

	if (!name || !rib || !bankName) {
		const error = new Error("name, rib and bank_name are required");
		error.statusCode = 400;
		throw error;
	}

	return { name, rib, bankName };
}

async function create(userId, data) {
	const beneficiary = validateData(data);
	const existingBeneficiary = await beneficiaryRepository.findByRibForUser(beneficiary.rib, userId);

	if (existingBeneficiary) {
		const error = new Error("A beneficiary with this RIB already exists");
		error.statusCode = 400;
		throw error;
	}

	return await beneficiaryRepository.create(userId, beneficiary);
}

async function list(userId) {
	return await beneficiaryRepository.findAllByUserId(userId);
}

async function get(userId, id) {
	validateId(id);
	const beneficiary = await beneficiaryRepository.findById(id);

	if (!beneficiary) {
		const error = new Error("Beneficiary not found");
		error.statusCode = 404;
		throw error;
	}

	if (String(beneficiary.user_id) !== String(userId)) {
		const error = new Error("Access denied");
		error.statusCode = 403;
		throw error;
	}

	return beneficiary;
}

async function update(userId, id, data) {
	const beneficiary = await get(userId, id);
	const values = validateData(data);
	const existingBeneficiary = await beneficiaryRepository.findByRibForUser(values.rib, userId, beneficiary.id);

	if (existingBeneficiary) {
		const error = new Error("A beneficiary with this RIB already exists");
		error.statusCode = 400;
		throw error;
	}

	return await beneficiaryRepository.update(id, userId, values);
}

async function remove(userId, id) {
	await get(userId, id);
	return await beneficiaryRepository.remove(id, userId);
}

module.exports = { create, list, get, update, remove };