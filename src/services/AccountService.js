const AccountRepository = require("../repositories/AccountRepository");

function generateAccountNumber() {
    return "ACC" + Date.now() + Math.floor(Math.random() * 1000);
}

function generateIBAN(accountNumber) {
    return "MA" + accountNumber.replace("ACC", "").padStart(24, "0");
}

function generateRIB(accountNumber) {
    return "007" + accountNumber.replace("ACC", "").padStart(20, "0");
}

async function getAccounts(userId) {
    return AccountRepository.findByUserId(userId);
}

async function getAccountDetails(accountId, userId) {
    const account = await AccountRepository.findById(accountId, userId);
    if (!account) throw new Error("Compte introuvable.");

    const transactions = await AccountRepository.findTransactions(accountId, userId);
    return { account, transactions };
}

async function createAccount(userId, accountType) {
    const validTypes = ["current", "savings"];
    if (!validTypes.includes(accountType)) {
        throw new Error("Type de compte invalide. Choisissez 'current' ou 'savings'.");
    }

    const existing = await AccountRepository.findByUserId(userId);
    const alreadyHasType = existing.some(a => a.accountType === accountType && a.status !== "closed");
    if (alreadyHasType) {
        throw new Error(`Vous avez déjà un compte ${accountType === "current" ? "courant" : "épargne"} actif.`);
    }

    const accountNumber = generateAccountNumber();
    const iban = generateIBAN(accountNumber);
    const rib = generateRIB(accountNumber);

    return AccountRepository.create({ userId, accountNumber, accountType, iban, rib });
}

async function closeAccount(accountId, userId) {
    const account = await AccountRepository.findById(accountId, userId);
    if (!account) throw new Error("Compte introuvable.");
    if (account.status === "closed") throw new Error("Ce compte est déjà clôturé.");
    if (parseFloat(account.balance) > 0) throw new Error("Impossible de clôturer un compte avec un solde positif.");

    return AccountRepository.updateStatus(accountId, userId, "closed");
}

module.exports = { getAccounts, getAccountDetails, createAccount, closeAccount };
