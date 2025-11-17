class ChatService extends ApiService {
    constructor() {
        super('http://localhost:8000/api/chat');
    }

    async getRooms() {
        const data = await this.get('rooms');
        const rooms = data.map(r => ChatRoom.fromApiResponse(r));
        appState.setRooms(rooms);
        return rooms;
    }

    async createRoom(name, type, participantIds) {
        const currentUser = appState.getCurrentUser();
        const data = await this.post('rooms', {
            name,
            type,
            admin_id: currentUser.id,
            participant_ids: participantIds
        });
        
        return ChatRoom.fromApiResponse(data);
    }

    async getRoomParticipants(roomId) {
        const data = await this.get(`rooms/${roomId}/participants`);
        return data;
    }

    async getRoomMessages(roomId) {
        const data = await this.get(`rooms/${roomId}/messages`);
        const messages = data.map(m => Message.fromApiResponse(m));
        appState.setMessages(messages);
        return messages;
    }

    async getUsers() {
        const data = await this.get('users');
        return data.map(u => User.fromApiResponse(u));
    }

    async getAlias(userId) {
        try {
            const data = await this.get(`alias/${userId}`);
            return data.alias;
        } catch (error) {
            return null;
        }
    }

    async setAlias(targetUserId, aliasName) {
        const currentUser = appState.getCurrentUser();
        const data = await this.post('alias', {
            user_set: currentUser.id,
            user_get: targetUserId,
            alias_name: aliasName
        });
        return data;
    }

    async loadRoomWithAlias(room) {
        if (!room.isDirect()) {
            return room;
        }

        try {
            const participants = await this.getRoomParticipants(room.id);
            room.setParticipants(participants);

            const currentUser = appState.getCurrentUser();
            const otherUser = room.getOtherUser(currentUser.id);

            if (otherUser) {
                const alias = await this.getAlias(otherUser.user_id);
                if (alias) {
                    room.setDisplayName(alias);
                }
            }
        } catch (error) {
            console.error('Error loading room alias:', error);
        }

        return room;
    }

    async loadRoomsWithAliases() {
        const rooms = await this.getRooms();
        const roomsWithAliases = await Promise.all(
            rooms.map(room => this.loadRoomWithAlias(room))
        );
        appState.setRooms(roomsWithAliases);
        return roomsWithAliases;
    }
}
