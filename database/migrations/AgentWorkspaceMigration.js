const pool = require("../../src/config/Database");

const migration = `
ALTER TABLE bank_requests DROP CONSTRAINT IF EXISTS bank_requests_status_check;
ALTER TABLE bank_requests
	ADD CONSTRAINT bank_requests_status_check
	CHECK (status IN ('pending', 'in_progress', 'in_review', 'approved', 'rejected', 'completed', 'cancelled'));

ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
ALTER TABLE complaints
	ADD CONSTRAINT complaints_status_check
	CHECK (status IN ('pending', 'open', 'in_progress', 'resolved', 'rejected', 'closed'));
`;

async function migrate() {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");
		await client.query(migration);
		await client.query("COMMIT");
		console.log("Agent workspace migration completed successfully.");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
		await pool.end();
	}
}

if (require.main === module) {
	migrate().catch((error) => {
		console.error("Agent workspace migration failed:", error.message);
		process.exitCode = 1;
	});
}

module.exports = migrate;