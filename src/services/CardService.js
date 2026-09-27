const CardRepository = require("../repositories/CardRepository");
const AccountRepository = require("../repositories/AccountRepository");
const BankRequestRepository = require("../repositories/BankRequestRepository");

// US-16 : Demander carte virtuelle (client → crée une bank_request en attente d'approbation)
async function requestVirtualCard(userId, accountId) {
    const account = await AccountRepository.findById(accountId, userId);
    if (!account) throw new Error("Compte introuvable.");
    if (account.status !== "active") throw new Error("Ce compte n'est pas actif.");

    const cards = await CardRepository.findByUserId(userId);
    const hasActiveVirtual = cards.some(
        c => c.card_type === "virtual" && c.account_id == accountId && c.status === "active"
    );
    if (hasActiveVirtual) throw new Error("Une carte virtuelle active existe déjà pour ce compte.");

    // Vérifier s'il y a déjà une demande en cours pour ce compte
    const pending = await BankRequestRepository.findByUserIdAndType(userId, "virtual_card");
    const hasPending = pending.some(
        r => ["pending", "in_review"].includes(r.status) && r.details?.account_id == accountId
    );
    if (hasPending) throw new Error("Une demande de carte virtuelle est déjà en cours pour ce compte.");

    // Créer la bank_request (pas la carte directement)
    return BankRequestRepository.create({
        userId,
        requestType: "virtual_card",
        details: { account_id: accountId, account_number: account.accountNumber },
    });
}

// Appelé automatiquement par BankRequestService quand la demande est approuvée
async function createApprovedVirtualCard(userId, accountId) {
    const now = new Date();
    const expiryYear = now.getFullYear() + 3;
    const expiryMonth = now.getMonth() + 1;
    const lastFour = String(Math.floor(1000 + Math.random() * 9000));
    const cardToken = "VRT-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    const card = await CardRepository.create({ userId, accountId, cardType: "virtual" });

    const pool = require("../config/Database");
    const { rows } = await pool.query(
        `UPDATE cards SET last_four = $1, card_token = $2, expiry_month = $3, expiry_year = $4
         WHERE id = $5 RETURNING *`,
        [lastFour, cardToken, expiryMonth, expiryYear, card.id]
    );
    return rows[0];
}

// Consulter cartes
async function getCards(userId) {
    return CardRepository.findByUserId(userId);
}

async function getCardById(id, userId) {
    const card = await CardRepository.findByIdAndUserId(id, userId);
    if (!card) throw new Error("Carte introuvable.");
    return card;
}

// Faire opposition
async function blockCard(id, userId) {
    const card = await CardRepository.findByIdAndUserId(id, userId);
    if (!card) throw new Error("Carte introuvable.");
    if (card.status === "blocked") throw new Error("Cette carte est déjà bloquée.");
    if (card.status === "cancelled") throw new Error("Cette carte est annulée.");
    return CardRepository.updateStatus(id, userId, "blocked");
}

// Renouveler / recalculer PIN (renouvelle la date d'expiration)
async function renewCard(id, userId) {
    const card = await CardRepository.findByIdAndUserId(id, userId);
    if (!card) throw new Error("Carte introuvable.");
    if (card.status === "cancelled") throw new Error("Cette carte est annulée.");

    const now = new Date();
    const expiryYear = now.getFullYear() + 3;
    const expiryMonth = now.getMonth() + 1;
    return CardRepository.updatePin(id, userId, expiryMonth, expiryYear);
}

// Modifier statut (admin / chargé client)
async function updateCardStatus(id, status) {
    const VALID = ["active", "blocked", "expired", "cancelled"];
    if (!VALID.includes(status)) throw new Error("Statut invalide.");
    const card = await CardRepository.findById(id);
    if (!card) throw new Error("Carte introuvable.");
    return CardRepository.updateStatusById(id, status);
}

// Toutes les cartes (admin / chargé client)
async function getAllCards() {
    return CardRepository.findAll();
}

module.exports = {
    requestVirtualCard,
    createApprovedVirtualCard,
    getCards,
    getCardById,
    blockCard,
    renewCard,
    updateCardStatus,
    getAllCards,
};
