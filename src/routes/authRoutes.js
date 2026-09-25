// Ce fichier est conservé pour compatibilité.
// Les routes auth sont définies dans src/routes/Rout.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/login", authController.showLogin);
router.post("/login", authController.handleLogin);
router.get("/register", authController.showRegister);
router.post("/register", authController.handleRegister);
router.get("/logout", authController.logout);

module.exports = router;
