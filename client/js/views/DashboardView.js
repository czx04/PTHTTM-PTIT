class DashboardView extends BaseView {
    constructor() {
        super('dashboard');
        
        this.welcomeUsername = this.getElementById('welcome-username');
        this.userIdDisplay = this.getElementById('user-id-display');
    }

    show() {
        this.element.classList.add('active');
    }

    hide() {
        this.element.classList.remove('active');
    }

    updateUserInfo(user) {
        if (this.welcomeUsername) {
            this.welcomeUsername.textContent = user.username;
        }
        if (this.userIdDisplay) {
            this.userIdDisplay.textContent = `ID: ${user.id}`;
        }
    }

    setOnLogout(callback) {
        this.onLogout = callback;
    }

    setOnPlayWithPlayer(callback) {
        this.onPlayWithPlayer = callback;
    }

    setOnPlayWithAI(callback) {
        this.onPlayWithAI = callback;
    }
}
