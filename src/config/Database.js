const { Pool } = require("pg");

const pool = new Pool({
	host: process.env.POSTGRES_HOST || "localhost",
	port: Number(process.env.POSTGRES_PORT || 5432),
	database: process.env.POSTGRES_DB || "hosbank",
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PW,
});

module.exports = pool;
