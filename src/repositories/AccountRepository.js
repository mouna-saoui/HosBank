const pool = require("../config/Database");
const Account = require("../models/AccountModel");

async function findByUserId(userId) {
    const { rows } = await pool.query(
        "SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
    );
    return rows.map(r => new Account(r));
}

async function findById(id, userId) {
    const { rows } = await pool.query(
        "SELECT * FROM accounts WHERE id = $1 AND user_id = $2",
        [id, userId]
    );
    return rows[0] ? new Account(rows[0]) : null;
}

async function findByAccountNumber(accountNumber) {
    const { rows } = await pool.query(
        "SELECT * FROM accounts WHERE account_number = $1",
        [accountNumber]
    );
    return rows[0] ? new Account(rows[0]) : null;
}

async function create({ userId, accountNumber, accountType, iban, rib }) {
    const { rows } = await pool.query(
        `INSERT INTO accounts (user_id, account_number, account_type, iban, rib)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, accountNumber, accountType, iban, rib]
    );
    return new Account(rows[0]);
}

async function updateStatus(id, userId, status) {
    const { rows } = await pool.query(
        `UPDATE accounts SET status = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3 RETURNING *`,
        [status, id, userId]
    );
    return rows[0] ? new Account(rows[0]) : null;
}

async function findTransactions(accountId, userId) {
    const { rows } = await pool.query(
        `SELECT t.* FROM transactions t
         JOIN accounts a ON a.id = t.account_id
         WHERE t.account_id = $1 AND a.user_id = $2
         ORDER BY t.created_at DESC LIMIT 20`,
        [accountId, userId]
    );
    return rows;
}

module.exports = { findByUserId, findById, findByAccountNumber, create, updateStatus, findTransactions };
