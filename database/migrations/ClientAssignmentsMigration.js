const pool = require("../../src/config/Database");

const migration = `
CREATE TABLE IF NOT EXISTS client_assignments (
	id BIGSERIAL PRIMARY KEY,
	client_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	agent_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'client_assignments' AND column_name = 'officer_id'
	) AND NOT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'client_assignments' AND column_name = 'agent_id'
	) THEN
		ALTER TABLE client_assignments RENAME COLUMN officer_id TO agent_id;
	END IF;
END $$;

ALTER TABLE client_assignments DROP CONSTRAINT IF EXISTS assignment_dates;
ALTER TABLE client_assignments DROP COLUMN IF EXISTS unassigned_at;
DROP INDEX IF EXISTS one_active_assignment_per_client;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'client_assignments_officer_id_fkey'
	) THEN
		ALTER TABLE client_assignments
			RENAME CONSTRAINT client_assignments_officer_id_fkey TO client_assignments_agent_id_fkey;
	END IF;
END $$;

ALTER TABLE client_assignments
	ALTER COLUMN assigned_at TYPE TIMESTAMP USING assigned_at::timestamp,
	ALTER COLUMN assigned_at SET DEFAULT CURRENT_TIMESTAMP,
	ALTER COLUMN assigned_at SET NOT NULL;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'client_assignments_client_agent_unique'
	) THEN
		ALTER TABLE client_assignments
			ADD CONSTRAINT client_assignments_client_agent_unique UNIQUE (client_id, agent_id);
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS client_assignments_client_id_idx
	ON client_assignments (client_id);
CREATE INDEX IF NOT EXISTS client_assignments_agent_id_idx
	ON client_assignments (agent_id);

CREATE OR REPLACE FUNCTION validate_client_assignment_users()
RETURNS TRIGGER AS $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM users
		JOIN roles ON roles.id = users.role_id
		WHERE users.id = NEW.client_id AND roles.name = 'Client'
	) THEN
		RAISE EXCEPTION 'client_id must refer to a user with the Client role';
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM users
		JOIN roles ON roles.id = users.role_id
		WHERE users.id = NEW.agent_id AND roles.name = 'Chargé Client'
	) THEN
		RAISE EXCEPTION 'agent_id must refer to a user with the Chargé Client role';
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_client_assignment_users_trigger ON client_assignments;
CREATE TRIGGER validate_client_assignment_users_trigger
	BEFORE INSERT OR UPDATE OF client_id, agent_id ON client_assignments
	FOR EACH ROW
	EXECUTE FUNCTION validate_client_assignment_users();
`;

async function migrate() {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");
		await client.query(migration);
		await client.query("COMMIT");
		console.log("Client assignments migration completed successfully.");
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
		console.error("Client assignments migration failed:", error.message);
		process.exitCode = 1;
	});
}

module.exports = migrate;