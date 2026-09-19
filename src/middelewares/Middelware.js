function requireAuth(req, res, next) {
	if (!req.session || !req.session.userId) {
		return res.redirect("/login");
	}

	next();
}

function requireRole(roleId) {
	return function (req, res, next) {
		if (!req.session || req.session.roleId !== roleId) {
			return res.status(403).send("Access denied");
		}

		next();
	};
}

module.exports = {
	requireAuth,
	requireRole,
};
