const pool = require("../config/Database");

async function findByEmail(email) {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] || null;
}

async function create({ roleId, firstName, lastName, email, phone, passwordHash }) {
    const result = await pool.query(
        `INSERT INTO users (role_id, first_name, last_name, email, phone, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [roleId, firstName, lastName, email, phone || null, passwordHash]
    );
    return result.rows[0];
}

module.exports = { findByEmail, create };
