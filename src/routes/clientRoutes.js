const express = require("express");
const clientController = require("../controllers/clientController");
const { requireAuth, requireRole } = require("../middelewares/Middelware");

const router = express.Router();
const clientOnly = [requireAuth, requireRole(1)];

router.get("/client/dashboard", clientOnly, clientController.dashboard);
// router.get("/api/client/dashboard", clientOnly, clientController.dashboard);

module.exports = router;