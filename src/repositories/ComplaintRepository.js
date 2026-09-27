const pool = require("../config/Database");

// ── Client ───────────────────────────────────────────────

async function create({ userId, subject, description, priority }) {
    const { rows } = await pool.query(
        `INSERT INTO complaints (user_id, subject, description, priority)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, subject, description, priority]
    );
    return rows[0];
}

async function findByUserId(userId) {
    const { rows } = await pool.query(
        `SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
}

async function findByIdAndUserId(id, userId) {
    const { rows } = await pool.query(
        `SELECT * FROM complaints WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    return rows[0] || null;
}

// ── Agent / Admin ─────────────────────────────────────────

async function findAll() {
    const { rows } = await pool.query(
        `SELECT c.*, u.first_name, u.last_name, u.email
         FROM complaints c
         JOIN users u ON u.id = c.user_id
         ORDER BY
           CASE c.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 END,
           c.created_at DESC`
    );
    return rows;
}

async function findById(id) {
    const { rows } = await pool.query(
        `SELECT c.*, u.first_name, u.last_name, u.email
         FROM complaints c
         JOIN users u ON u.id = c.user_id
         WHERE c.id = $1`,
        [id]
    );
    return rows[0] || null;
}

async function updateStatus(id, status, officerId) {
    const { rows } = await pool.query(
        `UPDATE complaints
         SET status = $1, assigned_officer_id = $2, updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [status, officerId, id]
    );
    return rows[0] || null;
}

// Commentaires
async function addComment({ complaintId, authorId, body }) {
    const { rows } = await pool.query(
        `INSERT INTO request_comments (complaint_id, author_id, body)
         VALUES ($1, $2, $3) RETURNING *`,
        [complaintId, authorId, body]
    );
    return rows[0];
}

async function findComments(complaintId) {
    const { rows } = await pool.query(
        `SELECT rc.*, u.first_name, u.last_name, u.role_id
         FROM request_comments rc
         JOIN users u ON u.id = rc.author_id
         WHERE rc.complaint_id = $1
         ORDER BY rc.created_at ASC`,
        [complaintId]
    );
    return rows;
}

// Stats pour le dashboard agent
async function countByStatus() {
    const { rows } = await pool.query(
        `SELECT status, COUNT(*) as count FROM complaints GROUP BY status`
    );
    return rows;
}

module.exports = {
    create,
    findByUserId,
    findByIdAndUserId,
    findAll,
    findById,
    updateStatus,
    addComment,
    findComments,
    countByStatus,
};
