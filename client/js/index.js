
let app = null;


function toggleForm() {
    app?.toggleAuthForm();
}

function handleLogin() {
    app?.handleLogin();
}

function handleRegister() {
    app?.handleRegister();
}

function handleLogout() {
    app?.handleLogout();
}

function handlePlayWithPlayer() {
    app?.handlePlayWithPlayer();
}

function handlePlayWithAI() {
    app?.handlePlayWithAI();
}

function showCreateDirectChat() {
    app?.showCreateDirectChat();
}

function showCreateGroupChat() {
    app?.showCreateGroupChat();
}

function closeUserSelectModal() {
    app?.closeUserSelectModal();
}

function createGroupFromModal() {
    app?.createGroupFromModal();
}


document.addEventListener('DOMContentLoaded', () => {
    app = new AppController();
    app.initialize();
});

if (document.readyState === 'loading') {
} else {
    if (!app) {
        app = new AppController();
        app.initialize();
    }
}
