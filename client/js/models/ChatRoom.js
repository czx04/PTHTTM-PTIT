class ChatRoom {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.type = data.type || 'direct'; // 'direct' or 'group'
        this.adminId = data.admin_id || null;
        this.participantCount = data.participant_count || 0;
        this.createdAt = data.created_at ? new Date(data.created_at) : null;
        this.displayName = data.displayName || data.name;
        this.participants = [];
    }

    isDirect() {
        return this.type === 'direct';
    }

    isGroup() {
        return this.type === 'group';
    }

    getTypeDisplay() {
        return this.isDirect() ? 'Trực tiếp' : `Nhóm (${this.participantCount})`;
    }

    setDisplayName(name) {
        this.displayName = name;
    }

    getDisplayName() {
        return this.displayName || this.name;
    }

    setParticipants(participants) {
        this.participants = participants;
    }

    getOtherUser(currentUserId) {
        if (!this.isDirect()) return null;
        return this.participants.find(p => p.user_id !== currentUserId);
    }

    static fromApiResponse(data) {
        return new ChatRoom(data);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            admin_id: this.adminId,
            participant_count: this.participantCount,
            created_at: this.createdAt,
            displayName: this.displayName
        };
    }
}
