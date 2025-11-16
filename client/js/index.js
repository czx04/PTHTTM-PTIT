// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/auth';
const CHAT_API_URL = 'http://localhost:8000/api/chat';
const WS_URL = 'ws://localhost:8000/ws/chat';

// Global state
let currentUser = null;
let currentToken = null;
let chatManager = null;

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
    
    // Initialize chat
    if (!chatManager) {
        chatManager = new ChatManager();
    }
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
    
    // Disconnect chat
    if (chatManager) {
        chatManager.disconnect();
        chatManager = null;
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

// ===== CHAT MANAGER CLASS =====

class ChatManager {
    constructor() {
        this.ws = null;
        this.currentRoomId = null;
        this.currentRoomType = null;
        this.otherUserId = null;
        this.otherUserName = null;
        this.rooms = [];
        this.typingTimeout = null;
        
        this.roomListElement = document.getElementById('room-list');
        this.messagesElement = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-message-btn');
        this.currentRoomNameElement = document.getElementById('current-room-name');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.editAliasBtn = document.getElementById('edit-alias-btn');
        
        this.setupEventListeners();
        this.connectWebSocket();
        this.loadRooms();
    }
    
    setupEventListeners() {
        // Enter key to send message
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.chatInput.disabled) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Edit alias button
        if (this.editAliasBtn) {
            this.editAliasBtn.addEventListener('click', () => {
                if (this.otherUserId && this.otherUserName) {
                    this.editAlias();
                }
            });
        }
        
        // Typing indicator
        this.chatInput.addEventListener('input', () => {
            if (!this.currentRoomId) return;
            
            this.sendTyping(true);
            
            if (this.typingTimeout) {
                clearTimeout(this.typingTimeout);
            }
            
            this.typingTimeout = setTimeout(() => {
                this.sendTyping(false);
            }, 2000);
        });
    }
    
    connectWebSocket() {
        if (!currentToken) return;
        
        this.ws = new WebSocket(`${WS_URL}?token=${currentToken}`);
        
        this.ws.onopen = () => {
            console.log('WebSocket connected');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    async handleWebSocketMessage(data) {
        switch(data.type) {
            case 'connected':
                console.log('Connected to chat');
                break;
                
            case 'room_created':
                console.log('New room created:', data.room);
                // Thêm room mới vào đầu danh sách
                this.rooms.unshift(data.room);
                await this.renderRoomList();
                // Tự động chọn room mới (chỉ nếu user hiện tại là người tạo)
                if (data.creator_id === currentUser.id) {
                    this.selectRoom(data.room.id, data.room.name, data.room.type);
                }
                break;
                
            case 'room_joined':
                console.log('Successfully joined room:', data.room_id);
                // Enable message input after successful join
                if (data.room_id === this.currentRoomId) {
                    this.chatInput.disabled = false;
                    this.sendBtn.disabled = false;
                    this.chatInput.placeholder = 'Nhập tin nhắn...';
                    this.chatInput.focus();
                }
                break;
                
            case 'new_message':
                if (data.message.chat_room_id === this.currentRoomId) {
                    this.renderMessage(data.message);
                }
                break;
                
            case 'typing':
                if (data.user_id !== currentUser.id) {
                    if (data.is_typing) {
                        this.typingIndicator.textContent = `${data.username} đang gõ...`;
                    } else {
                        this.typingIndicator.textContent = '';
                    }
                }
                break;
                
            case 'user_joined':
                console.log(`${data.username} joined the room`);
                break;
                
            case 'error':
                alert('Lỗi: ' + data.message);
                break;
        }
    }
    
    async loadRooms() {
        try {
            const response = await fetch(`${CHAT_API_URL}/rooms`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load rooms');
            
            this.rooms = await response.json();
            this.renderRoomList();
        } catch (error) {
            console.error('Error loading rooms:', error);
            this.roomListElement.innerHTML = '<p style="text-align: center; color: var(--error); padding: 20px;">Lỗi tải phòng chat</p>';
        }
    }
    
    async renderRoomList() {
        if (this.rooms.length === 0) {
            this.roomListElement.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Chưa có phòng chat nào</p>';
            return;
        }
        
        this.roomListElement.innerHTML = '';
        
        // Fetch aliases for direct chats
        for (const room of this.rooms) {
            let displayName = room.name;
            
            if (room.type === 'direct') {
                // Fetch participants to get other user's ID
                try {
                    const response = await fetch(`${CHAT_API_URL}/rooms/${room.id}/participants`, {
                        headers: {
                            'Authorization': `Bearer ${currentToken}`
                        }
                    });
                    
                    if (response.ok) {
                        const participants = await response.json();
                        const otherUser = participants.find(p => p.user_id !== currentUser.id);
                        
                        if (otherUser) {
                            // Fetch alias
                            const aliasResponse = await fetch(`${CHAT_API_URL}/alias/${otherUser.user_id}`, {
                                headers: {
                                    'Authorization': `Bearer ${currentToken}`
                                }
                            });
                            
                            if (aliasResponse.ok) {
                                const aliasData = await aliasResponse.json();
                                displayName = aliasData.alias;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching alias for room:', error);
                }
            }
            
            const roomElement = document.createElement('div');
            roomElement.className = 'room-item';
            if (room.id === this.currentRoomId) {
                roomElement.classList.add('active');
            }
            
            roomElement.innerHTML = `
                <div class="room-item-name">${displayName}</div>
                <div class="room-item-type">${room.type === 'direct' ? 'Trực tiếp' : `Nhóm (${room.participant_count})`}</div>
            `;
            
            roomElement.onclick = () => this.selectRoom(room.id, room.name, room.type);
            
            this.roomListElement.appendChild(roomElement);
        }
    }
    
    async selectRoom(roomId, roomName, roomType) {
        this.currentRoomId = roomId;
        this.currentRoomType = roomType;
        this.typingIndicator.textContent = '';
        
        // Hiển thị button sửa biệt danh cho direct chat
        if (this.editAliasBtn) {
            if (roomType === 'direct') {
                this.editAliasBtn.style.display = 'block';
            } else {
                this.editAliasBtn.style.display = 'none';
                this.otherUserId = null;
                this.otherUserName = null;
            }
        }
        
        // Update active room in list
        this.renderRoomList();
        
        // Disable input while joining
        this.chatInput.disabled = true;
        this.sendBtn.disabled = true;
        this.chatInput.placeholder = 'Đang tham gia phòng chat...';
        
        // Join room via WebSocket
        this.sendWebSocketMessage({
            type: 'join_room',
            room_id: roomId
        });
        
        // Load messages và lấy thông tin user khác nếu là direct chat
        await this.loadMessages(roomId);
        
        // Nếu là direct chat, hiển thị biệt danh thay vì tên phòng
        if (roomType === 'direct' && this.otherUserId && this.otherUserName) {
            this.currentRoomNameElement.textContent = this.otherUserName;
        } else {
            this.currentRoomNameElement.textContent = roomName;
        }
    }
    
    async loadMessages(roomId) {
        try {
            this.messagesElement.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Đang tải tin nhắn...</p>';
            
            const response = await fetch(`${CHAT_API_URL}/rooms/${roomId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load messages');
            
            const messages = await response.json();
            
            this.messagesElement.innerHTML = '';
            
            if (messages.length === 0) {
                this.messagesElement.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Hãy là người đầu tiên gửi tin nhắn!</p>';
            } else {
                // Nếu là direct chat, lấy thông tin user khác và fetch alias
                if (this.currentRoomType === 'direct') {
                    const otherUserMessage = messages.find(msg => msg.sender_id !== currentUser.id);
                    if (otherUserMessage) {
                        this.otherUserId = otherUserMessage.sender_id;
                        
                        // Fetch alias từ API
                        try {
                            const aliasResponse = await fetch(`${CHAT_API_URL}/alias/${otherUserMessage.sender_id}`, {
                                headers: {
                                    'Authorization': `Bearer ${currentToken}`
                                }
                            });
                            
                            if (aliasResponse.ok) {
                                const aliasData = await aliasResponse.json();
                                this.otherUserName = aliasData.alias;
                            } else {
                                this.otherUserName = otherUserMessage.sender_username;
                            }
                        } catch (error) {
                            console.error('Error fetching alias:', error);
                            this.otherUserName = otherUserMessage.sender_username;
                        }
                    }
                }
                
                messages.forEach(msg => this.renderMessage(msg, false));
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            this.messagesElement.innerHTML = '<p style="text-align: center; color: var(--error); padding: 20px;">Lỗi tải tin nhắn</p>';
        }
    }
    
    renderMessage(message, autoScroll = true) {
        const isOwn = message.sender_id === currentUser.id;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message-item ${isOwn ? 'own' : 'other'}`;
        
        const time = new Date(message.sent_at).toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Sử dụng alias nếu là direct chat và người gửi là người khác
        let senderName = message.sender_username;
        if (!isOwn && this.currentRoomType === 'direct' && this.otherUserName) {
            senderName = this.otherUserName;
        }
        
        messageElement.innerHTML = `
            <div class="message-bubble">
                ${!isOwn ? `<div class="message-sender">${senderName}</div>` : ''}
                <div>${message.content}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        this.messagesElement.appendChild(messageElement);
        
        if (autoScroll) {
            this.scrollToBottom();
        }
    }
    
    sendMessage() {
        const content = this.chatInput.value.trim();
        
        if (!content || !this.currentRoomId) return;
        
        this.sendWebSocketMessage({
            type: 'send_message',
            room_id: this.currentRoomId,
            content: content,
            message_type: 'text'
        });
        
        this.chatInput.value = '';
        this.sendTyping(false);
    }
    
    sendTyping(isTyping) {
        if (!this.currentRoomId) return;
        
        this.sendWebSocketMessage({
            type: 'typing',
            room_id: this.currentRoomId,
            is_typing: isTyping
        });
    }
    
    sendWebSocketMessage(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    scrollToBottom() {
        this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
    }
    
    async editAlias() {
        if (!this.otherUserId || !this.otherUserName) {
            alert('Không tìm thấy thông tin người dùng');
            return;
        }
        
        const newAlias = prompt(`Sửa biệt danh cho ${this.otherUserName}:`, this.otherUserName);
        if (!newAlias || !newAlias.trim()) return;
        
        try {
            const response = await fetch(`${CHAT_API_URL}/alias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    user_set: currentUser.id,
                    user_get: this.otherUserId,
                    alias_name: newAlias.trim()
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to set alias');
            }
            
            // Cập nhật biến danh hiện tại
            this.otherUserName = newAlias.trim();
            
            // Cập nhật header
            this.currentRoomNameElement.textContent = newAlias.trim();
            
            // Reload room list để cập nhật tên phòng
            await this.renderRoomList();
            
            // Reload messages để hiển thị alias mới
            await this.loadMessages(this.currentRoomId);
            
        } catch (error) {
            console.error('Error setting alias:', error);
            alert('Lỗi cập nhật biệt danh: ' + error.message);
        }
    }
    
    async loadAllUsers() {
        try {
            const response = await fetch(`${CHAT_API_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load users');
            
            return await response.json();
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }
    
    async showCreateDirectChatDialog() {
        const users = await this.loadAllUsers();
        
        if (users.length === 0) {
            alert('Không có người dùng nào khác để chat');
            return;
        }
        
        // Tạo dialog chọn user
        let userList = 'Chọn người để chat:\n\n';
        users.forEach((user, index) => {
            userList += `${index + 1}. ${user.username}\n`;
        });
        
        const choice = prompt(userList + '\nNhập số thứ tự:');
        if (!choice) return;
        
        const index = parseInt(choice) - 1;
        if (index < 0 || index >= users.length) {
            alert('Lựa chọn không hợp lệ');
            return;
        }
        
        const selectedUser = users[index];
        
        // Kiểm tra xem đã có direct chat chưa
        const existingRoom = this.rooms.find(room => 
            room.type === 'direct' && 
            (room.name.includes(selectedUser.username) || room.name.includes(currentUser.username))
        );
        
        if (existingRoom) {
            this.selectRoom(existingRoom.id, existingRoom.name);
            return;
        }
        
        // Tạo direct chat mới
        await this.createDirectRoom(selectedUser);
    }
    
    async showCreateGroupChatDialog() {
        const roomName = prompt('Nhập tên nhóm chat:');
        if (!roomName || !roomName.trim()) return;
        
        // Lấy danh sách users
        const users = await this.loadAllUsers();
        if (users.length === 0) {
            alert('Không có người dùng nào để thêm vào nhóm');
            return;
        }
        
        // Tạo dialog chọn nhiều users
        let userList = 'Chọn thành viên cho nhóm (nhập số cách nhau bằng dấu phẩy, ví dụ: 1,2,3):\n\n';
        users.forEach((user, index) => {
            userList += `${index + 1}. ${user.username}\n`;
        });
        
        const choice = prompt(userList + '\nNhập số thứ tự (hoặc bỏ qua để tạo nhóm trống):');
        
        let selectedUserIds = [currentUser.id]; // Admin luôn là thành viên
        
        if (choice && choice.trim()) {
            const indices = choice.split(',').map(s => parseInt(s.trim()) - 1);
            
            for (const index of indices) {
                if (index >= 0 && index < users.length) {
                    const userId = users[index].id;
                    if (!selectedUserIds.includes(userId)) {
                        selectedUserIds.push(userId);
                    }
                }
            }
        }
        
        await this.createGroupRoom(roomName.trim(), selectedUserIds);
    }
    
    async createDirectRoom(targetUser) {
        try {
            const roomName = `${currentUser.username} & ${targetUser.username}`;
            
            const response = await fetch(`${CHAT_API_URL}/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    name: roomName,
                    type: 'direct',
                    admin_id: currentUser.id,
                    participant_ids: [currentUser.id, targetUser.id]
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create direct chat');
            }
            
            // Room sẽ được thêm vào list qua WebSocket event 'room_created'
            // Không cần gọi loadRooms() nữa
        } catch (error) {
            console.error('Error creating direct chat:', error);
            alert('Lỗi tạo chat: ' + error.message);
        }
    }
    
    async createGroupRoom(roomName, participantIds) {
        try {
            const response = await fetch(`${CHAT_API_URL}/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    name: roomName,
                    type: 'group',
                    admin_id: currentUser.id,
                    participant_ids: participantIds
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create group');
            }
            
            // Room sẽ được thêm vào list qua WebSocket event 'room_created'
            // Không cần gọi loadRooms() nữa
        } catch (error) {
            console.error('Error creating group room:', error);
            alert('Lỗi tạo nhóm chat: ' + error.message);
        }
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}