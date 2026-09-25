const BankRequestRepository = require("../repositories/BankRequestRepository");
const AccountRepository = require("../repositories/AccountRepository");

// US-11 : Demande ouverture compte épargne
async function requestSavingsAccount(userId) {
    const accounts = await AccountRepository.findByUserId(userId);
    const hasActiveSavings = accounts.some(a => a.accountType === "savings" && a.status !== "closed");
    if (hasActiveSavings) throw new Error("Vous avez déjà un compte épargne actif.");

    const pending = await BankRequestRepository.findByUserIdAndType(userId, "savings_account");
    const hasPending = pending.some(r => ["pending", "in_review"].includes(r.status));
    if (hasPending) throw new Error("Une demande d'ouverture de compte épargne est déjà en cours.");

    return BankRequestRepository.create({ userId, requestType: "savings_account" });
}

async function getSavingsRequests(userId) {
    return BankRequestRepository.findByUserIdAndType(userId, "savings_account");
}

// US-12 : Demande RIB
async function requestRib(userId, accountId) {
    const account = await AccountRepository.findById(accountId, userId);
    if (!account) throw new Error("Compte introuvable.");
    if (account.status !== "active") throw new Error("Ce compte n'est pas actif.");

    const pending = await BankRequestRepository.findByUserIdAndType(userId, "rib");
    const hasPending = pending.some(r => ["pending", "in_review"].includes(r.status) && r.details?.account_id == accountId);
    if (hasPending) throw new Error("Une demande RIB est déjà en cours pour ce compte.");

    return BankRequestRepository.create({
        userId,
        requestType: "rib",
        details: { account_id: accountId, account_number: account.accountNumber },
    });
}

async function getRibRequests(userId) {
    return BankRequestRepository.findByUserIdAndType(userId, "rib");
}

async function getRibRequestById(id, userId) {
    const request = await BankRequestRepository.findByIdAndUserId(id, userId);
    if (!request) throw new Error("Demande introuvable.");
    if (request.request_type !== "rib") throw new Error("Type de demande invalide.");
    return request;
}

// Génère les infos RIB à partir du compte
async function generateRibInfo(requestId, userId) {
    const request = await getRibRequestById(requestId, userId);
    if (request.status !== "completed") throw new Error("La demande RIB n'est pas encore traitée.");

    const accountId = request.details?.account_id;
    const account = await AccountRepository.findById(accountId, userId);
    if (!account) throw new Error("Compte associé introuvable.");

    return {
        accountNumber: account.accountNumber,
        iban: account.iban,
        rib: account.rib,
        currency: account.currency,
    };
}

// Traitement par chargé client / admin
async function getAllByType(requestType) {
    return BankRequestRepository.findAllByType(requestType);
}

async function getRequestById(id) {
    const request = await BankRequestRepository.findById(id);
    if (!request) throw new Error("Demande introuvable.");
    return request;
}

const VALID_STATUSES = ["pending", "in_review", "approved", "rejected", "completed", "cancelled"];

async function updateRequestStatus(id, status, officerId, resolutionNote) {
    if (!VALID_STATUSES.includes(status)) throw new Error("Statut invalide.");
    const request = await BankRequestRepository.findById(id);
    if (!request) throw new Error("Demande introuvable.");

    const updated = await BankRequestRepository.updateStatus(id, status, officerId, resolutionNote || null);

    // Si demande épargne approuvée → créer le compte automatiquement
    if (request.request_type === "savings_account" && status === "approved") {
        const AccountService = require("./AccountService");
        await AccountService.createAccount(request.user_id, "savings");
    }

    return updated;
}

module.exports = {
    requestSavingsAccount,
    getSavingsRequests,
    requestRib,
    getRibRequests,
    getRibRequestById,
    generateRibInfo,
    getAllByType,
    getRequestById,
    updateRequestStatus,
};
