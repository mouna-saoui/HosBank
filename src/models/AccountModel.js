class Account {
    constructor({ id, user_id, account_number, account_type, iban, rib, balance, currency, status, created_at }) {
        this.id = id;
        this.userId = user_id;
        this.accountNumber = account_number;
        this.accountType = account_type;
        this.iban = iban;
        this.rib = rib;
        this.balance = balance;
        this.currency = currency;
        this.status = status;
        this.createdAt = created_at;
    }
}

module.exports = Account;
