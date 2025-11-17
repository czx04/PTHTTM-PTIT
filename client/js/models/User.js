class User {
    constructor(data = {}) {
        this.id = data.id || null;
        this.username = data.username || '';
        this.phone = data.phone || null;
        this.createdAt = data.created_at ? new Date(data.created_at) : null;
    }

    isValid() {
        return this.id !== null && this.username !== '';
    }

    getDisplayName() {
        return this.username;
    }

    getAvatarInitial() {
        return this.username.charAt(0).toUpperCase();
    }

    static fromApiResponse(data) {
        return new User(data);
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            phone: this.phone,
            created_at: this.createdAt
        };
    }
}
