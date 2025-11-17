class Message {
    constructor(data = {}) {
        this.id = data.id || null;
        this.chatRoomId = data.chat_room_id || null;
        this.senderId = data.sender_id || null;
        this.senderUsername = data.sender_username || '';
        this.content = data.content || '';
        this.messageType = data.message_type || 'text';
        this.sentAt = data.sent_at ? new Date(data.sent_at) : new Date();
    }

    isOwn(currentUserId) {
        return this.senderId === currentUserId;
    }

    getFormattedTime() {
        return this.sentAt.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getSenderDisplayName(aliasName = null) {
        return aliasName || this.senderUsername;
    }

    static fromApiResponse(data) {
        return new Message(data);
    }

    static fromWebSocket(data) {
        return new Message(data.message || data);
    }

    toJSON() {
        return {
            id: this.id,
            chat_room_id: this.chatRoomId,
            sender_id: this.senderId,
            sender_username: this.senderUsername,
            content: this.content,
            message_type: this.messageType,
            sent_at: this.sentAt
        };
    }
}
