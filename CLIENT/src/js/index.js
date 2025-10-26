const BACKEND_HOST = "localhost:8000";

let currentUsername = '';
let currentToken = '';
let wsSocket = null;

const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const userList = document.getElementById('online-users-list');
const wsStatus = document.getElementById('ws-status');

// --- HÀM HỖ TRỢ ---

function showAlert(elementId, message, type) {
    const alertDiv = document.getElementById(elementId);
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 5000);
}

function toggleForm() {
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
}

async function sendApiRequest(endpoint, body) {
    const response = await fetch(`http://${BACKEND_HOST}/api/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || `Lỗi không xác định (${response.status})`);
    }
    return data;
}


function showDashboard(username) {
    authContainer.style.display = 'none';
    dashboard.classList.add('active');
    document.getElementById('welcome-username').textContent = username;
}

// --- HÀM XỬ LÝ SỰ KIỆN ---

async function handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const phone = document.getElementById('register-phone').value;

    if (!username || !password || !phone) {
        showAlert('register-alert', 'Vui lòng nhập đủ thông tin', 'error');
        return;
    }

    try {
        await sendApiRequest('register', {username, password, phone});
        showAlert('register-alert', `Đăng ký thành công! Bây giờ bạn có thể đăng nhập.`, 'success');

        document.getElementById('register-username').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-phone').value = '';

        setTimeout(() => toggleForm(), 1000);
    } catch (error) {
        showAlert('register-alert', `${error.message}`, 'error');
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
        const data = await sendApiRequest('login', {username, password});
        currentToken = data.token;
        currentUsername = data.username;


        sessionStorage.setItem('authToken', currentToken);
        sessionStorage.setItem('username', currentUsername);

        connectWebSocket(currentToken);
        showDashboard(currentUsername);


        document.getElementById('login-password').value = '';

    } catch (error) {
        showAlert('login-alert', `${error.message}`, 'error');
    }
}

function handleLogout() {
    if (wsSocket) {
        wsSocket.close();
    }

    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');

    currentUsername = '';
    currentToken = '';

    userList.innerHTML = '<li style="text-align: center; color: var(--text-secondary);"><span>Đang chờ cập nhật...</span></li>';
    dashboard.classList.remove('active');
    authContainer.style.display = 'flex';

    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';

    wsStatus.classList.add('offline');
    wsStatus.innerHTML = '<div class="status-dot"></div><span>Đã ngắt kết nối</span>';
}

function connectWebSocket(token) {
    const wsProtocol = "ws";
    const wsUrl = `${wsProtocol}://${BACKEND_HOST}/ws/connect?token=${token}`;

    if (wsSocket) {
        wsSocket.close();
    }

    wsSocket = new WebSocket(wsUrl);

    wsSocket.onopen = () => {
        wsStatus.classList.remove('offline');
        wsStatus.innerHTML = '<div class="status-dot"></div><span>Đang trực tuyến</span>';
    };

    wsSocket.onmessage = (event) => {
        const message = event.data;

        // if (message.startsWith("ONLINE_USERS:")) {
        //     const userString = message.substring("ONLINE_USERS:".length);
        //
        //     const users = userString.split(',').filter(u => u.trim() !== '');
        //
        //     userList.innerHTML = '';
        //
        //     if (users.length === 0) {
        //          userList.innerHTML = '<li style="text-align: center; color: var(--text-secondary);"><span>Chưa có người dùng nào khác.</span></li>';
        //          return;
        //     }
        //
        //     users.forEach(user => {
        //         const li = document.createElement('li');
        //         if (user === currentUsername) {
        //             li.classList.add('current-user');
        //         }
        //         const statusText = user === currentUsername ? 'Bạn (Đang trực tuyến)' : 'Đang trực tuyến';
        //
        //         li.innerHTML = `
        //                     <div class="user-avatar">${user.charAt(0).toUpperCase()}</div>
        //                     <div class="user-info">
        //                         <div class="user-name">${user}</div>
        //                         <div class="user-status">${statusText}</div>
        //                     </div>
        //                 `;
        //         userList.appendChild(li);
        //     });
        // }
    };

    wsSocket.onclose = (event) => {
        wsStatus.classList.add('offline');
        wsStatus.innerHTML = `<div class="status-dot"></div><span>Ngắt kết nối (Code: ${event.code})</span>`;

        if (event.code === 1008 || event.code === 1006) {
            console.warn("Lỗi WebSocket: Phiên làm việc hết hạn hoặc kết nối bị từ chối.");
            alert("Phiên làm việc hết hạn hoặc kết nối lỗi. Vui lòng đăng nhập lại.");
            handleLogout();
        }
    };

    wsSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        wsStatus.classList.add('offline');
        wsStatus.innerHTML = '<div class="status-dot"></div><span>Lỗi kết nối</span>';
    };
}

// ktra nếu có session sẵn thì tự động đăng nhập
function initializeApp() {
    const storedToken = sessionStorage.getItem('authToken');
    const storedUsername = sessionStorage.getItem('username');

    if (storedToken && storedUsername) {
        currentToken = storedToken;
        currentUsername = storedUsername;

        connectWebSocket(currentToken);
        showDashboard(currentUsername);
    } else {
        authContainer.style.display = 'flex';
        dashboard.classList.remove('active');
    }
}

initializeApp();