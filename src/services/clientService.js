const clientRepository = require("../repositories/clientRepository");

async function getDashboard(userId) {
	const client = await clientRepository.findClientById(userId);

	if (!client) {
		return null;
	}

	const [accounts, recentTransactions, pendingRequests] = await Promise.all([
		clientRepository.findAccountsByClientId(userId),
		clientRepository.findRecentTransactionsByClientId(userId),
		clientRepository.findPendingRequestsByClientId(userId),
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