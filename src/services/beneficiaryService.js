const beneficiaryRepository = require("../repositories/beneficiaryRepository");

function validateId(id) {
	if (!/^\d+$/.test(String(id))) {
		const error = new Error("Invalid beneficiary id");
		error.statusCode = 400;
		throw error;
	}
}

function validateData(data) {
	const name = typeof data?.name === "string" ? data.name.trim() : "";
	const rib = typeof data?.rib === "string" ? data.rib.trim() : "";
	const bankName = typeof data?.bank_name === "string" ? data.bank_name.trim() : "";

	if (!name || !rib || !bankName) {
		const error = new Error("name, rib and bank_name are required");
		error.statusCode = 400;
		throw error;
	}

	return { name, rib, bankName };
}

async function create(userId, data) {
	const beneficiary = validateData(data);
	if (await beneficiaryRepository.findByRibForUser(beneficiary.rib, userId)) {
		const error = new Error("A beneficiary with this RIB already exists");
		error.statusCode = 400;
		throw error;
	}

	return beneficiaryRepository.create(userId, beneficiary);
}

async function list(userId) {
	return beneficiaryRepository.findAllByUserId(userId);
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
	if (await beneficiaryRepository.findByRibForUser(values.rib, userId, beneficiary.id)) {
		const error = new Error("A beneficiary with this RIB already exists");
		error.statusCode = 400;
		throw error;
	}

	return beneficiaryRepository.update(id, userId, values);
}

async function remove(userId, id) {
	await get(userId, id);
	return beneficiaryRepository.remove(id, userId);
}

module.exports = { create, list, get, update, remove };