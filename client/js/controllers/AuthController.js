class AuthController {
    constructor(authView, authService) {
        this.authView = authView;
        this.authService = authService;

        this.setupViewCallbacks();
    }

    setupViewCallbacks() {
        this.authView.setOnLogin(() => this.handleLogin());
        this.authView.setOnRegister(() => this.handleRegister());
    }

    async handleLogin() {
        if (!this.authView.validateLogin()) {
            return;
        }

        const { username, password } = this.authView.getLoginCredentials();

        try {
            const { user } = await this.authService.login(username, password);
            this.authView.showLoginSuccess();
            
            this.onLoginSuccess && this.onLoginSuccess(user);
        } catch (error) {
            this.authView.showLoginError(error.message);
        }
    }

    async handleRegister() {
        if (!this.authView.validateRegister()) {
            return;
        }

        const { username, password, phone } = this.authView.getRegisterData();

        try {
            await this.authService.register(username, password, phone);
            this.authView.showRegisterSuccess();
        } catch (error) {
            this.authView.showRegisterError(error.message);
        }
    }

    async handleLogout() {
        await this.authService.logout();
        
        this.onLogout && this.onLogout();
    }

    async verifySession() {
        const user = await this.authService.verifySession();
        return user;
    }

    showAuthView() {
        this.authView.show();
    }

    hideAuthView() {
        this.authView.hide();
    }

    toggleForm() {
        this.authView.toggleForm();
    }

    setOnLoginSuccess(callback) {
        this.onLoginSuccess = callback;
    }

    setOnLogout(callback) {
        this.onLogout = callback;
    }
}
