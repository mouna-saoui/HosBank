const clientModel = require("../repositories/clientRepository");

async function getDashboard(userId) {
	const client = await clientModel.findClientById(userId);

	if (!client) {
		return null;
	}

	const accounts = await clientModel.findAccountsByClientId(userId);
	const recentTransactions = await clientModel.findRecentTransactionsByClientId(userId);
	const pendingRequests = await clientModel.findPendingRequestsByClientId(userId);

	let totalBalance = 0;
	for (let i = 0; i < accounts.length; i++) {
		totalBalance += Number(accounts[i].balance);
	}

	let defaultCurrency = "MAD";
	if (accounts.length > 0 && accounts[0].currency) {
		defaultCurrency = accounts[0].currency;
	}

	return {
		client: client,
		accounts: accounts,
		balances: {
			total: totalBalance.toFixed(2),
			currency: defaultCurrency,
		},
		recentTransactions: recentTransactions,
		pendingRequests: pendingRequests,
	};
}

module.exports = { getDashboard };