const pool = require("../../src/config/Database");

async function seed() {
	await pool.query(`
		INSERT INTO roles (name)
		VALUES ('Client'), ('Chargé Client'), ('Administrateur')
		ON CONFLICT (name) DO NOTHING
	`);

	console.log("Base roles seeded successfully.");
	await pool.end();
}

if (require.main === module) {
	seed().catch((error) => {
		console.error("Database seed failed:", error.message);
		process.exitCode = 1;
	});
}

module.exports = seed;
