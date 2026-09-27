const beneficiaryService = require("../services/beneficiaryService");

function sendError(res, error) {
	let statusCode = 500;

	if (error.statusCode) {
		statusCode = error.statusCode;
	} else if (error.code === "23505") {
		statusCode = 400;
	}

	return res.status(statusCode).json({ error: error.message });
}

async function create(req, res) {
	try {
		const userId = req.session.userId;
		const data = req.body;
		const result = await beneficiaryService.create(userId, data);

		return res.status(201).json(result);
	} catch (error) {
		return sendError(res, error);
	}
}

async function list(req, res) {
	try {
		const userId = req.session.userId;
		const result = await beneficiaryService.list(userId);

		return res.status(200).json(result);
	} catch (error) {
		return sendError(res, error);
	}
}

async function get(req, res) {
	try {
		const userId = req.session.userId;
		const beneficiaryId = req.params.id;
		const result = await beneficiaryService.get(userId, beneficiaryId);

		return res.status(200).json(result);
	} catch (error) {
		return sendError(res, error);
	}
}

async function update(req, res) {
	try {
		const userId = req.session.userId;
		const beneficiaryId = req.params.id;
		const data = req.body;
		const result = await beneficiaryService.update(userId, beneficiaryId, data);

		return res.status(200).json(result);
	} catch (error) {
		return sendError(res, error);
	}
}

async function remove(req, res) {
	try {
		const userId = req.session.userId;
		const beneficiaryId = req.params.id;

		await beneficiaryService.remove(userId, beneficiaryId);

		return res.status(204).send();
	} catch (error) {
		return sendError(res, error);
	}
}

module.exports = { create, list, get, update, remove };