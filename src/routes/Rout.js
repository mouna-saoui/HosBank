const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const compteController = require("../controllers/CompteController");
const clientController = require("../controllers/clientController");
const bankRequestController = require("../controllers/bankRequestController");
const cardController = require("../controllers/cardController");

const { requireAuth, requireRole } = require("../middelewares/Middelware");

const clientOnly = [requireAuth, requireRole(1)];
const agentOrAdmin = [requireAuth, requireRole(2, 3)];

// ── Auth ─────────────────────────────────────────────────
router.get("/login", authController.showLogin);
router.post("/login", authController.handleLogin);
router.get("/register", authController.showRegister);
router.post("/register", authController.handleRegister);
router.get("/logout", authController.logout);

// ── Client dashboard ─────────────────────────────────────
router.get("/client/dashboard", clientOnly, clientController.dashboard);

// ── US-11 : Comptes bancaires (client) ───────────────────
router.get("/accounts", clientOnly, compteController.listAccounts);
router.get("/accounts/new", clientOnly, compteController.showCreateForm);
router.post("/accounts", clientOnly, compteController.createAccount);
router.get("/accounts/:id", clientOnly, compteController.showAccount);
router.post("/accounts/:id/close", clientOnly, compteController.closeAccount);

// US-11 : Demande ouverture compte épargne via bank_requests
router.get("/requests/savings", clientOnly, bankRequestController.showSavingsRequestForm);
router.post("/requests/savings", clientOnly, bankRequestController.createSavingsRequest);

// ── US-12 : RIB (client) ─────────────────────────────────
router.get("/requests/rib", clientOnly, bankRequestController.showRibRequestForm);
router.post("/requests/rib", clientOnly, bankRequestController.createRibRequest);
router.get("/requests/rib/:id/info", clientOnly, bankRequestController.showRibInfo);

// ── US-16 : Cartes (client) ──────────────────────────────
router.get("/cards", clientOnly, cardController.listCards);
router.get("/cards/new", clientOnly, cardController.showRequestVirtualCardForm);
router.post("/cards", clientOnly, cardController.requestVirtualCard);
router.get("/cards/:id", clientOnly, cardController.showCardDetail);
router.post("/cards/:id/block", clientOnly, cardController.blockCard);
router.post("/cards/:id/renew", clientOnly, cardController.renewCard);

// ── Agent / Admin : Demandes ─────────────────────────────
router.get("/officer/requests/:type", agentOrAdmin, bankRequestController.listRequestsByType);
router.get("/officer/requests/:type/:id", agentOrAdmin, bankRequestController.showRequestDetail);
router.post("/officer/requests/:type/:id/process", agentOrAdmin, bankRequestController.processRequest);

// ── Agent / Admin : Cartes ───────────────────────────────
router.get("/officer/cards", agentOrAdmin, cardController.listAllCards);
router.post("/officer/cards/:id/status", agentOrAdmin, cardController.updateCardStatus);

// ── Default ───────────────────────────────────────────────
router.get("/", (req, res) => res.redirect("/login"));

module.exports = router;
