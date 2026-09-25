const pool = require("../config/Database");

async function findAssignedClients(agentId) {
	const { rows } = await pool.query(
		`SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status
		 FROM users u
		 JOIN roles r ON r.id = u.role_id AND r.name = 'Client'
		 JOIN client_assignments ca ON ca.client_id = u.id
		 WHERE ca.agent_id = $1
		 ORDER BY u.last_name, u.first_name`,
		[agentId]
	);
	return rows;
}

async function findAssignedClient(clientId, agentId) {
	const { rows } = await pool.query(
		`SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status
		 FROM users u
		 JOIN roles r ON r.id = u.role_id AND r.name = 'Client'
		 JOIN client_assignments ca ON ca.client_id = u.id
		 WHERE u.id = $1 AND ca.agent_id = $2`,
		[clientId, agentId]
	);
	return rows[0] || null;
}

async function findAccountsByClient(clientId, agentId) {
	const { rows } = await pool.query(
		`SELECT a.id, a.account_number, a.account_type, a.iban, a.rib,
		        a.balance, a.currency, a.status
		 FROM accounts a
		 JOIN client_assignments ca ON ca.client_id = a.user_id
		 WHERE a.user_id = $1 AND ca.agent_id = $2
		 ORDER BY a.created_at DESC`,
		[clientId, agentId]
	);
	return rows;
}

async function findRequestsByClient(clientId, agentId) {
	const { rows } = await pool.query(
		`SELECT br.id, br.request_type, br.status, br.details,
		        br.resolution_note, br.created_at, br.updated_at
		 FROM bank_requests br
		 JOIN client_assignments ca ON ca.client_id = br.user_id
		 WHERE br.user_id = $1 AND ca.agent_id = $2
		 ORDER BY br.created_at DESC`,
		[clientId, agentId]
	);
	return rows;
}

async function findRequestCommentsByClient(clientId, agentId) {
	const { rows } = await pool.query(
		`SELECT rc.id, rc.request_id, rc.body, rc.created_at,
		        u.first_name, u.last_name
		 FROM request_comments rc
		 JOIN bank_requests br ON br.id = rc.request_id
		 JOIN client_assignments ca ON ca.client_id = br.user_id
		 JOIN users u ON u.id = rc.author_id
		 WHERE br.user_id = $1 AND ca.agent_id = $2
		 ORDER BY rc.created_at ASC`,
		[clientId, agentId]
	);
	return rows;
}

async function findComplaintsByClient(clientId, agentId) {
	const { rows } = await pool.query(
		`SELECT c.id, c.subject, c.description, c.status, c.created_at, c.updated_at
		 FROM complaints c
		 JOIN client_assignments ca ON ca.client_id = c.user_id
		 WHERE c.user_id = $1 AND ca.agent_id = $2
		 ORDER BY c.created_at DESC`,
		[clientId, agentId]
	);
	return rows;
}

async function findComplaintCommentsByClient(clientId, agentId) {
	const { rows } = await pool.query(
		`SELECT rc.id, rc.complaint_id, rc.body, rc.created_at,
		        u.first_name, u.last_name
		 FROM request_comments rc
		 JOIN complaints c ON c.id = rc.complaint_id
		 JOIN client_assignments ca ON ca.client_id = c.user_id
		 JOIN users u ON u.id = rc.author_id
		 WHERE c.user_id = $1 AND ca.agent_id = $2
		 ORDER BY rc.created_at ASC`,
		[clientId, agentId]
	);
	return rows;
}

async function findInteractionsByClient(clientId, agentId) {
	const { rows } = await pool.query(
		`SELECT i.id, i.interaction_type, i.summary, i.occurred_at
		 FROM interactions i
		 JOIN client_assignments ca ON ca.client_id = i.client_id
		 WHERE i.client_id = $1 AND ca.agent_id = $2
		 ORDER BY i.occurred_at DESC`,
		[clientId, agentId]
	);
	return rows;
}

async function findRequestByIdForAgent(requestId, agentId) {
	const { rows } = await pool.query(
		`SELECT br.*
		 FROM bank_requests br
		 JOIN client_assignments ca ON ca.client_id = br.user_id
		 WHERE br.id = $1 AND ca.agent_id = $2`,
		[requestId, agentId]
	);
	return rows[0] || null;
}

async function updateRequestStatus(requestId, agentId, status, resolutionNote) {
	const { rows } = await pool.query(
		`UPDATE bank_requests br
		 SET status = $1, assigned_officer_id = $2,
		     resolution_note = $3, updated_at = NOW()
		 FROM client_assignments ca
		 WHERE br.id = $4 AND ca.client_id = br.user_id AND ca.agent_id = $2
		 RETURNING br.*`,
		[status, agentId, resolutionNote, requestId]
	);
	return rows[0] || null;
}

async function addRequestComment(requestId, agentId, body) {
	const { rows } = await pool.query(
		`INSERT INTO request_comments (request_id, author_id, body)
		 SELECT br.id, $2, $3
		 FROM bank_requests br
		 JOIN client_assignments ca ON ca.client_id = br.user_id
		 WHERE br.id = $1 AND ca.agent_id = $2
		 RETURNING *`,
		[requestId, agentId, body]
	);
	return rows[0] || null;
}

async function findComplaintByIdForAgent(complaintId, agentId) {
	const { rows } = await pool.query(
		`SELECT c.*
		 FROM complaints c
		 JOIN client_assignments ca ON ca.client_id = c.user_id
		 WHERE c.id = $1 AND ca.agent_id = $2`,
		[complaintId, agentId]
	);
	return rows[0] || null;
}

async function updateComplaintStatus(complaintId, agentId, status) {
	const { rows } = await pool.query(
		`UPDATE complaints c
		 SET status = $1, updated_at = NOW()
		 FROM client_assignments ca
		 WHERE c.id = $2 AND ca.client_id = c.user_id AND ca.agent_id = $3
		 RETURNING c.*`,
		[status, complaintId, agentId]
	);
	return rows[0] || null;
}

async function addComplaintComment(complaintId, agentId, body) {
	const { rows } = await pool.query(
		`INSERT INTO request_comments (complaint_id, author_id, body)
		 SELECT c.id, $2, $3
		 FROM complaints c
		 JOIN client_assignments ca ON ca.client_id = c.user_id
		 WHERE c.id = $1 AND ca.agent_id = $2
		 RETURNING *`,
		[complaintId, agentId, body]
	);
	return rows[0] || null;
}

async function addInteraction(clientId, agentId, summary) {
	const { rows } = await pool.query(
		`INSERT INTO interactions (client_id, officer_id, interaction_type, summary)
		 SELECT ca.client_id, $2, 'note', $3
		 FROM client_assignments ca
		 WHERE ca.client_id = $1 AND ca.agent_id = $2
		 RETURNING *`,
		[clientId, agentId, summary]
	);
	return rows[0] || null;
}

module.exports = {
	findAssignedClients,
	findAssignedClient,
	findAccountsByClient,
	findRequestsByClient,
	findRequestCommentsByClient,
	findComplaintsByClient,
	findComplaintCommentsByClient,
	findInteractionsByClient,
	findRequestByIdForAgent,
	updateRequestStatus,
	addRequestComment,
	findComplaintByIdForAgent,
	updateComplaintStatus,
	addComplaintComment,
	addInteraction,
};