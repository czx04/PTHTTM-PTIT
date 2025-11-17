class AuthView extends BaseView {
    constructor() {
        super('auth-container');
        
        this.loginForm = this.getElementById('login-form');
        this.registerForm = this.getElementById('register-form');
        
        this.loginUsernameInput = this.getElementById('login-username');
        this.loginPasswordInput = this.getElementById('login-password');
        
        this.registerUsernameInput = this.getElementById('register-username');
        this.registerPasswordInput = this.getElementById('register-password');
        this.registerPhoneInput = this.getElementById('register-phone');

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.loginPasswordInput) {
            this.loginPasswordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.onLogin && this.onLogin();
                }
            });
        }

        if (this.registerPasswordInput) {
            this.registerPasswordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.onRegister && this.onRegister();
                }
            });
        }

        if (this.registerPhoneInput) {
            this.registerPhoneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.onRegister && this.onRegister();
                }
            });
        }
    }

    show() {
        super.show();
        this.clearForms();
    }

    toggleForm() {
        if (this.loginForm && this.registerForm) {
            if (this.loginForm.style.display === 'none') {
                this.loginForm.style.display = 'block';
                this.registerForm.style.display = 'none';
            } else {
                this.loginForm.style.display = 'none';
                this.registerForm.style.display = 'block';
            }
        }
    }

    getLoginCredentials() {
        return {
            username: this.loginUsernameInput?.value.trim() || '',
            password: this.loginPasswordInput?.value || ''
        };
    }

    getRegisterData() {
        return {
            username: this.registerUsernameInput?.value.trim() || '',
            password: this.registerPasswordInput?.value || '',
            phone: this.registerPhoneInput?.value.trim() || null
        };
    }

    validateLogin() {
        const { username, password } = this.getLoginCredentials();
        
        if (!username || !password) {
            this.showAlert('login-alert', 'Vui lòng nhập username và mật khẩu', 'error');
            return false;
        }
        
        return true;
    }

    validateRegister() {
        const { username, password } = this.getRegisterData();
        
        if (!username || !password) {
            this.showAlert('register-alert', 'Vui lòng nhập username và mật khẩu', 'error');
            return false;
        }
        
        if (username.length < 3) {
            this.showAlert('register-alert', 'Username phải có ít nhất 3 ký tự', 'error');
            return false;
        }
        
        if (password.length < 6) {
            this.showAlert('register-alert', 'Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return false;
        }
        
        return true;
    }

    showLoginSuccess() {
        this.clearForms();
    }

    showLoginError(message) {
        this.showAlert('login-alert', message, 'error');
    }

    showRegisterSuccess() {
        this.showAlert('register-alert', 'Đăng ký thành công! Đang chuyển đến trang đăng nhập...', 'success');
        
        setTimeout(() => {
            this.clearForms();
            this.toggleForm();
        }, 1500);
    }

    showRegisterError(message) {
        this.showAlert('register-alert', message, 'error');
    }

    clearForms() {
        if (this.loginUsernameInput) this.loginUsernameInput.value = '';
        if (this.loginPasswordInput) this.loginPasswordInput.value = '';
        if (this.registerUsernameInput) this.registerUsernameInput.value = '';
        if (this.registerPasswordInput) this.registerPasswordInput.value = '';
        if (this.registerPhoneInput) this.registerPhoneInput.value = '';
    }

    setOnLogin(callback) {
        this.onLogin = callback;
    }

    setOnRegister(callback) {
        this.onRegister = callback;
    }
}
