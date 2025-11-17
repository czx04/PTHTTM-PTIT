class ChatController {
    constructor(chatView, modalView, chatService, wsService) {
        this.chatView = chatView;
        this.modalView = modalView;
        this.chatService = chatService;
        this.wsService = wsService;

        this.currentOtherUserId = null;
        this.currentOtherUserName = null;

        this.setupViewCallbacks();
        this.setupWebSocketHandlers();
        this.setupStateSubscriptions();
    }

    setupViewCallbacks() {
        this.chatView.setOnRoomSelect((room) => this.selectRoom(room));
        this.chatView.setOnSendMessage(() => this.sendMessage());
        this.chatView.setOnTypingStart(() => this.handleTypingStart());
        this.chatView.setOnTypingStop(() => this.handleTypingStop());
        this.chatView.setOnEditAlias(() => this.editAlias());

        this.modalView.setOnUserSelect((user) => this.handleUserSelect(user));
        this.modalView.setOnCreateGroup(() => this.createGroup());
    }

    setupWebSocketHandlers() {
        this.wsService.on('roomCreated', (data) => this.handleRoomCreated(data));
        this.wsService.on('roomFound', (data) => this.handleRoomFound(data));
        this.wsService.on('roomJoined', (data) => this.handleRoomJoined(data));
        this.wsService.on('newMessage', (data) => this.handleNewMessage(data));
        this.wsService.on('typing', (data) => this.handleTyping(data));
        this.wsService.on('error', (data) => this.handleError(data));
    }

    setupStateSubscriptions() {
        appState.subscribe('roomsChanged', (rooms) => {
            const currentRoom = appState.getCurrentRoom();
            this.chatView.renderRoomList(rooms, currentRoom?.id);
        });

        appState.subscribe('messagesChanged', (messages) => {
            const currentUser = appState.getCurrentUser();
            const currentRoom = appState.getCurrentRoom();
            const aliasName = currentRoom?.isDirect() ? this.currentOtherUserName : null;
            this.chatView.renderMessages(messages, currentUser.id, aliasName);
        });

        appState.subscribe('roomChanged', (room) => {
            if (room) {
                this.chatView.updateCurrentRoomName(room.getDisplayName());
                this.chatView.showEditAliasBtn(room.isDirect());
            }
        });
    }

    async initialize() {
        this.wsService.connect();

        try {
            await this.chatService.loadRoomsWithAliases();
        } catch (error) {
            console.error('Error loading rooms:', error);
        }
    }

    disconnect() {
        this.wsService.disconnect();
        appState.clearMessages();
        this.currentOtherUserId = null;
        this.currentOtherUserName = null;
    }

    async selectRoom(room) {
        appState.setCurrentRoom(room);
        this.chatView.hideTypingIndicator();

        this.currentOtherUserId = null;
        this.currentOtherUserName = null;

        if (room.isDirect()) {
            await this.loadOtherUserInfo(room);
        }

        this.chatView.setInputEnabled(false);

        this.wsService.joinRoom(room.id);

        await this.loadMessages(room.id);
    }

    async loadOtherUserInfo(room) {
        try {
            const participants = await this.chatService.getRoomParticipants(room.id);
            room.setParticipants(participants);

            const currentUser = appState.getCurrentUser();
            const otherUser = room.getOtherUser(currentUser.id);

            if (otherUser) {
                this.currentOtherUserId = otherUser.user_id;

                const alias = await this.chatService.getAlias(otherUser.user_id);
                this.currentOtherUserName = alias || otherUser.username || 'Unknown';

                room.setDisplayName(this.currentOtherUserName);
                appState.setCurrentRoom(room); // Trigger update
            }
        } catch (error) {
            console.error('Error loading other user info:', error);
        }
    }

    async loadMessages(roomId) {
        try {
            this.chatView.showLoadingMessages();
            await this.chatService.getRoomMessages(roomId);
        } catch (error) {
            console.error('Error loading messages:', error);
            this.chatView.showErrorMessages('Lỗi tải tin nhắn');
        }
    }

    sendMessage() {
        const content = this.chatView.getChatInput();
        const currentRoom = appState.getCurrentRoom();

        if (!content || !currentRoom) return;

        this.wsService.sendMessage(currentRoom.id, content);
        this.chatView.clearChatInput();
        this.handleTypingStop();
    }

    handleTypingStart() {
        const currentRoom = appState.getCurrentRoom();
        if (currentRoom) {
            this.wsService.sendTyping(currentRoom.id, true);
        }
    }

    handleTypingStop() {
        const currentRoom = appState.getCurrentRoom();
        if (currentRoom) {
            this.wsService.sendTyping(currentRoom.id, false);
        }
    }

    async editAlias() {
        if (!this.currentOtherUserId || !this.currentOtherUserName) {
            alert('Không tìm thấy thông tin người dùng');
            return;
        }

        const newAlias = prompt(`Sửa biệt danh cho ${this.currentOtherUserName}:`, this.currentOtherUserName);
        if (!newAlias || !newAlias.trim()) return;

        try {
            await this.chatService.setAlias(this.currentOtherUserId, newAlias.trim());

            this.currentOtherUserName = newAlias.trim();
            const currentRoom = appState.getCurrentRoom();
            if (currentRoom) {
                currentRoom.setDisplayName(newAlias.trim());
                appState.setCurrentRoom(currentRoom);
            }

            await this.chatService.loadRoomsWithAliases();
            const messages = appState.getMessages();
            const currentUser = appState.getCurrentUser();
            this.chatView.renderMessages(messages, currentUser.id, newAlias.trim());
        } catch (error) {
            console.error('Error setting alias:', error);
            alert('Lỗi cập nhật biệt danh: ' + error.message);
        }
    }

    async showCreateDirectChat() {
        const users = await this.chatService.getUsers();
        if (users.length === 0) {
            alert('Không có người dùng nào khác để chat');
            return;
        }
        this.modalView.openForDirectChat(users);
    }

    async showCreateGroupChat() {
        const users = await this.chatService.getUsers();
        if (users.length === 0) {
            alert('Không có người dùng nào để thêm vào nhóm');
            return;
        }
        this.modalView.openForGroupChat(users);
    }

    async handleUserSelect(user) {
        this.modalView.close();
        await this.createDirectRoom(user);
    }

    async createGroup() {
        if (!this.modalView.validateGroupCreation()) {
            return;
        }

        const groupName = this.modalView.getGroupName();
        const selectedUserIds = this.modalView.getSelectedUserIds();
        const currentUser = appState.getCurrentUser();
        const participantIds = [currentUser.id, ...selectedUserIds];

        this.modalView.close();
        await this.createGroupRoom(groupName, participantIds);
    }

    async createDirectRoom(targetUser) {
        try {
            const currentUser = appState.getCurrentUser();
            const roomName = `${currentUser.username} & ${targetUser.username}`;

            await this.chatService.createRoom(roomName, 'direct', [currentUser.id, targetUser.id]);
        } catch (error) {
            console.error('Error creating direct chat:', error);
            alert('Lỗi tạo chat: ' + error.message);
        }
    }

    async createGroupRoom(roomName, participantIds) {
        try {
            await this.chatService.createRoom(roomName, 'group', participantIds);
        } catch (error) {
            console.error('Error creating group room:', error);
            alert('Lỗi tạo nhóm chat: ' + error.message);
        }
    }

    handleRoomCreated(data) {
        console.log('Room created:', data.room);
        const room = ChatRoom.fromApiResponse(data.room);
        appState.addRoom(room);

        const currentUser = appState.getCurrentUser();
        if (data.creator_id === currentUser.id) {
            this.selectRoom(room);
        }
    }

    handleRoomFound(data) {
        console.log('Room found:', data.room);
        const room = ChatRoom.fromApiResponse(data.room);
        appState.addRoom(room);

        this.selectRoom(room);
    }

    handleRoomJoined(data) {
        console.log('Room joined:', data.room_id);
        const currentRoom = appState.getCurrentRoom();
        
        if (data.room_id === currentRoom?.id) {
            this.chatView.setInputEnabled(true);
        }
    }

    handleNewMessage(data) {
        const message = Message.fromWebSocket(data);
        const currentRoom = appState.getCurrentRoom();

        if (message.chatRoomId === currentRoom?.id) {
            const currentUser = appState.getCurrentUser();
            const aliasName = currentRoom.isDirect() ? this.currentOtherUserName : null;
            this.chatView.renderMessage(message, currentUser.id, aliasName, true);
            appState.addMessage(message);
        }
    }

    handleTyping(data) {
        const currentUser = appState.getCurrentUser();
        if (data.user_id !== currentUser.id) {
            if (data.is_typing) {
                const displayName = this.currentOtherUserName || data.username;
                this.chatView.showTypingIndicator(displayName);
            } else {
                this.chatView.hideTypingIndicator();
            }
        }
    }

    handleError(data) {
        alert('Lỗi: ' + data.message);
    }
}
