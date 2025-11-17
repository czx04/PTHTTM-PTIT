class AppController {
    constructor() {
        this.authService = new AuthService();
        this.chatService = new ChatService();
        this.wsService = webSocketService;

        this.authView = new AuthView();
        this.dashboardView = new DashboardView();
        this.chatView = new ChatView();
        this.modalView = new ModalView();

        this.authController = new AuthController(this.authView, this.authService);
        this.chatController = new ChatController(
            this.chatView,
            this.modalView,
            this.chatService,
            this.wsService
        );

        this.setupControllerCallbacks();
        this.setupDashboardCallbacks();
    }

    setupControllerCallbacks() {
        this.authController.setOnLoginSuccess((user) => this.handleLoginSuccess(user));
        this.authController.setOnLogout(() => this.handleLogout());
    }

    setupDashboardCallbacks() {
        this.dashboardView.setOnLogout(() => this.handleLogoutRequest());
        this.dashboardView.setOnPlayWithPlayer(() => this.handlePlayWithPlayer());
        this.dashboardView.setOnPlayWithAI(() => this.handlePlayWithAI());
    }

    async initialize() {
        const user = await this.authController.verifySession();

        if (user) {
            this.showDashboard(user);
        } else {
            this.showAuthPage();
        }
    }

    handleLoginSuccess(user) {
        this.showDashboard(user);
    }

    async handleLogoutRequest() {
        this.chatController.disconnect();

        await this.authController.handleLogout();

        this.showAuthPage();
    }

    handleLogout() {
        this.showAuthPage();
    }

    showDashboard(user) {
        this.authController.hideAuthView();
        this.dashboardView.show();
        this.dashboardView.updateUserInfo(user);

        this.chatController.initialize();
    }

    showAuthPage() {
        this.dashboardView.hide();
        this.authController.showAuthView();
    }

    handlePlayWithPlayer() {
        alert('🎮 Chế độ "Chơi với Người" đang được phát triển!');
    }

    handlePlayWithAI() {
        alert('🤖 Chế độ "Chơi với Máy" đang được phát triển!');
    }

    toggleAuthForm() {
        this.authController.toggleForm();
    }

    handleLogin() {
        this.authController.handleLogin();
    }

    handleRegister() {
        this.authController.handleRegister();
    }

    handleLogout() {
        this.handleLogoutRequest();
    }

    handlePlayWithPlayer() {
        this.handlePlayWithPlayer();
    }

    handlePlayWithAI() {
        this.handlePlayWithAI();
    }

    showCreateDirectChat() {
        this.chatController.showCreateDirectChat();
    }

    showCreateGroupChat() {
        this.chatController.showCreateGroupChat();
    }

    closeUserSelectModal() {
        this.modalView.close();
    }

    createGroupFromModal() {
        this.chatController.createGroup();
    }
}
