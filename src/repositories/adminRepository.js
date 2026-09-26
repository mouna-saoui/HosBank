const pool = require("../config/Database");

async function countUsers() {
	const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM users");
	return rows[0].total;
}

async function countUsersByRole(roleName) {
	const { rows } = await pool.query(
		`SELECT COUNT(*)::int AS total
		 FROM users u JOIN roles r ON r.id = u.role_id
		 WHERE r.name = $1`,
		[roleName]
	);
	return rows[0].total;
}

async function countAccounts(status = null) {
	const query = status
		? "SELECT COUNT(*)::int AS total FROM accounts WHERE status = $1"
		: "SELECT COUNT(*)::int AS total FROM accounts";
	const { rows } = await pool.query(query, status ? [status] : []);
	return rows[0].total;
}

async function countCards() {
	const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM cards");
	return rows[0].total;
}

async function countOperations() {
	const { rows } = await pool.query(
		`SELECT (
			(SELECT COUNT(*) FROM transfers) +
			(SELECT COUNT(*) FROM transactions)
		)::int AS total`
	);
	return rows[0].total;
}

async function countRequests(status = "pending") {
	const { rows } = await pool.query(
		"SELECT COUNT(*)::int AS total FROM bank_requests WHERE status = $1",
		[status]
	);
	return rows[0].total;
}

async function countComplaints(status = "open") {
	const { rows } = await pool.query(
		`SELECT COUNT(*)::int AS total
		 FROM complaints
		 WHERE status = $1 OR ($1 = 'open' AND status = 'pending')`,
		[status]
	);
	return rows[0].total;
}

async function findRecentUsers(limit = 5) {
	const { rows } = await pool.query(
		`SELECT u.id, u.first_name, u.last_name, u.email, u.status, u.created_at, r.name AS role_name
		 FROM users u JOIN roles r ON r.id = u.role_id
		 ORDER BY u.created_at DESC LIMIT $1`,
		[limit]
	);
	return rows;
}

async function findPendingRequests(limit = 5) {
	const { rows } = await pool.query(
		`SELECT br.id, br.request_type, br.status, br.created_at,
		        u.first_name, u.last_name
		 FROM bank_requests br JOIN users u ON u.id = br.user_id
		 WHERE br.status IN ('pending', 'in_progress', 'in_review')
		 ORDER BY br.created_at DESC LIMIT $1`,
		[limit]
	);
	return rows;
}

async function findRecentOperations(limit = 10) {
	const { rows } = await pool.query(
		`SELECT operation_id, operation_type, client_name, amount, currency,
		        operation_status, operation_kind, created_at
		 FROM (
			SELECT t.id AS operation_id, 'Transaction' AS operation_type,
			       u.first_name || ' ' || u.last_name AS client_name,
			       t.amount, a.currency, 'completed' AS operation_status,
			       t.transaction_type AS operation_kind, t.created_at
			FROM transactions t
			JOIN accounts a ON a.id = t.account_id
			JOIN users u ON u.id = a.user_id
			UNION ALL
			SELECT tr.id, 'Virement',
			       u.first_name || ' ' || u.last_name,
			       tr.amount, tr.currency, tr.status, 'transfer', tr.created_at
			FROM transfers tr
			JOIN accounts a ON a.id = tr.sender_account_id
			JOIN users u ON u.id = a.user_id
		 ) operations
		 ORDER BY created_at DESC LIMIT $1`,
		[limit]
	);
	return rows;
}

async function findUsers({ search = "", roleId = "", status = "" } = {}) {
	const values = [];
	const conditions = [];

	if (search.trim()) {
		values.push(`%${search.trim()}%`);
		conditions.push(`(u.first_name ILIKE $${values.length} OR u.last_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
	}
	if (roleId) {
		values.push(roleId);
		conditions.push(`u.role_id = $${values.length}`);
	}
	if (status) {
		values.push(status);
		conditions.push(`u.status = $${values.length}`);
	}

	const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
	const { rows } = await pool.query(
		`SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
		        u.status, u.created_at, r.id AS role_id, r.name AS role_name
		 FROM users u JOIN roles r ON r.id = u.role_id
		 ${where}
		 ORDER BY u.created_at DESC`,
		values
	);
	return rows;
}

async function findRoles() {
	const { rows } = await pool.query("SELECT id, name FROM roles ORDER BY id");
	return rows;
}

async function findUserById(userId) {
	const { rows } = await pool.query(
		`SELECT u.id, u.first_name, u.last_name, u.email, r.name AS role_name
		 FROM users u JOIN roles r ON r.id = u.role_id
		 WHERE u.id = $1`,
		[userId]
	);
	return rows[0] || null;
}

async function updateUserStatus(userId, status) {
	const { rows } = await pool.query(
		`UPDATE users SET status = $1, updated_at = NOW()
		 WHERE id = $2 RETURNING id, status`,
		[status, userId]
	);
	return rows[0] || null;
}

async function updateUserRole(userId, roleId) {
	const { rows } = await pool.query(
		`UPDATE users SET role_id = $1, updated_at = NOW()
		 WHERE id = $2 RETURNING id, role_id`,
		[roleId, userId]
	);
	return rows[0] || null;
}

async function findClients() {
	const { rows } = await pool.query(
		`SELECT u.id, u.first_name, u.last_name, u.email
		 FROM users u JOIN roles r ON r.id = u.role_id
		 WHERE r.name = 'Client'
		 ORDER BY u.last_name, u.first_name`
	);
	return rows;
}

async function findAgents() {
	const { rows } = await pool.query(
		`SELECT u.id, u.first_name, u.last_name, u.email
		 FROM users u JOIN roles r ON r.id = u.role_id
		 WHERE r.name = 'Chargé Client'
		 ORDER BY u.last_name, u.first_name`
	);
	return rows;
}

async function findAssignments() {
	const { rows } = await pool.query(
		`SELECT ca.id, ca.client_id, ca.agent_id, ca.assigned_at,
		       c.first_name AS client_first_name, c.last_name AS client_last_name,
		       a.first_name AS agent_first_name, a.last_name AS agent_last_name
		 FROM client_assignments ca
		 JOIN users c ON c.id = ca.client_id
		 JOIN users a ON a.id = ca.agent_id
		 ORDER BY ca.assigned_at DESC`
	);
	return rows;
}

async function assignClient(clientId, agentId) {
	const { rows } = await pool.query(
		`INSERT INTO client_assignments (client_id, agent_id)
		 VALUES ($1, $2) RETURNING *`,
		[clientId, agentId]
	);
	return rows[0];
}

async function findAgentActivity() {
	const { rows } = await pool.query(
		`SELECT u.id, u.first_name, u.last_name, u.email,
		       COUNT(DISTINCT ca.client_id)::int AS assigned_clients,
		       COUNT(DISTINCT br.id) FILTER (WHERE br.status IN ('pending', 'in_progress', 'in_review'))::int AS pending_requests
		 FROM users u
		 JOIN roles r ON r.id = u.role_id AND r.name = 'Chargé Client'
		 LEFT JOIN client_assignments ca ON ca.agent_id = u.id
		 LEFT JOIN bank_requests br ON br.assigned_officer_id = u.id
		 GROUP BY u.id
		 ORDER BY u.last_name, u.first_name`
	);
	return rows;
}

async function findAccounts() {
	const { rows } = await pool.query(
		`SELECT a.id, a.account_number, a.account_type, a.iban, a.rib,
		       a.balance, a.currency, a.status, a.created_at,
		       u.first_name, u.last_name, u.email
		 FROM accounts a JOIN users u ON u.id = a.user_id
		 ORDER BY a.created_at DESC`
	);
	return rows;
}

async function updateAccountStatus(accountId, status) {
	const { rows } = await pool.query(
		`UPDATE accounts SET status = $1, updated_at = NOW()
		 WHERE id = $2 RETURNING *`,
		[status, accountId]
	);
	return rows[0] || null;
}

async function findCards() {
	const { rows } = await pool.query(
		`SELECT c.id, c.card_type, c.last_four, c.expiry_month, c.expiry_year,
		       c.status, c.created_at, u.first_name, u.last_name, u.email,
		       a.account_number
		 FROM cards c JOIN users u ON u.id = c.user_id
		 LEFT JOIN accounts a ON a.id = c.account_id
		 ORDER BY c.created_at DESC`
	);
	return rows;
}

async function updateCardStatus(cardId, status) {
	const { rows } = await pool.query(
		`UPDATE cards SET status = $1, updated_at = NOW()
		 WHERE id = $2 RETURNING *`,
		[status, cardId]
	);
	return rows[0] || null;
}

async function findOperations(filters = {}) {
	const { rows } = await pool.query(
		`SELECT tr.id, tr.reference, tr.amount, tr.currency, tr.status,
		       tr.recipient_name, tr.recipient_rib, t.description,
		       COALESCE(tr.recipient_account_number, tr.recipient_iban) AS recipient_account,
		       tr.created_at,
	       sender.id AS client_id, sender.first_name, sender.last_name, sender.email
		 FROM transfers tr
		 JOIN accounts source_account ON source_account.id = tr.sender_account_id
		 JOIN users sender ON sender.id = source_account.user_id
		 LEFT JOIN transactions t ON t.transfer_id = tr.id
			AND t.account_id = tr.sender_account_id AND t.transaction_type = 'transfer_out'
		 WHERE ($1::date IS NULL OR tr.created_at >= $1::date)
		   AND ($2::date IS NULL OR tr.created_at < ($2::date + INTERVAL '1 day'))
		   AND ($3::bigint IS NULL OR sender.id = $3 OR EXISTS (
			SELECT 1
			FROM accounts recipient_account
			WHERE recipient_account.user_id = $3
			  AND (tr.recipient_rib = recipient_account.rib
			       OR tr.recipient_account_number = recipient_account.account_number
			       OR tr.recipient_iban = recipient_account.iban)
		   ))
		   AND ($4::numeric IS NULL OR tr.amount >= $4)
		   AND ($5::numeric IS NULL OR tr.amount <= $5)
		 ORDER BY tr.created_at DESC`,
		[
			filters.dateFrom || null,
			filters.dateTo || null,
			filters.clientId || null,
			filters.minAmount === "" || filters.minAmount === undefined ? null : filters.minAmount,
			filters.maxAmount === "" || filters.maxAmount === undefined ? null : filters.maxAmount,
		]
	);
	return rows;
}

async function findRequests(status = "") {
	const values = [];
	const where = status ? "WHERE br.status = $1" : "";
	if (status) values.push(status);
	const { rows } = await pool.query(
		`SELECT br.id, br.request_type, br.status, br.resolution_note,
		       br.created_at, br.updated_at, u.first_name, u.last_name, u.email
		 FROM bank_requests br JOIN users u ON u.id = br.user_id
		 ${where} ORDER BY br.created_at DESC`,
		values
	);
	return rows;
}

async function updateRequestStatus(requestId, status, adminId, note) {
	const { rows } = await pool.query(
		`UPDATE bank_requests
		 SET status = $1, assigned_officer_id = $2, resolution_note = $3, updated_at = NOW()
		 WHERE id = $4 RETURNING *`,
		[status, adminId, note || null, requestId]
	);
	return rows[0] || null;
}

async function findComplaints(status = "") {
	const values = [];
	const where = status ? "WHERE c.status = $1" : "";
	if (status) values.push(status);
	const { rows } = await pool.query(
		`SELECT c.id, c.subject, c.description, c.priority, c.status,
		       c.created_at, c.updated_at, u.first_name, u.last_name, u.email
		 FROM complaints c JOIN users u ON u.id = c.user_id
		 ${where} ORDER BY c.created_at DESC`,
		values
	);
	return rows;
}

async function updateComplaintStatus(complaintId, status, adminId) {
	const { rows } = await pool.query(
		`UPDATE complaints
		 SET status = $1, assigned_officer_id = $2, updated_at = NOW()
		 WHERE id = $3 RETURNING *`,
		[status, adminId, complaintId]
	);
	return rows[0] || null;
}

module.exports = {
	countUsers,
	countUsersByRole,
	countAccounts,
	countCards,
	countOperations,
	countRequests,
	countComplaints,
	findRecentUsers,
	findPendingRequests,
	findRecentOperations,
	findUsers,
	findRoles,
	findUserById,
	updateUserStatus,
	updateUserRole,
	findClients,
	findAgents,
	findAssignments,
	assignClient,
	findAgentActivity,
	findAccounts,
	updateAccountStatus,
	findCards,
	updateCardStatus,
	findOperations,
	findRequests,
	updateRequestStatus,
	findComplaints,
	updateComplaintStatus,
};