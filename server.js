const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();
const authRoutes = require("./src/routes/authRoutes");
const clientRoutes = require("./src/routes/clientRoutes");
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
	session({
		secret: process.env.SESSION_SECRET || "hosbank-development-secret",
		resave: false,
		saveUninitialized: false,
	})
);

app.use(authRoutes);
app.use(clientRoutes);

const port = process.env.PORT || 3000;

if (require.main === module) {
	app.listen(port, () => {
		console.log(`HosBank server is running on port ${port}`);
	});
}

module.exports = app;
