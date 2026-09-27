const AgentService = require("../services/agentService");

async function listClients(req, res) {
	try {
		const userId = req.session.userId;
		const layout = await AgentService.getAgentLayoutData(userId);
		const clients = await AgentService.getAssignedClients(userId);

		layout.clients = clients;
		layout.activePage = "agent-clients";

		res.render("agent/clients", layout);
	} catch (error) {
		res.status(500).send(error.message);
	}
}

async function getWorkspace(req, res, errorMessage, statusCode) {
	const clientId = req.params.clientId;
	const userId = req.session.userId;
	const currentStatusCode = statusCode || 200;

	const workspace = await AgentService.getClientWorkspace(clientId, userId);
	const layout = await AgentService.getAgentLayoutData(userId);

	const renderData = {
		userRole: layout.userRole,
		userName: layout.userName,
		client: workspace.client,
		accounts: workspace.accounts,
		requests: workspace.requests,
		complaints: workspace.complaints,
		interactions: workspace.interactions,
		error: errorMessage || null,
		activePage: "agent-clients",
	};

	res.status(currentStatusCode).render("agent/client-detail", renderData);
}

async function showClient(req, res) {
	try {
		await getWorkspace(req, res, null, 200);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function showDashboard(req, res) {
	try {
		const userId = req.session.userId;
		const data = await AgentService.getDashboardData(userId);

		data.activePage = "agent-dashboard";
		res.render("agent/dashboard", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function listRequests(req, res) {
	try {
		const userId = req.session.userId;
		const requestType = req.query.type || "";
		const data = await AgentService.getRequestsPageData(userId, requestType);

		data.activePage = "agent-requests";
		res.render("agent/requests", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function showRequest(req, res) {
	try {
		const requestId = req.params.id;
		const userId = req.session.userId;
		const data = await AgentService.getRequestPageData(requestId, userId);

		data.activePage = "agent-requests";
		data.error = null;

		res.render("agent/request-detail", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function listClaims(req, res) {
	try {
		const userId = req.session.userId;
		const data = await AgentService.getClaimsPageData(userId);

		data.activePage = "agent-claims";
		res.render("agent/claims", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function showClaim(req, res) {
	try {
		const claimId = req.params.id;
		const userId = req.session.userId;
		const data = await AgentService.getClaimPageData(claimId, userId);

		data.activePage = "agent-claims";
		data.error = null;

		res.render("agent/claim-detail", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function listInteractions(req, res) {
	try {
		const userId = req.session.userId;
		const data = await AgentService.getInteractionsPageData(userId);

		data.activePage = "agent-interactions";
		res.render("agent/interactions", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function processRequest(req, res) {
	const clientId = req.params.clientId;
	const requestId = req.params.requestId;
	const userId = req.session.userId;
	const status = req.body.status;
	const resolutionNote = req.body.resolution_note;

	try {
		await AgentService.updateRequestStatus(
			clientId,
			requestId,
			userId,
			status,
			resolutionNote
		);
		res.redirect("/agent/clients/" + clientId);
	} catch (error) {
		try {
			const statusCode = error.statusCode || 500;
			await getWorkspace(req, res, error.message, statusCode);
		} catch (workspaceError) {
			const statusCode = workspaceError.statusCode || 500;
			res.status(statusCode).send(workspaceError.message);
		}
	}
}

async function addRequestComment(req, res) {
	const clientId = req.params.clientId;
	const requestId = req.params.requestId;
	const userId = req.session.userId;
	const commentBody = req.body.body;

	try {
		await AgentService.addRequestComment(
			clientId,
			requestId,
			userId,
			commentBody
		);
		res.redirect("/agent/clients/" + clientId);
	} catch (error) {
		try {
			const statusCode = error.statusCode || 500;
			await getWorkspace(req, res, error.message, statusCode);
		} catch (workspaceError) {
			const statusCode = workspaceError.statusCode || 500;
			res.status(statusCode).send(workspaceError.message);
		}
	}
}

async function processComplaint(req, res) {
	const clientId = req.params.clientId;
	const complaintId = req.params.complaintId;
	const userId = req.session.userId;
	const status = req.body.status;

	try {
		await AgentService.updateComplaintStatus(
			clientId,
			complaintId,
			userId,
			status
		);
		res.redirect("/agent/clients/" + clientId);
	} catch (error) {
		try {
			const statusCode = error.statusCode || 500;
			await getWorkspace(req, res, error.message, statusCode);
		} catch (workspaceError) {
			const statusCode = workspaceError.statusCode || 500;
			res.status(statusCode).send(workspaceError.message);
		}
	}
}

async function addComplaintComment(req, res) {
	const clientId = req.params.clientId;
	const complaintId = req.params.complaintId;
	const userId = req.session.userId;
	const commentBody = req.body.body;

	try {
		await AgentService.addComplaintComment(
			clientId,
			complaintId,
			userId,
			commentBody
		);
		res.redirect("/agent/clients/" + clientId);
	} catch (error) {
		try {
			const statusCode = error.statusCode || 500;
			await getWorkspace(req, res, error.message, statusCode);
		} catch (workspaceError) {
			const statusCode = workspaceError.statusCode || 500;
			res.status(statusCode).send(workspaceError.message);
		}
	}
}

module.exports = {
	showDashboard,
	listClients,
	showClient,
	listRequests,
	showRequest,
	listClaims,
	showClaim,
	listInteractions,
	processRequest,
	addRequestComment,
	processComplaint,
	addComplaintComment,
};