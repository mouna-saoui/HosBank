const AgentRepository = require("../repositories/agentRepository");

const REQUEST_TRANSITIONS = {
	pending: ["in_progress", "approved", "rejected"],
	in_progress: ["approved", "rejected"],
	in_review: ["approved", "rejected"],
};

const COMPLAINT_STATUSES = ["pending", "in_progress", "resolved", "rejected"];

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function groupCommentsById(comments, propertyName) {
	return comments.reduce((groups, comment) => {
		const id = comment[propertyName];
		if (!groups[id]) groups[id] = [];
		groups[id].push(comment);
		return groups;
	}, {});
}

async function getAssignedClients(agentId) {
	return AgentRepository.findAssignedClients(agentId);
}

async function getClientWorkspace(clientId, agentId) {
	const client = await AgentRepository.findAssignedClient(clientId, agentId);
	if (!client) throw createError("Client introuvable ou non affecté.", 404);

	const [accounts, requests, requestComments, complaints, complaintComments, interactions] = await Promise.all([
		AgentRepository.findAccountsByClient(clientId, agentId),
		AgentRepository.findRequestsByClient(clientId, agentId),
		AgentRepository.findRequestCommentsByClient(clientId, agentId),
		AgentRepository.findComplaintsByClient(clientId, agentId),
		AgentRepository.findComplaintCommentsByClient(clientId, agentId),
		AgentRepository.findInteractionsByClient(clientId, agentId),
	]);

	const requestCommentsById = groupCommentsById(requestComments, "request_id");
	const complaintCommentsById = groupCommentsById(complaintComments, "complaint_id");

	for (const request of requests) {
		request.comments = requestCommentsById[request.id] || [];
	}

	for (const complaint of complaints) {
		complaint.comments = complaintCommentsById[complaint.id] || [];
	}

	await AgentRepository.addInteraction(clientId, agentId, "Client consulté");

	return { client, accounts, requests, complaints, interactions };
}

async function updateRequestStatus(clientId, requestId, agentId, status, resolutionNote) {
	const request = await AgentRepository.findRequestByIdForAgent(requestId, agentId);
	if (!request) throw createError("Demande introuvable ou non autorisée.", 404);
	if (String(request.user_id) !== String(clientId)) {
		throw createError("Demande introuvable ou non autorisée.", 404);
	}

	const allowedStatuses = REQUEST_TRANSITIONS[request.status] || [];
	if (!allowedStatuses.includes(status)) {
		throw createError("Cette transition de statut n'est pas autorisée.", 400);
	}

	const note = resolutionNote ? resolutionNote.trim() : null;
	const updatedRequest = await AgentRepository.updateRequestStatus(
		requestId,
		agentId,
		status,
		note || null
	);

	if (!updatedRequest) throw createError("Demande introuvable ou non autorisée.", 404);

	const action = status === "approved" ? "approuvée" : status === "rejected" ? "refusée" : "mise en cours";
	await AgentRepository.addInteraction(request.user_id, agentId, `Demande ${action}`);
	return updatedRequest;
}

async function addRequestComment(clientId, requestId, agentId, body) {
	const request = await AgentRepository.findRequestByIdForAgent(requestId, agentId);
	if (!request) throw createError("Demande introuvable ou non autorisée.", 404);
	if (String(request.user_id) !== String(clientId)) {
		throw createError("Demande introuvable ou non autorisée.", 404);
	}

	const comment = body ? body.trim() : "";
	if (!comment) throw createError("Le commentaire est obligatoire.", 400);

	const savedComment = await AgentRepository.addRequestComment(requestId, agentId, comment);
	if (!savedComment) throw createError("Demande introuvable ou non autorisée.", 404);

	await AgentRepository.addInteraction(request.user_id, agentId, "Commentaire ajouté à une demande");
	return savedComment;
}

async function updateComplaintStatus(clientId, complaintId, agentId, status) {
	const complaint = await AgentRepository.findComplaintByIdForAgent(complaintId, agentId);
	if (!complaint) throw createError("Réclamation introuvable ou non autorisée.", 404);
	if (String(complaint.user_id) !== String(clientId)) {
		throw createError("Réclamation introuvable ou non autorisée.", 404);
	}
	if (!COMPLAINT_STATUSES.includes(status)) throw createError("Statut de réclamation invalide.", 400);

	const updatedComplaint = await AgentRepository.updateComplaintStatus(complaintId, agentId, status);
	if (!updatedComplaint) throw createError("Réclamation introuvable ou non autorisée.", 404);

	await AgentRepository.addInteraction(
		complaint.user_id,
		agentId,
		`Réclamation traitée : ${status}`
	);
	return updatedComplaint;
}

async function addComplaintComment(clientId, complaintId, agentId, body) {
	const complaint = await AgentRepository.findComplaintByIdForAgent(complaintId, agentId);
	if (!complaint) throw createError("Réclamation introuvable ou non autorisée.", 404);
	if (String(complaint.user_id) !== String(clientId)) {
		throw createError("Réclamation introuvable ou non autorisée.", 404);
	}

	const comment = body ? body.trim() : "";
	if (!comment) throw createError("Le commentaire est obligatoire.", 400);

	const savedComment = await AgentRepository.addComplaintComment(complaintId, agentId, comment);
	if (!savedComment) throw createError("Réclamation introuvable ou non autorisée.", 404);

	await AgentRepository.addInteraction(complaint.user_id, agentId, "Commentaire ajouté à une réclamation");
	return savedComment;
}

module.exports = {
	getAssignedClients,
	getClientWorkspace,
	updateRequestStatus,
	addRequestComment,
	updateComplaintStatus,
	addComplaintComment,
};