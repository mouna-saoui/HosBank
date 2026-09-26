const express = require("express");
const adminController = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middelewares/Middelware");

const router = express.Router();
const adminOnly = [requireAuth, requireRole(3)];

router.get("/admin/dashboard", adminOnly, adminController.dashboard);
router.get("/admin/users", adminOnly, adminController.users);
router.post("/admin/users/:id/status", adminOnly, adminController.updateUserStatus);
router.put("/admin/users/:id/status", adminOnly, adminController.updateUserStatus);
router.post("/admin/users/:id/role", adminOnly, adminController.updateUserRole);
router.put("/admin/users/:id/role", adminOnly, adminController.updateUserRole);

router.get("/admin/assignments", adminOnly, adminController.assignments);
router.post("/admin/assignments", adminOnly, adminController.createAssignment);

router.get("/admin/accounts", adminOnly, adminController.accounts);
router.post("/admin/accounts/:id/status", adminOnly, adminController.updateAccountStatus);
router.put("/admin/accounts/:id/status", adminOnly, adminController.updateAccountStatus);
router.get("/admin/cards", adminOnly, adminController.cards);
router.post("/admin/cards/:id/status", adminOnly, adminController.updateCardStatus);
router.put("/admin/cards/:id/status", adminOnly, adminController.updateCardStatus);
router.get("/admin/operations", adminOnly, adminController.operations);

router.get("/admin/requests", adminOnly, adminController.requests);
router.post("/admin/requests/:id/status", adminOnly, adminController.updateRequestStatus);
router.put("/admin/requests/:id/status", adminOnly, adminController.updateRequestStatus);
router.get("/admin/complaints", adminOnly, adminController.complaints);
router.post("/admin/complaints/:id/status", adminOnly, adminController.updateComplaintStatus);
router.put("/admin/complaints/:id/status", adminOnly, adminController.updateComplaintStatus);

module.exports = router;