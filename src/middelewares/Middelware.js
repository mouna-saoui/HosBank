function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.redirect("/login");
    }
    next();
}

function requireApiAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

function requireRole(...roleIds) {
    return function (req, res, next) {
        if (!req.session || !roleIds.includes(req.session.roleId)) {
            return res.status(403).send("Accès refusé");
        }
        next();
    };
}

module.exports = { requireAuth, requireApiAuth, requireRole };