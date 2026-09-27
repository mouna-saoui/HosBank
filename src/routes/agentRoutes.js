const express = require("express");
const agentController = require("../controllers/agentController");
const { requireAuth, requireRole } = require("../middelewares/Middelware");

const router = express.Router();
const agentOnly = [requireAuth, requireRole(2)];

router.get("/agent/dashboard", agentOnly, agentController.showDashboard);
router.get("/agent/clients", agentOnly, agentController.listClients);
router.get("/agent/clients/:clientId", agentOnly, agentController.showClient);
router.get("/agent/requests", agentOnly, agentController.listRequests);
router.get("/agent/requests/:id", agentOnly, agentController.showRequest);
router.get("/agent/claims", agentOnly, agentController.listClaims);
router.get("/agent/claims/:id", agentOnly, agentController.showClaim);
router.get("/agent/interactions", agentOnly, agentController.listInteractions);

router.post(
	"/agent/clients/:clientId/requests/:requestId/status",
	agentOnly,
	agentController.processRequest
);
router.put(
	"/agent/clients/:clientId/requests/:requestId/status",
	agentOnly,
	agentController.processRequest
);
router.post(
	"/agent/clients/:clientId/requests/:requestId/comments",
	agentOnly,
	agentController.addRequestComment
);
router.put(
	"/agent/clients/:clientId/requests/:requestId/comments",
	agentOnly,
	agentController.addRequestComment
);

router.post(
	"/agent/clients/:clientId/complaints/:complaintId/status",
	agentOnly,
	agentController.processComplaint
);
router.put(
	"/agent/clients/:clientId/complaints/:complaintId/status",
	agentOnly,
	agentController.processComplaint
);
router.post(
	"/agent/clients/:clientId/complaints/:complaintId/comments",
	agentOnly,
	agentController.addComplaintComment
);
router.put(
	"/agent/clients/:clientId/complaints/:complaintId/comments",
	agentOnly,
	agentController.addComplaintComment
);

module.exports = router;