const express = require("express");
const beneficiaryController = require("../controllers/beneficiaryController");
const { requireApiAuth, requireRole } = require("../middelewares/Middelware");

const router = express.Router();
const clientOnly = [requireApiAuth, requireRole(1)];

router.post("/beneficiaries", clientOnly, beneficiaryController.create);
router.get("/beneficiaries", clientOnly, beneficiaryController.list);
router.get("/beneficiaries/:id", clientOnly, beneficiaryController.get);
router.put("/beneficiaries/:id", clientOnly, beneficiaryController.update);
router.delete("/beneficiaries/:id", clientOnly, beneficiaryController.remove);

module.exports = router;