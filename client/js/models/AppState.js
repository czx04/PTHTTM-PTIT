class AppState {
    constructor() {
        this.currentUser = null;
        this.currentToken = null;
        this.currentRoomId = null;
        this.currentRoom = null;
        this.rooms = [];
        this.messages = [];
        this.listeners = {};
    }

    setCurrentUser(user) {
        this.currentUser = user instanceof User ? user : new User(user);
        this.notify('userChanged', this.currentUser);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    setToken(token) {
        this.currentToken = token;
        this.notify('tokenChanged', token);
    }

    getToken() {
        return this.currentToken;
    }

    isAuthenticated() {
        return this.currentToken !== null && this.currentUser !== null;
    }

    setCurrentRoom(room) {
        this.currentRoom = room instanceof ChatRoom ? room : new ChatRoom(room);
        this.currentRoomId = room?.id || null;
        this.notify('roomChanged', this.currentRoom);
    }

    getCurrentRoom() {
        return this.currentRoom;
    }

    setRooms(rooms) {
        this.rooms = rooms.map(r => r instanceof ChatRoom ? r : new ChatRoom(r));
        this.notify('roomsChanged', this.rooms);
    }

    addRoom(room) {
        const roomInstance = room instanceof ChatRoom ? room : new ChatRoom(room);
        const existingIndex = this.rooms.findIndex(r => r.id === roomInstance.id);
        
        if (existingIndex === -1) {
            this.rooms.unshift(roomInstance);
            this.notify('roomAdded', roomInstance);
            this.notify('roomsChanged', this.rooms);
        }
    }

    getRooms() {
        return this.rooms;
    }

    findRoomById(roomId) {
        return this.rooms.find(r => r.id === roomId);
    }

    setMessages(messages) {
        this.messages = messages.map(m => m instanceof Message ? m : new Message(m));
        this.notify('messagesChanged', this.messages);
    }

    addMessage(message) {
        const messageInstance = message instanceof Message ? message : new Message(message);
        this.messages.push(messageInstance);
        this.notify('messageAdded', messageInstance);
        this.notify('messagesChanged', this.messages);
    }

    getMessages() {
        return this.messages;
    }

    clearMessages() {
        this.messages = [];
        this.notify('messagesChanged', this.messages);
    }

    clear() {
        this.currentUser = null;
        this.currentToken = null;
        this.currentRoomId = null;
        this.currentRoom = null;
        this.rooms = [];
        this.messages = [];
        this.notify('stateCleared');
    }

    saveToSession() {
        if (this.currentToken && this.currentUser) {
            sessionStorage.setItem('authToken', this.currentToken);
            sessionStorage.setItem('userData', JSON.stringify(this.currentUser.toJSON()));
        }
    }

    loadFromSession() {
        const token = sessionStorage.getItem('authToken');
        const userData = sessionStorage.getItem('userData');

        if (token && userData) {
            this.currentToken = token;
            this.currentUser = new User(JSON.parse(userData));
            return true;
        }
        return false;
    }

    clearSession() {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userData');
    }

    subscribe(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);

        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    notify(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

const appState = new AppState();
