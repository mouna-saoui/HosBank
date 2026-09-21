const clientModel = require("../models/clientModel");

async function getDashboard(userId) {
	const client = await clientModel.findClientById(userId);

	if (!client) {
		return null;
	}

	const [accounts, recentTransactions, pendingRequests] = await Promise.all([
		clientModel.findAccountsByClientId(userId),
		clientModel.findRecentTransactionsByClientId(userId),
		clientModel.findPendingRequestsByClientId(userId),
	]);

	const totalBalance = accounts.reduce(
		(total, account) => total + Number(account.balance),
		0
	);

	return {
		client,
		accounts,
		balances: {
			total: totalBalance.toFixed(2),
			currency: accounts[0]?.currency || "MAD",
		},
		recentTransactions,
		pendingRequests,
	};
}

module.exports = { getDashboard };