class ModalView {
    constructor() {
        this.modal = this.getElementById('user-select-modal');
        this.modalTitle = this.getElementById('modal-title');
        this.userList = this.getElementById('user-list');
        this.searchInput = this.getElementById('user-search');
        this.footer = this.getElementById('modal-footer');
        this.groupNameInput = this.getElementById('group-name-input');

        this.mode = null; // 'direct' or 'group'
        this.selectedUserIds = [];
        this.allUsers = [];

        this.setupEventListeners();
    }

    getElementById(id) {
        return document.getElementById(id);
    }

    setupEventListeners() {
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filtered = this.allUsers.filter(user =>
                    user.username.toLowerCase().includes(searchTerm)
                );
                this.renderUserList(filtered);
            });
        }
    }

    openForDirectChat(users) {
        this.mode = 'direct';
        this.allUsers = users;
        this.selectedUserIds = [];

        if (this.modalTitle) {
            this.modalTitle.textContent = '💬 Chọn người để chat';
        }
        if (this.footer) {
            this.footer.style.display = 'none';
        }

        this.renderUserList(users);
        this.show();
    }

    openForGroupChat(users) {
        this.mode = 'group';
        this.allUsers = users;
        this.selectedUserIds = [];

        if (this.modalTitle) {
            this.modalTitle.textContent = '👥 Tạo nhóm chat';
        }
        if (this.footer) {
            this.footer.style.display = 'flex';
        }
        if (this.groupNameInput) {
            this.groupNameInput.value = '';
        }

        this.renderUserList(users);
        this.show();
    }

    show() {
        if (this.modal) {
            this.modal.style.display = 'flex';
        }
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchInput.focus();
        }
    }

    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        this.mode = null;
        this.selectedUserIds = [];
        this.allUsers = [];
    }

    renderUserList(users) {
        if (!this.userList) return;

        this.userList.innerHTML = '';

        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.dataset.userId = user.id;

            const avatar = document.createElement('div');
            avatar.className = 'user-avatar';
            avatar.textContent = user.getAvatarInitial();

            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';

            const userName = document.createElement('div');
            userName.className = 'user-name';
            userName.textContent = user.username;

            userInfo.appendChild(userName);
            userItem.appendChild(avatar);
            userItem.appendChild(userInfo);

            if (this.mode === 'group') {
                const checkbox = document.createElement('div');
                checkbox.className = 'user-checkbox';
                userItem.appendChild(checkbox);

                if (this.selectedUserIds.includes(user.id)) {
                    userItem.classList.add('selected');
                }
            }

            userItem.addEventListener('click', () => this.handleUserClick(user));
            this.userList.appendChild(userItem);
        });
    }

    handleUserClick(user) {
        if (this.mode === 'direct') {
            this.onUserSelect && this.onUserSelect(user);
        } else if (this.mode === 'group') {
            this.toggleUserSelection(user);
        }
    }

    toggleUserSelection(user) {
        const userItem = this.userList.querySelector(`[data-user-id="${user.id}"]`);

        if (this.selectedUserIds.includes(user.id)) {
            this.selectedUserIds = this.selectedUserIds.filter(id => id !== user.id);
            userItem?.classList.remove('selected');
        } else {
            this.selectedUserIds.push(user.id);
            userItem?.classList.add('selected');
        }
    }

    getGroupName() {
        return this.groupNameInput?.value.trim() || '';
    }

    getSelectedUserIds() {
        return [...this.selectedUserIds];
    }

    validateGroupCreation() {
        const groupName = this.getGroupName();

        if (!groupName) {
            alert('Vui lòng nhập tên nhóm');
            this.groupNameInput?.focus();
            return false;
        }

        if (this.selectedUserIds.length === 0) {
            alert('Vui lòng chọn ít nhất 1 thành viên');
            return false;
        }

        return true;
    }

    setOnUserSelect(callback) {
        this.onUserSelect = callback;
    }

    setOnCreateGroup(callback) {
        this.onCreateGroup = callback;
    }
}
