const pool = require("../../src/config/Database");

const schema = `
CREATE TABLE IF NOT EXISTS roles (
	id SERIAL PRIMARY KEY,
	name VARCHAR(40) NOT NULL UNIQUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
	id BIGSERIAL PRIMARY KEY,
	role_id INTEGER NOT NULL REFERENCES roles(id),
	first_name VARCHAR(100) NOT NULL,
	last_name VARCHAR(100) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	phone VARCHAR(30),
	status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
	email_verified_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	account_number VARCHAR(34) NOT NULL UNIQUE,
	account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('current', 'savings')),
	iban VARCHAR(34) UNIQUE,
	rib VARCHAR(50) UNIQUE,
	balance NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
	currency CHAR(3) NOT NULL DEFAULT 'MAD',
	status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'closed')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficiaries (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	name VARCHAR(150) NOT NULL,
	account_number VARCHAR(34),
	iban VARCHAR(34),
	bank_name VARCHAR(150),
	status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT beneficiary_account_identifier CHECK (account_number IS NOT NULL OR iban IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS transfers (
	id BIGSERIAL PRIMARY KEY,
	sender_account_id BIGINT NOT NULL REFERENCES accounts(id),
	beneficiary_id BIGINT REFERENCES beneficiaries(id) ON DELETE SET NULL,
	recipient_name VARCHAR(150) NOT NULL,
	recipient_account_number VARCHAR(34),
	recipient_iban VARCHAR(34),
	amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
	currency CHAR(3) NOT NULL DEFAULT 'MAD',
	status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
	reference VARCHAR(80) NOT NULL UNIQUE,
	failure_reason TEXT,
	executed_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT transfer_recipient_identifier CHECK (recipient_account_number IS NOT NULL OR recipient_iban IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS transactions (
	id BIGSERIAL PRIMARY KEY,
	account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
	transfer_id BIGINT REFERENCES transfers(id) ON DELETE SET NULL,
	transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'fee', 'adjustment')),
	amount NUMERIC(15, 2) NOT NULL CHECK (amount <> 0),
	balance_after NUMERIC(15, 2) NOT NULL CHECK (balance_after >= 0),
	description VARCHAR(255),
	reference VARCHAR(80) NOT NULL UNIQUE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cards (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
	card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('physical', 'virtual')),
	last_four CHAR(4),
	card_token TEXT UNIQUE,
	expiry_month SMALLINT CHECK (expiry_month BETWEEN 1 AND 12),
	expiry_year SMALLINT CHECK (expiry_year >= 2000),
	status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired', 'cancelled')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_requests (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	assigned_officer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
	request_type VARCHAR(30) NOT NULL CHECK (request_type IN ('rib', 'savings_account', 'virtual_card', 'pin', 'opposition')),
	status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'completed', 'cancelled')),
	details JSONB NOT NULL DEFAULT '{}'::JSONB,
	resolution_note TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaints (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	assigned_officer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
	subject VARCHAR(200) NOT NULL,
	description TEXT NOT NULL,
	priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
	status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_comments (
	id BIGSERIAL PRIMARY KEY,
	request_id BIGINT REFERENCES bank_requests(id) ON DELETE CASCADE,
	complaint_id BIGINT REFERENCES complaints(id) ON DELETE CASCADE,
	author_id BIGINT NOT NULL REFERENCES users(id),
	body TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT comment_parent CHECK ((request_id IS NOT NULL) <> (complaint_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS client_assignments (
	id BIGSERIAL PRIMARY KEY,
	client_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	officer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
	assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	unassigned_at TIMESTAMPTZ,
	CONSTRAINT assignment_dates CHECK (unassigned_at IS NULL OR unassigned_at >= assigned_at)
);

CREATE TABLE IF NOT EXISTS interactions (
	id BIGSERIAL PRIMARY KEY,
	client_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	officer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
	interaction_type VARCHAR(30) NOT NULL CHECK (interaction_type IN ('call', 'email', 'meeting', 'chat', 'note')),
	channel VARCHAR(30),
	summary TEXT NOT NULL,
	occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_verifications (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	token_hash TEXT NOT NULL UNIQUE,
	expires_at TIMESTAMPTZ NOT NULL,
	verified_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_assignment_per_client
	ON client_assignments (client_id) WHERE unassigned_at IS NULL;
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts (user_id);
CREATE INDEX IF NOT EXISTS transfers_sender_account_id_idx ON transfers (sender_account_id);
CREATE INDEX IF NOT EXISTS transactions_account_id_created_at_idx ON transactions (account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bank_requests_user_id_status_idx ON bank_requests (user_id, status);
CREATE INDEX IF NOT EXISTS complaints_user_id_status_idx ON complaints (user_id, status);
CREATE INDEX IF NOT EXISTS interactions_client_id_occurred_at_idx ON interactions (client_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS email_verifications_user_id_idx ON email_verifications (user_id);
`;

async function migrate() {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");
		await client.query(schema);
		await client.query("COMMIT");
		console.log("Database schema migrated successfully.");
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
		console.error("Database migration failed:", error.message);
		process.exitCode = 1;
	});
}

module.exports = migrate;
