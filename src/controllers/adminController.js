const AdminService = require("../services/adminService");

async function dashboard(req, res) {
	try {
		const userId = req.session.userId;
		const data = await AdminService.getDashboardData(userId);

		data.activePage = "admin-dashboard";
		res.render("admin/dashboard", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function users(req, res, errorMessage) {
	try {
		const userId = req.session.userId;
		let searchValue = "";
		let roleValue = "";
		let statusValue = "";

		if (req.query.search) {
			searchValue = req.query.search;
		}
		if (req.query.role_id) {
			roleValue = req.query.role_id;
		}
		if (req.query.status) {
			statusValue = req.query.status;
		}

		const filters = {
			search: searchValue,
			roleId: roleValue,
			status: statusValue
		};

		const data = await AdminService.getUsersPageData(userId, filters);

		data.activePage = "admin-users";
		data.error = errorMessage || null;

		res.render("admin/users", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function updateUserStatus(req, res) {
	try {
		const userId = req.params.id;
		const status = req.body.status;
		const adminId = req.session.userId;
		await AdminService.changeUserStatus(userId, status, adminId);
		res.redirect("/admin/users");
	} catch (error) {
		await users(req, res, error.message);
	}
}

async function updateUserRole(req, res) {
	try {
		const userId = req.params.id;
		const roleId = req.body.role_id;
		const adminId = req.session.userId;
		await AdminService.changeUserRole(userId, roleId, adminId);
		res.redirect("/admin/users");
	} catch (error) {
		await users(req, res, error.message);
	}
}

async function assignments(req, res, errorMessage) {
	try {
		const userId = req.session.userId;
		const data = await AdminService.getAssignmentsPageData(userId);

		data.activePage = "admin-assignments";
		data.error = errorMessage || null;

		res.render("admin/assignments", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function createAssignment(req, res) {
	try {
		const clientId = req.body.client_id;
		const agentId = req.body.agent_id;
		await AdminService.assignClient(clientId, agentId);
		res.redirect("/admin/assignments");
	} catch (error) {
		await assignments(req, res, error.message);
	}
}

async function accounts(req, res, errorMessage) {
	try {
		const userId = req.session.userId;
		const data = await AdminService.getAccountsPageData(userId);

		data.activePage = "admin-accounts";
		data.error = errorMessage || null;

		res.render("admin/accounts", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function updateAccountStatus(req, res) {
	try {
		const accountId = req.params.id;
		const status = req.body.status;
		await AdminService.changeAccountStatus(accountId, status);
		res.redirect("/admin/accounts");
	} catch (error) {
		await accounts(req, res, error.message);
	}
}

async function cards(req, res, errorMessage) {
	try {
		const userId = req.session.userId;
		const data = await AdminService.getCardsPageData(userId);

		data.activePage = "admin-cards";
		data.error = errorMessage || null;

		res.render("admin/cards", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function updateCardStatus(req, res) {
	try {
		const cardId = req.params.id;
		const status = req.body.status;
		await AdminService.changeCardStatus(cardId, status);
		res.redirect("/admin/cards");
	} catch (error) {
		await cards(req, res, error.message);
	}
}

async function operations(req, res, errorMessage) {
	try {
		const userId = req.session.userId;
		const filters = {
			date_from: req.query.date_from || "",
			date_to: req.query.date_to || "",
			client_id: req.query.client_id || "",
			min_amount: req.query.min_amount || "",
			max_amount: req.query.max_amount || ""
		};
		const data = await AdminService.getOperationsPageData(userId, filters);

		data.activePage = "admin-operations";
		data.error = errorMessage || null;
		res.render("admin/operations", data);
	} catch (error) {
		if (error.statusCode === 400) {
			try {
				const data = await AdminService.getOperationsPageData(req.session.userId, {});
				data.activePage = "admin-operations";
				data.error = error.message;
				data.filters = {
					date_from: req.query.date_from || "",
					date_to: req.query.date_to || "",
					client_id: req.query.client_id || "",
					min_amount: req.query.min_amount || "",
					max_amount: req.query.max_amount || ""
				};
				return res.status(400).render("admin/operations", data);
			} catch (pageError) {
				return res.status(pageError.statusCode || 500).send(pageError.message);
			}
		}
		return res.status(error.statusCode || 500).send(error.message);
	}
}

async function requests(req, res, errorMessage) {
	try {
		const userId = req.session.userId;
		let statusValue = "";
		if (req.query.status) {
			statusValue = req.query.status;
		}

		const data = await AdminService.getRequestsPageData(userId, statusValue);

		data.activePage = "admin-requests";
		data.error = errorMessage || null;

		res.render("admin/requests", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function updateRequestStatus(req, res) {
	try {
		const requestId = req.params.id;
		const status = req.body.status;
		const adminId = req.session.userId;
		const resolutionNote = req.body.resolution_note;

		await AdminService.changeRequestStatus(requestId, status, adminId, resolutionNote);
		res.redirect("/admin/requests");
	} catch (error) {
		await requests(req, res, error.message);
	}
}

async function complaints(req, res, errorMessage) {
	try {
		const userId = req.session.userId;
		let statusValue = "";
		if (req.query.status) {
			statusValue = req.query.status;
		}

		const data = await AdminService.getComplaintsPageData(userId, statusValue);

		data.activePage = "admin-complaints";
		data.error = errorMessage || null;

		res.render("admin/complaints", data);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		res.status(statusCode).send(error.message);
	}
}

async function updateComplaintStatus(req, res) {
	try {
		const complaintId = req.params.id;
		const status = req.body.status;
		const adminId = req.session.userId;

		await AdminService.changeComplaintStatus(complaintId, status, adminId);
		res.redirect("/admin/complaints");
	} catch (error) {
		await complaints(req, res, error.message);
	}
}

module.exports = {
	dashboard,
	users,
	updateUserStatus,
	updateUserRole,
	assignments,
	createAssignment,
	accounts,
	updateAccountStatus,
	cards,
	updateCardStatus,
	operations,
	requests,
	updateRequestStatus,
	complaints,
	updateComplaintStatus,
};