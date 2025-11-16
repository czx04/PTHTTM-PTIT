// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/auth';

// Global state
let currentUser = null;
let currentToken = null;

// DOM Elements
const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const authStatus = document.getElementById('auth-status');

// ===== UTILITY FUNCTIONS =====

function showAlert(elementId, message, type) {
    const alertDiv = document.getElementById(elementId);
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 5000);
}

function toggleForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

async function sendApiRequest(endpoint, body, method = 'POST') {
    const url = `${API_BASE_URL}/${endpoint}`;
    const headers = {
        'Content-Type': 'application/json'
    };

    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: body ? JSON.stringify(body) : null
        });
        
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || `Lỗi không xác định (${response.status})`);
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

function saveSession(token, user) {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('userData', JSON.stringify(user));
    currentToken = token;
    currentUser = user;
}

function clearSession() {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');
    currentToken = null;
    currentUser = null;
}

function showDashboard(user) {
    authContainer.style.display = 'none';
    dashboard.classList.add('active');
    
    // Update header
    document.getElementById('welcome-username').textContent = user.username;
    document.getElementById('user-id-display').textContent = `ID: ${user.id}`;
    
    // Update profile card
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-id').textContent = user.id;
    document.getElementById('profile-phone').textContent = user.phone || 'Chưa cập nhật';
    
    // Update avatar
    const avatarLarge = document.getElementById('user-avatar');
    avatarLarge.textContent = user.username.charAt(0).toUpperCase();
    
    // Update auth status
    authStatus.classList.remove('offline');
    authStatus.classList.add('online');
    authStatus.innerHTML = '<div class="status-dot"></div><span>Đã xác thực</span>';
}

function showAuthPage() {
    dashboard.classList.remove('active');
    authContainer.style.display = 'flex';
    
    // Reset forms
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-username').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-phone').value = '';
}

// ===== AUTH HANDLERS =====

async function handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const phone = document.getElementById('register-phone').value.trim();

    if (!username || !password) {
        showAlert('register-alert', 'Vui lòng nhập username và mật khẩu', 'error');
        return;
    }

    if (username.length < 3) {
        showAlert('register-alert', 'Username phải có ít nhất 3 ký tự', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('register-alert', 'Mật khẩu phải có ít nhất 6 ký tự', 'error');
        return;
    }

    try {
        const requestBody = {
            username: username,
            password: password
        };
        
        if (phone) {
            requestBody.phone = phone;
        }

        const data = await sendApiRequest('register', requestBody);
        
        showAlert('register-alert', 'Đăng ký thành công! Đang chuyển đến trang đăng nhập...', 'success');
        
        // Clear form
        document.getElementById('register-username').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-phone').value = '';
        
        // Switch to login form after 1.5 seconds
        setTimeout(() => {
            toggleForm();
        }, 1500);
        
    } catch (error) {
        showAlert('register-alert', error.message, 'error');
    }
}

async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showAlert('login-alert', 'Vui lòng nhập username và mật khẩu', 'error');
        return;
    }

    try {
        const data = await sendApiRequest('login', {
            username: username,
            password: password
        });

        // Save session
        saveSession(data.access_token, data.user);
        
        // Clear password field
        document.getElementById('login-password').value = '';
        
        // Show dashboard
        showDashboard(data.user);
        
    } catch (error) {
        showAlert('login-alert', error.message, 'error');
    }
}

async function handleLogout() {
    try {
        // Call logout API
        await sendApiRequest('logout', null, 'POST');
    } catch (error) {
        console.error('Logout API error:', error);
        // Continue with local logout even if API fails
    }
    
    // Clear session
    clearSession();
    
    // Show auth page
    showAuthPage();
}

// ===== INITIALIZATION =====

async function initializeApp() {
    const storedToken = sessionStorage.getItem('authToken');
    const storedUserData = sessionStorage.getItem('userData');

    if (storedToken && storedUserData) {
        currentToken = storedToken;
        currentUser = JSON.parse(storedUserData);

        try {
            // Verify token by getting current user
            const userData = await sendApiRequest('me', null, 'GET');
            
            // Update stored user data
            saveSession(currentToken, userData);
            
            // Show dashboard
            showDashboard(userData);
            
        } catch (error) {
            console.error('Token verification failed:', error);
            // Token invalid, clear session and show auth page
            clearSession();
            showAuthPage();
        }
    } else {
        showAuthPage();
    }
}

// ===== EVENT LISTENERS =====

// Enter key listeners
document.getElementById('login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
    }
});

document.getElementById('register-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleRegister();
    }
});

document.getElementById('register-phone').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleRegister();
    }
});

// Initialize app on page load
initializeApp();
