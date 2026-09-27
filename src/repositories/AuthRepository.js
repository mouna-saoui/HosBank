const pool = require("../config/Database");

async function findByEmail(email) {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] || null;
}

async function create({ firstName, lastName, email, phone, passwordHash }) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        await client.query("LOCK TABLE users IN EXCLUSIVE MODE");

        const userCount = await client.query("SELECT COUNT(*)::int AS total FROM users");
        let roleName = "Client";

        if (userCount.rows[0].total === 0) {
            roleName = "Administrateur";
        }

        const roleResult = await client.query(
            "SELECT id FROM roles WHERE name = $1",
            [roleName]
        );

        if (roleResult.rows.length === 0) {
            throw new Error("Les rôles doivent être initialisés avant l'inscription.");
        }

        const userResult = await client.query(
            `INSERT INTO users (role_id, first_name, last_name, email, phone, password_hash)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [roleResult.rows[0].id, firstName, lastName, email, phone || null, passwordHash]
        );

        await client.query("COMMIT");
        return userResult.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { findByEmail, create };
