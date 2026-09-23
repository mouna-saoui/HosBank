const AccountService = require("../services/AccountService");

async function listAccounts(req, res) {
    try {
        const accounts = await AccountService.getAccounts(req.session.userId);
        res.render("account/list", { accounts, error: null });
    } catch (err) {
        res.render("account/list", { accounts: [], error: err.message });
    }
}

async function showAccount(req, res) {
    try {
        const { account, transactions } = await AccountService.getAccountDetails(
            req.params.id,
            req.session.userId
        );
        res.render("account/detail", { account, transactions, error: null });
    } catch (err) {
        res.redirect("/accounts");
    }
}

async function showCreateForm(req, res) {
    res.render("account/create", { error: null });
}

async function createAccount(req, res) {
    try {
        await AccountService.createAccount(req.session.userId, req.body.account_type);
        res.redirect("/accounts");
    } catch (err) {
        res.render("account/create", { error: err.message });
    }
}

async function closeAccount(req, res) {
    try {
        await AccountService.closeAccount(req.params.id, req.session.userId);
        res.redirect("/accounts");
    } catch (err) {
        const { account, transactions } = await AccountService.getAccountDetails(
            req.params.id,
            req.session.userId
        );
        res.render("account/detail", { account, transactions, error: err.message });
    }
}

module.exports = { listAccounts, showAccount, showCreateForm, createAccount, closeAccount };
