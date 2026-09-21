const bcrypt = require("bcrypt");
const AuthRepository = require("../repositories/AuthRepository");

const ROLE_CLIENT = 1;
const SALT_ROUNDS = 10;

const DASHBOARDS = {
    1: "/client/dashboard",
    2: "/officer/dashboard",
    3: "/admin/dashboard",
};

async function login(email, password) {
    const user = await AuthRepository.findByEmail(email);
    if (!user) throw new Error("Email ou mot de passe incorrect.");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error("Email ou mot de passe incorrect.");

    return { user, redirect: DASHBOARDS[user.role_id] || "/" };
}

async function register({ firstName, lastName, email, phone, password, confirmPassword }) {
    if (password !== confirmPassword) throw new Error("Les mots de passe ne correspondent pas.");

    const existing = await AuthRepository.findByEmail(email);
    if (existing) throw new Error("Cet email est déjà utilisé.");

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    return AuthRepository.create({ roleId: ROLE_CLIENT, firstName, lastName, email, phone, passwordHash });
}

module.exports = { login, register };
