class AuthController {
  constructor() {
    this.login = (req, res) => {
      res.render("auth/login");
    };
    this.register = (req, res) => {
      res.render("auth/register");
    };
  }

  register(req, res) {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const phone = req.body.phone;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
  }
}

module.exports = new AuthController();
