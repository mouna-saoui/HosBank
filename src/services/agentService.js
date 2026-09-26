const AgentRepository = require("../repositories/agentRepository");

const REQUEST_TRANSITIONS = {
	pending: ["in_progress", "approved", "rejected"],
	in_progress: ["approved", "rejected"],
	in_review: ["approved", "rejected"],
};

const COMPLAINT_STATUSES = ["pending", "in_progress", "resolved", "rejected"];
const REQUEST_TYPES = ["rib", "savings_account", "virtual_card", "pin", "opposition"];

function validId(value) {
	const id = Number(value);
	return Number.isInteger(id) && id > 0;
}

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function groupCommentsById(comments, propertyName) {
	const groups = {};
	for (let i = 0; i < comments.length; i++) {
		const comment = comments[i];
		const key = comment[propertyName];

		if (!groups[key]) {
			groups[key] = [];
		}
		groups[key].push(comment);
	}
	return groups;
}

async function getAssignedClients(agentId) {
	return await AgentRepository.findAssignedClients(agentId);
}

async function getAgentLayoutData(agentId) {
	const agent = await AgentRepository.findAgentById(agentId);
	if (!agent) {
		throw createError("Agent introuvable.", 404);
	}

	return {
		userRole: 2,
		userName: agent.first_name + " " + agent.last_name,
	};
}

async function getDashboardData(agentId) {
	const layout = await getAgentLayoutData(agentId);

	const clientsCount = await AgentRepository.countAssignedClients(agentId);
	const pendingRequestsCount = await AgentRepository.countPendingRequests(agentId);
	const inProgressRequestsCount = await AgentRepository.countInProgressRequests(agentId);
	const pendingComplaintsCount = await AgentRepository.countPendingComplaints(agentId);

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		stats: {
			clients: clientsCount,
			pendingRequests: pendingRequestsCount,
			inProgressRequests: inProgressRequestsCount,
			pendingComplaints: pendingComplaintsCount
		},
	};
}

async function getRequestsPageData(agentId, requestType) {
	const layout = await getAgentLayoutData(agentId);
	let selectedType = requestType || null;
	if (selectedType && !REQUEST_TYPES.includes(selectedType)) {
		throw createError("Type de demande invalide.", 400);
	}
	const requests = await AgentRepository.findAssignedRequests(agentId, selectedType);

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		requests: requests,
		requestType: selectedType,
		requestTypes: REQUEST_TYPES
	};
}

async function getRequestPageData(requestId, agentId) {
	if (!validId(requestId)) {
		throw createError("Identifiant de demande invalide.", 400);
	}
	const layout = await getAgentLayoutData(agentId);
	const request = await AgentRepository.findAssignedRequestById(requestId, agentId);

	if (!request) {
		throw createError("Demande introuvable ou non affectée.", 404);
	}

	const comments = await AgentRepository.findRequestCommentsByRequest(requestId, agentId);
	request.comments = comments;
	await AgentRepository.addInteraction(request.client_id, agentId, "Demande consultée");

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		request: request
	};
}

async function getClaimsPageData(agentId) {
	const layout = await getAgentLayoutData(agentId);
	const claims = await AgentRepository.findAssignedComplaints(agentId);

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		claims: claims
	};
}

async function getClaimPageData(complaintId, agentId) {
	if (!validId(complaintId)) {
		throw createError("Identifiant de réclamation invalide.", 400);
	}
	const layout = await getAgentLayoutData(agentId);
	const claim = await AgentRepository.findAssignedComplaintById(complaintId, agentId);

	if (!claim) {
		throw createError("Réclamation introuvable ou non affectée.", 404);
	}

	const comments = await AgentRepository.findComplaintCommentsByComplaint(complaintId, agentId);
	claim.comments = comments;
	await AgentRepository.addInteraction(claim.client_id, agentId, "Réclamation consultée");

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		claim: claim
	};
}

async function getInteractionsPageData(agentId) {
	const layout = await getAgentLayoutData(agentId);
	const interactions = await AgentRepository.findInteractions(agentId);

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		interactions: interactions
	};
}

async function getClientWorkspace(clientId, agentId) {
	const client = await AgentRepository.findAssignedClient(clientId, agentId);
	if (!client) {
		throw createError("Client introuvable ou non affecté.", 404);
	}

	const accounts = await AgentRepository.findAccountsByClient(clientId, agentId);
	const requests = await AgentRepository.findRequestsByClient(clientId, agentId);
	const requestComments = await AgentRepository.findRequestCommentsByClient(clientId, agentId);
	const complaints = await AgentRepository.findComplaintsByClient(clientId, agentId);
	const complaintComments = await AgentRepository.findComplaintCommentsByClient(clientId, agentId);
	const interactions = await AgentRepository.findInteractionsByClient(clientId, agentId);

	const requestCommentsById = groupCommentsById(requestComments, "request_id");
	for (let i = 0; i < requests.length; i++) {
		const req = requests[i];
		req.comments = requestCommentsById[req.id] || [];
	}

	const complaintCommentsById = groupCommentsById(complaintComments, "complaint_id");
	for (let i = 0; i < complaints.length; i++) {
		const comp = complaints[i];
		comp.comments = complaintCommentsById[comp.id] || [];
	}

	await AgentRepository.addInteraction(clientId, agentId, "Client consulté");

	return {
		client: client,
		accounts: accounts,
		requests: requests,
		complaints: complaints,
		interactions: interactions
	};
}

async function updateRequestStatus(clientId, requestId, agentId, status, resolutionNote) {
	if (!validId(clientId) || !validId(requestId)) {
		throw createError("Identifiant invalide.", 400);
	}
	const request = await AgentRepository.findRequestByIdForAgent(requestId, agentId);

	if (!request || String(request.user_id) !== String(clientId)) {
		throw createError("Demande introuvable ou non autorisée.", 404);
	}

	const allowedStatuses = REQUEST_TRANSITIONS[request.status] || [];
	if (!allowedStatuses.includes(status)) {
		throw createError("Cette transition de statut n'est pas autorisée.", 400);
	}

	const note = resolutionNote ? resolutionNote.trim() : null;
	const updatedRequest = await AgentRepository.updateRequestStatus(requestId, agentId, status, note);

	if (!updatedRequest) {
		throw createError("Demande introuvable ou non autorisée.", 404);
	}
	if (request.request_type === "savings_account" && status === "approved") {
		const AccountService = require("./AccountService");
		await AccountService.createAccount(request.user_id, "savings");
	}
	if (note) {
		await AgentRepository.addRequestComment(requestId, agentId, note);
		await AgentRepository.addInteraction(request.user_id, agentId, "Commentaire ajouté à une demande");
	}

	let action = "mise en cours";
	if (status === "approved") action = "approuvée";
	if (status === "rejected") action = "refusée";

	await AgentRepository.addInteraction(request.user_id, agentId, `Demande ${action}`);
	return updatedRequest;
}

async function addRequestComment(clientId, requestId, agentId, body) {
	if (!validId(clientId) || !validId(requestId)) {
		throw createError("Identifiant invalide.", 400);
	}
	const request = await AgentRepository.findRequestByIdForAgent(requestId, agentId);

	if (!request || String(request.user_id) !== String(clientId)) {
		throw createError("Demande introuvable ou non autorisée.", 404);
	}

	const comment = body ? body.trim() : "";
	if (!comment) {
		throw createError("Le commentaire est obligatoire.", 400);
	}
	if (comment.length > 2000) {
		throw createError("Le commentaire ne doit pas dépasser 2000 caractères.", 400);
	}

	const savedComment = await AgentRepository.addRequestComment(requestId, agentId, comment);
	if (!savedComment) {
		throw createError("Demande introuvable ou non autorisée.", 404);
	}

	await AgentRepository.addInteraction(request.user_id, agentId, "Commentaire ajouté à une demande");
	return savedComment;
}

async function updateComplaintStatus(clientId, complaintId, agentId, status) {
	if (!validId(clientId) || !validId(complaintId)) {
		throw createError("Identifiant invalide.", 400);
	}
	const complaint = await AgentRepository.findComplaintByIdForAgent(complaintId, agentId);

	if (!complaint || String(complaint.user_id) !== String(clientId)) {
		throw createError("Réclamation introuvable ou non autorisée.", 404);
	}

	if (!COMPLAINT_STATUSES.includes(status)) {
		throw createError("Statut de réclamation invalide.", 400);
	}

	const updatedComplaint = await AgentRepository.updateComplaintStatus(complaintId, agentId, status);
	if (!updatedComplaint) {
		throw createError("Réclamation introuvable ou non autorisée.", 404);
	}

	await AgentRepository.addInteraction(complaint.user_id, agentId, `Réclamation traitée : ${status}`);
	return updatedComplaint;
}

async function addComplaintComment(clientId, complaintId, agentId, body) {
	if (!validId(clientId) || !validId(complaintId)) {
		throw createError("Identifiant invalide.", 400);
	}
	const complaint = await AgentRepository.findComplaintByIdForAgent(complaintId, agentId);

	if (!complaint || String(complaint.user_id) !== String(clientId)) {
		throw createError("Réclamation introuvable ou non autorisée.", 404);
	}

	const comment = body ? body.trim() : "";
	if (!comment) {
		throw createError("Le commentaire est obligatoire.", 400);
	}
	if (comment.length > 2000) {
		throw createError("Le commentaire ne doit pas dépasser 2000 caractères.", 400);
	}

	const savedComment = await AgentRepository.addComplaintComment(complaintId, agentId, comment);
	if (!savedComment) {
		throw createError("Réclamation introuvable ou non autorisée.", 404);
	}

	await AgentRepository.addInteraction(complaint.user_id, agentId, "Commentaire ajouté à une réclamation");
	return savedComment;
}

module.exports = {
	getAgentLayoutData,
	getDashboardData,
	getRequestsPageData,
	getRequestPageData,
	getClaimsPageData,
	getClaimPageData,
	getInteractionsPageData,
	getAssignedClients,
	getClientWorkspace,
	updateRequestStatus,
	addRequestComment,
	updateComplaintStatus,
	addComplaintComment,
};