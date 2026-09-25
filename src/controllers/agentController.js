const AgentService = require("../services/agentService");

async function listClients(req, res) {
	try {
		const clients = await AgentService.getAssignedClients(req.session.userId);
		res.render("agent/clients", { clients, error: null });
	} catch (error) {
		res.status(500).send(error.message);
	}
}

async function getWorkspace(req, res, errorMessage = null, statusCode = 200) {
	const workspace = await AgentService.getClientWorkspace(
		req.params.clientId,
		req.session.userId
	);
	res.status(statusCode).render("agent/client-detail", {
		...workspace,
		error: errorMessage,
	});
}

async function showClient(req, res) {
	try {
		await getWorkspace(req, res);
	} catch (error) {
		res.status(error.statusCode || 500).send(error.message);
	}
}

async function processRequest(req, res) {
	try {
		await AgentService.updateRequestStatus(
			req.params.clientId,
			req.params.requestId,
			req.session.userId,
			req.body.status,
			req.body.resolution_note
		);
		res.redirect(`/agent/clients/${req.params.clientId}`);
	} catch (error) {
		try {
			await getWorkspace(req, res, error.message, error.statusCode || 500);
		} catch (workspaceError) {
			res.status(workspaceError.statusCode || 500).send(workspaceError.message);
		}
	}
}

async function addRequestComment(req, res) {
	try {
		await AgentService.addRequestComment(
			req.params.clientId,
			req.params.requestId,
			req.session.userId,
			req.body.body
		);
		res.redirect(`/agent/clients/${req.params.clientId}`);
	} catch (error) {
		try {
			await getWorkspace(req, res, error.message, error.statusCode || 500);
		} catch (workspaceError) {
			res.status(workspaceError.statusCode || 500).send(workspaceError.message);
		}
	}
}

async function processComplaint(req, res) {
	try {
		await AgentService.updateComplaintStatus(
			req.params.clientId,
			req.params.complaintId,
			req.session.userId,
			req.body.status
		);
		res.redirect(`/agent/clients/${req.params.clientId}`);
	} catch (error) {
		try {
			await getWorkspace(req, res, error.message, error.statusCode || 500);
		} catch (workspaceError) {
			res.status(workspaceError.statusCode || 500).send(workspaceError.message);
		}
	}
}

async function addComplaintComment(req, res) {
	try {
		await AgentService.addComplaintComment(
			req.params.clientId,
			req.params.complaintId,
			req.session.userId,
			req.body.body
		);
		res.redirect(`/agent/clients/${req.params.clientId}`);
	} catch (error) {
		try {
			await getWorkspace(req, res, error.message, error.statusCode || 500);
		} catch (workspaceError) {
			res.status(workspaceError.statusCode || 500).send(workspaceError.message);
		}
	}
}

module.exports = {
	listClients,
	showClient,
	processRequest,
	addRequestComment,
	processComplaint,
	addComplaintComment,
};