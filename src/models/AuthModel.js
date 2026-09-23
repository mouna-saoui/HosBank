class User {
    constructor({ id, role_id, first_name, last_name, email, phone, status, created_at }) {
        this.id = id;
        this.roleId = role_id;
        this.firstName = first_name;
        this.lastName = last_name;
        this.email = email;
        this.phone = phone;
        this.status = status;
        this.createdAt = created_at;
    }
}

module.exports = User;
