class AuthService extends ApiService {
    constructor() {
        super('http://localhost:8000/api/auth');
    }

    async register(username, password, phone = null) {
        const requestBody = { username, password };
        if (phone) {
            requestBody.phone = phone;
        }

        const data = await this.post('register', requestBody);
        return data;
    }

    async login(username, password) {
        const data = await this.post('login', { username, password });
        
        const user = User.fromApiResponse(data.user);
        appState.setCurrentUser(user);
        appState.setToken(data.access_token);
        appState.saveToSession();

        return { user, token: data.access_token };
    }

    async logout() {
        try {
            await this.post('logout', null);
        } catch (error) {
            console.error('Logout API error:', error);
        }

        appState.clear();
        appState.clearSession();
    }

    async getCurrentUser() {
        const data = await this.get('me');
        const user = User.fromApiResponse(data);
        
        appState.setCurrentUser(user);
        appState.saveToSession();

        return user;
    }

    async verifySession() {
        if (!appState.loadFromSession()) {
            return null;
        }

        try {
            const user = await this.getCurrentUser();
            return user;
        } catch (error) {
            console.error('Token verification failed:', error);
            appState.clear();
            appState.clearSession();
            return null;
        }
    }
}
