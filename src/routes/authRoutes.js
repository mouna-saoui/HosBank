const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/login", (req, res) => {
	res.render("auth/login", { error: null });
});

router.post("/login", authController.login);

module.exports = router;