const TransferService = require("../services/TransferService");

async function showTransfers(req, res) {
	try {
		const data = await TransferService.getPageData(req.session.userId);
		data.activePage = "transfers";
		data.error = null;
		data.success = req.query.success === "1";
		data.formValues = {};
		res.render("transfers/list", data);
	} catch (error) {
		res.status(error.statusCode || 500).send(error.message);
	}
}

async function createTransfer(req, res) {
	try {
		await TransferService.createTransfer(req.session.userId, req.body);
		res.redirect("/virements?success=1");
	} catch (error) {
		try {
			const data = await TransferService.getPageData(req.session.userId);
			data.activePage = "transfers";
			data.error = error.message;
			data.success = false;
			data.formValues = req.body;
			res.status(error.statusCode || 500).render("transfers/list", data);
		} catch (pageError) {
			res.status(pageError.statusCode || 500).send(pageError.message);
		}
	}
}

module.exports = { showTransfers, createTransfer };