const pool = require("../config/Database");

async function create({ userId, accountId, cardType }) {
    const { rows } = await pool.query(
        `INSERT INTO cards (user_id, account_id, card_type)
         VALUES ($1, $2, $3) RETURNING *`,
        [userId, accountId, cardType]
    );
    return rows[0];
}

async function findByUserId(userId) {
    const { rows } = await pool.query(
        `SELECT c.*, a.account_number
         FROM cards c
         LEFT JOIN accounts a ON a.id = c.account_id
         WHERE c.user_id = $1
         ORDER BY c.created_at DESC`,
        [userId]
    );
    return rows;
}

async function findById(id) {
    const { rows } = await pool.query(
        `SELECT c.*, a.account_number
         FROM cards c
         LEFT JOIN accounts a ON a.id = c.account_id
         WHERE c.id = $1`,
        [id]
    );
    return rows[0] || null;
}

async function findByIdAndUserId(id, userId) {
    const { rows } = await pool.query(
        `SELECT c.*, a.account_number
         FROM cards c
         LEFT JOIN accounts a ON a.id = c.account_id
         WHERE c.id = $1 AND c.user_id = $2`,
        [id, userId]
    );
    return rows[0] || null;
}

async function updateStatus(id, userId, status) {
    const { rows } = await pool.query(
        `UPDATE cards SET status = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3 RETURNING *`,
        [status, id, userId]
    );
    return rows[0] || null;
}

async function updatePin(id, userId, expiryMonth, expiryYear) {
    const { rows } = await pool.query(
        `UPDATE cards SET expiry_month = $1, expiry_year = $2, updated_at = NOW()
         WHERE id = $3 AND user_id = $4 RETURNING *`,
        [expiryMonth, expiryYear, id, userId]
    );
    return rows[0] || null;
}

async function findAll() {
    const { rows } = await pool.query(
        `SELECT c.*, u.first_name, u.last_name, u.email, a.account_number
         FROM cards c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN accounts a ON a.id = c.account_id
         ORDER BY c.created_at DESC`
    );
    return rows;
}

async function updateStatusById(id, status) {
    const { rows } = await pool.query(
        `UPDATE cards SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, id]
    );
    return rows[0] || null;
}

module.exports = {
    create,
    findByUserId,
    findById,
    findByIdAndUserId,
    updateStatus,
    updatePin,
    findAll,
    updateStatusById,
};
