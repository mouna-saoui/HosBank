const BankRequestService = require("../services/BankRequestService");
const AccountRepository = require("../repositories/AccountRepository");

// ── CLIENT ──────────────────────────────────────────────

// US-11 : Demande ouverture compte épargne
async function showSavingsRequestForm(req, res) {
    const requests = await BankRequestService.getSavingsRequests(req.session.userId);
    res.render("requests/savings", { requests, error: null });
}

async function createSavingsRequest(req, res) {
    try {
        await BankRequestService.requestSavingsAccount(req.session.userId);
        res.redirect("/requests/savings");
    } catch (err) {
        const requests = await BankRequestService.getSavingsRequests(req.session.userId);
        res.render("requests/savings", { requests, error: err.message });
    }
}

// US-12 : Demande RIB
async function showRibRequestForm(req, res) {
    const accounts = await AccountRepository.findByUserId(req.session.userId);
    const requests = await BankRequestService.getRibRequests(req.session.userId);
    res.render("requests/rib", { accounts, requests, error: null });
}

async function createRibRequest(req, res) {
    try {
        await BankRequestService.requestRib(req.session.userId, req.body.account_id);
        res.redirect("/requests/rib");
    } catch (err) {
        const accounts = await AccountRepository.findByUserId(req.session.userId);
        const requests = await BankRequestService.getRibRequests(req.session.userId);
        res.render("requests/rib", { accounts, requests, error: err.message });
    }
}

async function showRibInfo(req, res) {
    try {
        const ribInfo = await BankRequestService.generateRibInfo(req.params.id, req.session.userId);
        res.render("requests/rib-info", { ribInfo, error: null });
    } catch (err) {
        res.redirect("/requests/rib");
    }
}

// ── AGENT / ADMIN ────────────────────────────────────────

async function listRequestsByType(req, res) {
    const type = req.params.type;
    const requests = await BankRequestService.getAllByType(type);
    res.render("requests/admin-list", { requests, type, error: null });
}

async function showRequestDetail(req, res) {
    try {
        const request = await BankRequestService.getRequestById(req.params.id);
        res.render("requests/admin-detail", { request, error: null });
    } catch (err) {
        res.redirect("/officer/requests/rib");
    }
}

async function processRequest(req, res) {
    try {
        const { status, resolution_note } = req.body;
        await BankRequestService.updateRequestStatus(req.params.id, status, req.session.userId, resolution_note);
        res.redirect(`/officer/requests/${req.body.request_type}`);
    } catch (err) {
        const request = await BankRequestService.getRequestById(req.params.id);
        res.render("requests/admin-detail", { request, error: err.message });
    }
}

module.exports = {
    showSavingsRequestForm,
    createSavingsRequest,
    showRibRequestForm,
    createRibRequest,
    showRibInfo,
    listRequestsByType,
    showRequestDetail,
    processRequest,
};
