const clientService = require("../services/clientService");

async function dashboard(req, res) {
	const data = await clientService.getDashboard(req.session.userId);

	if (!data) {
		return res.status(404).send("Client not found");
	}



	return res.status(200).render("client/dashboard", data);
}

module.exports = { dashboard };