const pool = require("../config/Database");
const bcrypt = require("bcrypt");

async function login(req, res) {
   const { email, password } = req.body;
   const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

   if (result.rows.length === 0) {
      return res.status(401).render("auth/login", { error: "Email or password incorrect" });
   }

   const user = result.rows[0];
   const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

   if (!isPasswordCorrect) {
      return res.status(401).render("auth/login", { error: "Email or password incorrect" });
   }

   req.session.userId = user.id;
   req.session.roleId = user.role_id;

   const dashboards = {
      1: "/client/dashboard",
      2: "/officer/dashboard",
      3: "/admin/dashboard",
   };

   return res.redirect(dashboards[user.role_id] || "/login");
}

module.exports = { login };


















