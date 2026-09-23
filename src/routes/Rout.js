const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const compteController = require("../controllers/CompteController");
const { isAuthenticated } = require("../middelewares/AuthMiddelware");

// Auth
router.get("/login", authController.showLogin);
router.post("/login", authController.handleLogin);
router.get("/register", authController.showRegister);
router.post("/register", authController.handleRegister);
router.get("/logout", authController.logout);

// Accounts (protected)
router.get("/accounts", isAuthenticated, compteController.listAccounts);
router.get("/accounts/new", isAuthenticated, compteController.showCreateForm);
router.post("/accounts", isAuthenticated, compteController.createAccount);
router.get("/accounts/:id", isAuthenticated, compteController.showAccount);
router.post("/accounts/:id/close", isAuthenticated, compteController.closeAccount);

// Default redirect
router.get("/", (req, res) => res.redirect("/login"));

module.exports = router;
