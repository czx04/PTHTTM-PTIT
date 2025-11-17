class ChatView {
    constructor() {
        this.roomList = this.getElementById('room-list');
        this.messages = this.getElementById('chat-messages');
        this.chatInput = this.getElementById('chat-input');
        this.sendBtn = this.getElementById('send-message-btn');
        this.currentRoomName = this.getElementById('current-room-name');
        this.typingIndicator = this.getElementById('typing-indicator');
        this.editAliasBtn = this.getElementById('edit-alias-btn');

        this.typingTimeout = null;
        this.setupEventListeners();
    }

    getElementById(id) {
        return document.getElementById(id);
    }

    setupEventListeners() {
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.chatInput.disabled) {
                    e.preventDefault();
                    this.onSendMessage && this.onSendMessage();
                }
            });

            this.chatInput.addEventListener('input', () => {
                if (this.onTypingStart) {
                    this.onTypingStart();
                }

                if (this.typingTimeout) {
                    clearTimeout(this.typingTimeout);
                }

                this.typingTimeout = setTimeout(() => {
                    if (this.onTypingStop) {
                        this.onTypingStop();
                    }
                }, 2000);
            });
        }

        if (this.editAliasBtn) {
            this.editAliasBtn.addEventListener('click', () => {
                this.onEditAlias && this.onEditAlias();
            });
        }

        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => {
                this.onSendMessage && this.onSendMessage();
            });
        }
    }

    renderRoomList(rooms, currentRoomId = null) {
        if (!this.roomList) return;

        if (rooms.length === 0) {
            this.roomList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Chưa có phòng chat nào</p>';
            return;
        }

        this.roomList.innerHTML = '';

        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'room-item';
            if (room.id === currentRoomId) {
                roomElement.classList.add('active');
            }

            roomElement.innerHTML = `
                <div class="room-item-name">${room.getDisplayName()}</div>
                <div class="room-item-type">${room.getTypeDisplay()}</div>
            `;

            roomElement.onclick = () => {
                this.onRoomSelect && this.onRoomSelect(room);
            };

            this.roomList.appendChild(roomElement);
        });
    }

    renderMessages(messages, currentUserId, aliasName = null) {
        if (!this.messages) return;

        this.messages.innerHTML = '';

        if (messages.length === 0) {
            this.messages.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Hãy là người đầu tiên gửi tin nhắn!</p>';
            return;
        }

        messages.forEach(message => {
            this.renderMessage(message, currentUserId, aliasName, false);
        });

        this.scrollToBottom();
    }

    renderMessage(message, currentUserId, aliasName = null, autoScroll = true) {
        if (!this.messages) return;

        const isOwn = message.isOwn(currentUserId);

        const messageElement = document.createElement('div');
        messageElement.className = `message-item ${isOwn ? 'own' : 'other'}`;

        const senderName = isOwn ? '' : message.getSenderDisplayName(aliasName);

        messageElement.innerHTML = `
            <div class="message-bubble">
                ${!isOwn ? `<div class="message-sender">${senderName}</div>` : ''}
                <div>${message.content}</div>
                <div class="message-time">${message.getFormattedTime()}</div>
            </div>
        `;

        this.messages.appendChild(messageElement);

        if (autoScroll) {
            this.scrollToBottom();
        }
    }

    scrollToBottom() {
        if (this.messages) {
            this.messages.scrollTop = this.messages.scrollHeight;
        }
    }

    updateCurrentRoomName(name) {
        if (this.currentRoomName) {
            this.currentRoomName.textContent = name;
        }
    }

    showEditAliasBtn(show) {
        if (this.editAliasBtn) {
            this.editAliasBtn.style.display = show ? 'block' : 'none';
        }
    }

    setInputEnabled(enabled) {
        if (this.chatInput) {
            this.chatInput.disabled = !enabled;
            this.chatInput.placeholder = enabled ? 'Nhập tin nhắn...' : 'Đang tham gia phòng chat...';
        }
        if (this.sendBtn) {
            this.sendBtn.disabled = !enabled;
        }
        if (enabled && this.chatInput) {
            this.chatInput.focus();
        }
    }

    getChatInput() {
        return this.chatInput?.value.trim() || '';
    }

    clearChatInput() {
        if (this.chatInput) {
            this.chatInput.value = '';
        }
    }

    showTypingIndicator(username) {
        if (this.typingIndicator) {
            this.typingIndicator.textContent = `${username} đang gõ...`;
        }
    }

    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.textContent = '';
        }
    }

    showLoadingMessages() {
        if (this.messages) {
            this.messages.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Đang tải tin nhắn...</p>';
        }
    }

    showErrorMessages(message) {
        if (this.messages) {
            this.messages.innerHTML = `<p style="text-align: center; color: var(--error); padding: 20px;">${message}</p>`;
        }
    }

    setOnRoomSelect(callback) {
        this.onRoomSelect = callback;
    }

    setOnSendMessage(callback) {
        this.onSendMessage = callback;
    }

    setOnTypingStart(callback) {
        this.onTypingStart = callback;
    }

    setOnTypingStop(callback) {
        this.onTypingStop = callback;
    }

    setOnEditAlias(callback) {
        this.onEditAlias = callback;
    }
}
