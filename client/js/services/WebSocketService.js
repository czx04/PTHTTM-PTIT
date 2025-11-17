class WebSocketService {
    constructor() {
        if (WebSocketService.instance) {
            return WebSocketService.instance;
        }

        this.ws = null;
        this.url = 'ws://localhost:8000/ws/chat';
        this.listeners = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;

        WebSocketService.instance = this;
    }

    connect() {
        const token = appState.getToken();
        if (!token) {
            console.error('Cannot connect WebSocket: No auth token');
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        this.ws = new WebSocket(`${this.url}?token=${token}`);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.emit('connected');
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.emit('disconnected');
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.emit('error', error);
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            if (appState.isAuthenticated()) {
                this.connect();
            }
        }, this.reconnectDelay);
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('WebSocket not connected');
        }
    }

    joinRoom(roomId) {
        this.send({
            type: 'join_room',
            room_id: roomId
        });
    }

    sendMessage(roomId, content, messageType = 'text') {
        this.send({
            type: 'send_message',
            room_id: roomId,
            content: content,
            message_type: messageType
        });
    }

    sendTyping(roomId, isTyping) {
        this.send({
            type: 'typing',
            room_id: roomId,
            is_typing: isTyping
        });
    }

    handleMessage(data) {
        switch (data.type) {
            case 'connected':
                console.log('Connected to chat server');
                break;

            case 'room_created':
                this.emit('roomCreated', data);
                break;

            case 'room_found':
                this.emit('roomFound', data);
                break;

            case 'room_joined':
                this.emit('roomJoined', data);
                break;

            case 'new_message':
                this.emit('newMessage', data);
                break;

            case 'typing':
                this.emit('typing', data);
                break;

            case 'user_joined':
                this.emit('userJoined', data);
                break;

            case 'error':
                this.emit('error', data);
                break;

            default:
                console.log('Unknown message type:', data.type);
        }
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);

        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

const webSocketService = new WebSocketService();
