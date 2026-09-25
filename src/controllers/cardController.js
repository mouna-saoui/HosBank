const CardService = require("../services/CardService");
const AccountRepository = require("../repositories/AccountRepository");

// ── CLIENT ──────────────────────────────────────────────

async function listCards(req, res) {
    try {
        const cards = await CardService.getCards(req.session.userId);
        res.render("cards/list", { cards, error: null });
    } catch (err) {
        res.render("cards/list", { cards: [], error: err.message });
    }
}

async function showCardDetail(req, res) {
    try {
        const card = await CardService.getCardById(req.params.id, req.session.userId);
        res.render("cards/detail", { card, error: null });
    } catch (err) {
        res.redirect("/cards");
    }
}

async function showRequestVirtualCardForm(req, res) {
    const accounts = await AccountRepository.findByUserId(req.session.userId);
    res.render("cards/request", { accounts, error: null });
}

async function requestVirtualCard(req, res) {
    try {
        await CardService.requestVirtualCard(req.session.userId, req.body.account_id);
        res.redirect("/cards");
    } catch (err) {
        const accounts = await AccountRepository.findByUserId(req.session.userId);
        res.render("cards/request", { accounts, error: err.message });
    }
}

async function blockCard(req, res) {
    try {
        await CardService.blockCard(req.params.id, req.session.userId);
        res.redirect(`/cards/${req.params.id}`);
    } catch (err) {
        const card = await CardService.getCardById(req.params.id, req.session.userId).catch(() => null);
        res.render("cards/detail", { card, error: err.message });
    }
}

async function renewCard(req, res) {
    try {
        await CardService.renewCard(req.params.id, req.session.userId);
        res.redirect(`/cards/${req.params.id}`);
    } catch (err) {
        const card = await CardService.getCardById(req.params.id, req.session.userId).catch(() => null);
        res.render("cards/detail", { card, error: err.message });
    }
}

// ── AGENT / ADMIN ────────────────────────────────────────

async function listAllCards(req, res) {
    try {
        const cards = await CardService.getAllCards();
        res.render("cards/admin-list", { cards, error: null });
    } catch (err) {
        res.render("cards/admin-list", { cards: [], error: err.message });
    }
}

async function updateCardStatus(req, res) {
    try {
        await CardService.updateCardStatus(req.params.id, req.body.status);
        res.redirect("/officer/cards");
    } catch (err) {
        const cards = await CardService.getAllCards();
        res.render("cards/admin-list", { cards, error: err.message });
    }
}

module.exports = {
    listCards,
    showCardDetail,
    showRequestVirtualCardForm,
    requestVirtualCard,
    blockCard,
    renewCard,
    listAllCards,
    updateCardStatus,
};
