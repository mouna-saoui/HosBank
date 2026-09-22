const beneficiaryService = require("../services/beneficiaryService");

function sendError(res, error) {
	const statusCode = error.statusCode || (error.code === "23505" ? 400 : 500);
	return res.status(statusCode).json({ error: error.message });
}

async function create(req, res) {
	try {
		return res.status(201).json(await beneficiaryService.create(req.session.userId, req.body));
	} catch (error) {
		return sendError(res, error);
	}
}

async function list(req, res) {
	try {
		return res.status(200).json(await beneficiaryService.list(req.session.userId));
	} catch (error) {
		return sendError(res, error);
	}
}

async function get(req, res) {
	try {
		return res.status(200).json(await beneficiaryService.get(req.session.userId, req.params.id));
	} catch (error) {
		return sendError(res, error);
	}
}

async function update(req, res) {
	try {
		return res.status(200).json(
			await beneficiaryService.update(req.session.userId, req.params.id, req.body)
		);
	} catch (error) {
		return sendError(res, error);
	}
}

async function remove(req, res) {
	try {
		await beneficiaryService.remove(req.session.userId, req.params.id);
		return res.status(204).send();
	} catch (error) {
		return sendError(res, error);
	}
}

module.exports = { create, list, get, update, remove };