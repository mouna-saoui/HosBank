const pool = require("../config/Database");

async function create(userId, beneficiary) {
	const result = await pool.query(
		`INSERT INTO beneficiaries (user_id, name, rib, bank_name)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, name, rib, bank_name, created_at, updated_at`,
		[userId, beneficiary.name, beneficiary.rib, beneficiary.bankName]
	);

	return result.rows[0];
}

async function findAllByUserId(userId) {
	const result = await pool.query(
		`SELECT id, user_id, name, rib, bank_name, created_at, updated_at
		 FROM beneficiaries
		 WHERE user_id = $1
		 ORDER BY created_at DESC`,
		[userId]
	);

	return result.rows;
}

async function findById(id) {
	const result = await pool.query(
		`SELECT id, user_id, name, rib, bank_name, created_at, updated_at
		 FROM beneficiaries
		 WHERE id = $1`,
		[id]
	);

	return result.rows[0] || null;
}

async function update(id, userId, beneficiary) {
	const result = await pool.query(
		`UPDATE beneficiaries
		 SET name = $1, rib = $2, bank_name = $3, updated_at = NOW()
		 WHERE id = $4 AND user_id = $5
		 RETURNING id, user_id, name, rib, bank_name, created_at, updated_at`,
		[beneficiary.name, beneficiary.rib, beneficiary.bankName, id, userId]
	);

	return result.rows[0] || null;
}

async function remove(id, userId) {
	const result = await pool.query(
		"DELETE FROM beneficiaries WHERE id = $1 AND user_id = $2 RETURNING id",
		[id, userId]
	);

	return result.rows[0] || null;
}

async function findByRibForUser(rib, userId, excludedId = null) {
	const result = await pool.query(
		`SELECT id
		 FROM beneficiaries
		 WHERE rib = $1 AND user_id = $2
		 AND ($3::bigint IS NULL OR id <> $3)
		 LIMIT 1`,
		[rib, userId, excludedId]
	);

	return result.rows[0] || null;
}

module.exports = {
	create,
	findAllByUserId,
	findById,
	update,
	remove,
	findByRibForUser,
};