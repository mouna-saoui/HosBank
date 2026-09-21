const AuthService = require("../services/AuthService");

async function showLogin(req, res) {
    res.render("auth/login", { error: null });
}

async function handleLogin(req, res) {
    try {
        const { email, password } = req.body;
        const { user, redirect } = await AuthService.login(email, password);
        req.session.userId = user.id;
        req.session.roleId = user.role_id;
        res.redirect(redirect);
    } catch (err) {
        res.render("auth/login", { error: err.message });
    }
}

async function showRegister(req, res) {
    res.render("auth/register", { error: null });
}

async function handleRegister(req, res) {
    try {
        const { firstName, lastName, email, phone, password, confirmPassword } = req.body;
        await AuthService.register({ firstName, lastName, email, phone, password, confirmPassword });
        res.redirect("/login");
    } catch (err) {
        res.render("auth/register", { error: err.message });
    }
}

function logout(req, res) {
    req.session.destroy(() => res.redirect("/login"));
}

module.exports = { showLogin, handleLogin, showRegister, handleRegister, logout };
