const pool = require("../config/Database");

async function create({ userId, requestType, details = {} }) {
    const { rows } = await pool.query(
        `INSERT INTO bank_requests (user_id, request_type, details)
         VALUES ($1, $2, $3) RETURNING *`,
        [userId, requestType, JSON.stringify(details)]
    );
    return rows[0];
}

async function findByUserId(userId) {
    const { rows } = await pool.query(
        `SELECT * FROM bank_requests WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
}

async function findByUserIdAndType(userId, requestType) {
    const { rows } = await pool.query(
        `SELECT * FROM bank_requests WHERE user_id = $1 AND request_type = $2 ORDER BY created_at DESC`,
        [userId, requestType]
    );
    return rows;
}

async function findById(id) {
    const { rows } = await pool.query(
        `SELECT br.*, u.first_name, u.last_name, u.email
         FROM bank_requests br
         JOIN users u ON u.id = br.user_id
         WHERE br.id = $1`,
        [id]
    );
    return rows[0] || null;
}

async function findByIdAndUserId(id, userId) {
    const { rows } = await pool.query(
        `SELECT * FROM bank_requests WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    return rows[0] || null;
}

async function findAllByType(requestType) {
    const { rows } = await pool.query(
        `SELECT br.*, u.first_name, u.last_name, u.email
         FROM bank_requests br
         JOIN users u ON u.id = br.user_id
         WHERE br.request_type = $1
         ORDER BY br.created_at DESC`,
        [requestType]
    );
    return rows;
}

async function updateStatus(id, status, officerId, resolutionNote = null) {
    const { rows } = await pool.query(
        `UPDATE bank_requests
         SET status = $1, assigned_officer_id = $2, resolution_note = $3, updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [status, officerId, resolutionNote, id]
    );
    return rows[0] || null;
}

async function updateDetails(id, details) {
    const { rows } = await pool.query(
        `UPDATE bank_requests SET details = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [JSON.stringify(details), id]
    );
    return rows[0] || null;
}

module.exports = {
    create,
    findByUserId,
    findByUserIdAndType,
    findById,
    findByIdAndUserId,
    findAllByType,
    updateStatus,
    updateDetails,
};
