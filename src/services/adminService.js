const AdminRepository = require("../repositories/adminRepository");

const VALID_ROLES = [1, 2, 3];
const VALID_USER_STATUSES = ["active", "inactive", "blocked"];
const VALID_ACCOUNT_STATUSES = ["active", "blocked", "closed"];
const VALID_CARD_STATUSES = ["active", "blocked", "expired", "cancelled"];
const VALID_REQUEST_STATUSES = ["pending", "in_progress", "in_review", "approved", "rejected", "completed", "cancelled"];
const VALID_COMPLAINT_STATUSES = ["pending", "open", "in_progress", "resolved", "rejected", "closed"];

function adminError(message, statusCode = 400) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

function checkId(value) {
	const id = Number(value);
	if (!Number.isInteger(id) || id <= 0) {
		throw adminError("Identifiant invalide.");
	}
	return id;
}

async function getLayoutData(adminId) {
	const admin = await AdminRepository.findUserById(adminId);

	if (!admin || admin.role_name !== "Administrateur") {
		throw adminError("Administrateur introuvable.", 403);
	}

	return {
		userRole: 3,
		userName: admin.first_name + " " + admin.last_name,
	};
}

async function getDashboardData(adminId) {
	const layout = await getLayoutData(adminId);

	const usersCount = await AdminRepository.countUsers();
	const clientsCount = await AdminRepository.countUsersByRole("Client");
	const agentsCount = await AdminRepository.countUsersByRole("Chargé Client");
	const accountsCount = await AdminRepository.countAccounts();
	const activeAccountsCount = await AdminRepository.countAccounts("active");
	const cardsCount = await AdminRepository.countCards();
	const operationsCount = await AdminRepository.countOperations();
	const pendingRequestsCount = await AdminRepository.countRequests();
	const pendingComplaintsCount = await AdminRepository.countComplaints();

	const recentUsers = await AdminRepository.findRecentUsers();
	const recentRequests = await AdminRepository.findPendingRequests();
	const recentOperations = await AdminRepository.findRecentOperations();
	const assignments = await AdminRepository.findAssignments();
	const agentActivity = await AdminRepository.findAgentActivity();

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		stats: {
			users: usersCount,
			clients: clientsCount,
			agents: agentsCount,
			accounts: accountsCount,
			activeAccounts: activeAccountsCount,
			cards: cardsCount,
			operations: operationsCount,
			pendingRequests: pendingRequestsCount,
			pendingComplaints: pendingComplaintsCount
		},
		recentUsers: recentUsers,
		recentRequests: recentRequests,
		recentOperations: recentOperations,
		assignments: assignments,
		agentActivity: agentActivity
	};
}

async function getUsersPageData(adminId, filters) {
	let search = "";
	let roleId = "";
	let status = "";

	if (typeof filters.search === "string") {
		search = filters.search.trim().slice(0, 100);
	}
	if (filters.roleId) {
		roleId = Number(filters.roleId);
		if (!Number.isInteger(roleId) || !VALID_ROLES.includes(roleId)) {
			throw adminError("Rôle invalide.");
		}
	}
	if (filters.status) {
		status = filters.status;
		if (!VALID_USER_STATUSES.includes(status)) {
			throw adminError("Statut utilisateur invalide.");
		}
	}

	const layout = await getLayoutData(adminId);
	const users = await AdminRepository.findUsers({ search: search, roleId: roleId, status: status });
	const roles = await AdminRepository.findRoles();

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		users: users,
		roles: roles,
		filters: { search: search, roleId: roleId, status: status }
	};
}

async function changeUserStatus(userId, status, adminId) {
	const id = checkId(userId);
	if (id === checkId(adminId)) {
		throw adminError("Vous ne pouvez pas modifier le statut de votre propre compte.", 403);
	}

	if (!VALID_USER_STATUSES.includes(status)) {
		throw adminError("Statut utilisateur invalide.");
	}

	const updated = await AdminRepository.updateUserStatus(id, status);
	if (!updated) {
		throw adminError("Utilisateur introuvable.", 404);
	}

	return updated;
}

async function changeUserRole(userId, roleId, adminId) {
	const id = checkId(userId);
	if (id === checkId(adminId)) {
		throw adminError("Vous ne pouvez pas modifier votre propre rôle.", 403);
	}
	const role = Number(roleId);

	if (!VALID_ROLES.includes(role)) {
		throw adminError("Rôle invalide.");
	}

	const updated = await AdminRepository.updateUserRole(id, role);
	if (!updated) {
		throw adminError("Utilisateur introuvable.", 404);
	}

	return updated;
}

async function getAssignmentsPageData(adminId) {
	const layout = await getLayoutData(adminId);
	const clients = await AdminRepository.findClients();
	const agents = await AdminRepository.findAgents();
	const assignments = await AdminRepository.findAssignments();

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		clients: clients,
		agents: agents,
		assignments: assignments
	};
}

async function assignClient(clientId, agentId) {
	const client = checkId(clientId);
	const agent = checkId(agentId);

	try {
		return await AdminRepository.assignClient(client, agent);
	} catch (error) {
		if (error.code === "23505") {
			throw adminError("Ce client est déjà affecté à ce Chargé Client.");
		}
		if (error.code === "P0001") {
			throw adminError(error.message);
		}
		if (error.code === "23503") {
			throw adminError("Client ou Chargé Client introuvable.", 404);
		}
		throw error;
	}
}

async function getAccountsPageData(adminId) {
	const layout = await getLayoutData(adminId);
	const accounts = await AdminRepository.findAccounts();

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		accounts: accounts
	};
}

async function changeAccountStatus(accountId, status) {
	const id = checkId(accountId);

	if (!VALID_ACCOUNT_STATUSES.includes(status)) {
		throw adminError("Statut de compte invalide.");
	}

	const updated = await AdminRepository.updateAccountStatus(id, status);
	if (!updated) {
		throw adminError("Compte introuvable.", 404);
	}

	return updated;
}

async function getCardsPageData(adminId) {
	const layout = await getLayoutData(adminId);
	const cards = await AdminRepository.findCards();

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		cards: cards
	};
}

async function changeCardStatus(cardId, status) {
	const id = checkId(cardId);

	if (!VALID_CARD_STATUSES.includes(status)) {
		throw adminError("Statut de carte invalide.");
	}

	const updated = await AdminRepository.updateCardStatus(id, status);
	if (!updated) {
		throw adminError("Carte introuvable.", 404);
	}

	return updated;
}

function validateOperationDate(value, label) {
	if (!value) return "";
	if (typeof value !== "string") throw adminError(label + " invalide.");

	const date = new Date(value);
	if (isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
		throw adminError(label + " invalide.");
	}
	return value;
}

function validateOperationAmount(value, label) {
	if (value === "" || value === undefined || value === null) return "";
	const amount = Number(value);
	if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999999.99) {
		throw adminError(label + " invalide.");
	}
	if (Math.round(amount * 100) / 100 !== amount) {
		throw adminError(label + " doit avoir au maximum deux décimales.");
	}
	return amount.toFixed(2);
}

async function getOperationsPageData(adminId, inputFilters = {}) {
	const dateFrom = validateOperationDate(inputFilters.date_from, "Date de début");
	const dateTo = validateOperationDate(inputFilters.date_to, "Date de fin");
	if (dateFrom && dateTo && dateFrom > dateTo) {
		throw adminError("La date de début doit précéder la date de fin.");
	}

	let clientId = "";
	if (inputFilters.client_id) clientId = checkId(inputFilters.client_id);
	const minAmount = validateOperationAmount(inputFilters.min_amount, "Montant minimum");
	const maxAmount = validateOperationAmount(inputFilters.max_amount, "Montant maximum");
	if (minAmount && maxAmount && Number(minAmount) > Number(maxAmount)) {
		throw adminError("Le montant minimum ne peut pas dépasser le montant maximum.");
	}

	const layout = await getLayoutData(adminId);
	const clients = await AdminRepository.findClients();
	const operations = await AdminRepository.findOperations({
		dateFrom: dateFrom,
		dateTo: dateTo,
		clientId: clientId,
		minAmount: minAmount,
		maxAmount: maxAmount,
	});

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		operations: operations,
		clients: clients,
		filters: {
			date_from: dateFrom,
			date_to: dateTo,
			client_id: clientId,
			min_amount: minAmount,
			max_amount: maxAmount,
		},
	};
}

async function getRequestsPageData(adminId, status) {
	const layout = await getLayoutData(adminId);
	const requests = await AdminRepository.findRequests(status);

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		requests: requests,
		status: status
	};
}

async function changeRequestStatus(requestId, status, adminId, note) {
	const id = checkId(requestId);

	if (!VALID_REQUEST_STATUSES.includes(status)) {
		throw adminError("Statut de demande invalide.");
	}

	const updated = await AdminRepository.updateRequestStatus(id, status, adminId, note);
	if (!updated) {
		throw adminError("Demande introuvable.", 404);
	}

	return updated;
}

async function getComplaintsPageData(adminId, status) {
	const layout = await getLayoutData(adminId);
	const complaints = await AdminRepository.findComplaints(status);

	return {
		userRole: layout.userRole,
		userName: layout.userName,
		complaints: complaints,
		status: status
	};
}

async function changeComplaintStatus(complaintId, status, adminId) {
	const id = checkId(complaintId);

	if (!VALID_COMPLAINT_STATUSES.includes(status)) {
		throw adminError("Statut de réclamation invalide.");
	}

	const updated = await AdminRepository.updateComplaintStatus(id, status, adminId);
	if (!updated) {
		throw adminError("Réclamation introuvable.", 404);
	}

	return updated;
}

module.exports = {
	getDashboardData,
	getUsersPageData,
	changeUserStatus,
	changeUserRole,
	getAssignmentsPageData,
	assignClient,
	getAccountsPageData,
	changeAccountStatus,
	getCardsPageData,
	changeCardStatus,
	getOperationsPageData,
	getRequestsPageData,
	changeRequestStatus,
	getComplaintsPageData,
	changeComplaintStatus,
};