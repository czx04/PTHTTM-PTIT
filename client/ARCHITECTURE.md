# Kiến trúc OOP - Client Refactoring

## Tổng quan

Client code đã được refactor hoàn toàn từ kiến trúc procedural sang OOP architecture theo mô hình MVC/MVVM với separation of concerns rõ ràng.

## Cấu trúc thư mục

```
client/js/
├── models/           # Data models và business logic
│   ├── User.js
│   ├── ChatRoom.js
│   ├── Message.js
│   └── AppState.js  # Centralized state management (Singleton)
│
├── services/         # API và WebSocket communication
│   ├── ApiService.js
│   ├── AuthService.js
│   ├── ChatService.js
│   └── WebSocketService.js (Singleton)
│
├── views/            # UI rendering và DOM manipulation
│   ├── BaseView.js
│   ├── AuthView.js
│   ├── DashboardView.js
│   ├── ChatView.js
│   └── ModalView.js
│
├── controllers/      # Application logic và coordination
│   ├── AuthController.js
│   ├── ChatController.js
│   └── AppController.js (Main controller)
│
└── index.js         # Application entry point
```

## Design Patterns được sử dụng

### 1. **Singleton Pattern**

- **AppState**: Quản lý state toàn cục của ứng dụng
- **WebSocketService**: Một kết nối WebSocket duy nhất

### 2. **Observer Pattern**

- **AppState**: Hỗ trợ subscribe/notify cho state changes
- Views tự động update khi state thay đổi

### 3. **MVC/MVVM Pattern**

- **Models**: Chứa data và business logic
- **Views**: Render UI và handle user interactions
- **Controllers**: Điều phối giữa Models và Views

### 4. **Inheritance**

- **BaseView**: Abstract base class cho tất cả views
- **ApiService**: Base class cho các API services

## Chi tiết các layers

### Models Layer

#### User.js

```javascript
class User {
    - id, username, phone, createdAt
    + isValid()
    + getDisplayName()
    + getAvatarInitial()
    + static fromApiResponse(data)
}
```

#### ChatRoom.js

```javascript
class ChatRoom {
    - id, name, type, participants, displayName
    + isDirect(), isGroup()
    + getDisplayName(), setDisplayName()
    + getOtherUser(currentUserId)
}
```

#### Message.js

```javascript
class Message {
    - id, content, senderId, sentAt
    + isOwn(currentUserId)
    + getFormattedTime()
    + getSenderDisplayName()
}
```

#### AppState.js (Singleton)

```javascript
class AppState {
    - currentUser, currentToken
    - currentRoom, rooms, messages
    + subscribe(event, callback)
    + notify(event, data)
    + saveToSession(), loadFromSession()
}
```

### Services Layer

#### ApiService.js (Base Class)

```javascript
class ApiService {
    + request(endpoint, options)
    + get(), post(), put(), delete()
}
```

#### AuthService.js

```javascript
class AuthService extends ApiService {
    + login(username, password)
    + register(username, password, phone)
    + logout()
    + verifySession()
}
```

#### ChatService.js

```javascript
class ChatService extends ApiService {
    + getRooms(), createRoom()
    + getRoomMessages()
    + getUsers(), getAlias(), setAlias()
    + loadRoomsWithAliases()
}
```

#### WebSocketService.js (Singleton)

```javascript
class WebSocketService {
    + connect(), disconnect()
    + joinRoom(), sendMessage(), sendTyping()
    + on(event, callback)
    - handleMessage(data)
}
```

### Views Layer

#### BaseView.js

```javascript
class BaseView {
    + show(), hide()
    + showAlert(message, type)
}
```

#### AuthView.js

```javascript
class AuthView extends BaseView {
    + toggleForm()
    + getLoginCredentials(), getRegisterData()
    + validateLogin(), validateRegister()
    + setOnLogin(), setOnRegister()
}
```

#### ChatView.js

```javascript
class ChatView {
    + renderRoomList(rooms)
    + renderMessages(messages)
    + updateCurrentRoomName()
    + setInputEnabled()
    + showTypingIndicator()
}
```

#### ModalView.js

```javascript
class ModalView {
    + openForDirectChat(users)
    + openForGroupChat(users)
    + renderUserList()
    + validateGroupCreation()
}
```

### Controllers Layer

#### AuthController.js

```javascript
class AuthController {
    - authView, authService
    + handleLogin(), handleRegister()
    + handleLogout()
    + verifySession()
}
```

#### ChatController.js

```javascript
class ChatController {
    - chatView, modalView, chatService, wsService
    + initialize(), disconnect()
    + selectRoom(room)
    + sendMessage()
    + showCreateDirectChat(), showCreateGroupChat()
}
```

#### AppController.js (Main)

```javascript
class AppController {
    - All controllers, views, services
    + initialize()
    + showDashboard(), showAuthPage()
}
```

## Flow hoạt động

### 1. Application Startup

```
index.js
  → new AppController()
  → initialize()
    → verifySession()
      → showDashboard() hoặc showAuthPage()
```

### 2. Login Flow

```
User clicks Login
  → AuthView validates input
  → AuthController.handleLogin()
  → AuthService.login()
  → AppState saves user & token
  → AppController.showDashboard()
  → ChatController.initialize()
  → WebSocketService.connect()
```

### 3. Send Message Flow

```
User types and sends
  → ChatView captures input
  → ChatController.sendMessage()
  → WebSocketService.sendMessage()
  → Server broadcasts
  → WebSocketService receives
  → ChatController.handleNewMessage()
  → AppState.addMessage()
  → ChatView auto-updates (Observer pattern)
```

## Lợi ích của kiến trúc mới

### 1. **Separation of Concerns**

- Mỗi class có trách nhiệm rõ ràng
- Dễ maintain và debug
- Code dễ đọc và hiểu

### 2. **Reusability**

- Models có thể reuse ở nhiều nơi
- Services có thể dùng cho nhiều controllers
- Views độc lập với business logic

### 3. **Testability**

- Dễ dàng mock services cho unit tests
- Controllers có thể test độc lập
- Models có pure functions

### 4. **Scalability**

- Dễ thêm features mới
- Dễ refactor từng phần
- Tránh code duplication

### 5. **State Management**

- Centralized state trong AppState
- Observer pattern cho reactive updates
- Consistent data flow

## So sánh với code cũ

### Code cũ (Procedural)

```javascript
// Global variables everywhere
let currentUser = null;
let currentToken = null;

// Functions scattered around
async function handleLogin() { ... }
async function sendMessage() { ... }

// ChatManager class làm quá nhiều việc
class ChatManager {
    // 500+ lines code
    // Làm cả UI, API, WebSocket, state management
}
```

### Code mới (OOP)

```javascript
// Centralized state
const appState = new AppState();

// Separated responsibilities
class AuthController { ... }
class ChatController { ... }
class AuthView { ... }
class ChatService { ... }

// Clear dependencies
class AppController {
    constructor() {
        this.authService = new AuthService();
        this.authView = new AuthView();
        this.authController = new AuthController(
            this.authView,
            this.authService
        );
    }
}
```

## Migration Notes

### Breaking Changes

- Không còn global variables `currentUser`, `currentToken`
- Không còn class `ChatManager`
- Event handlers giờ được quản lý trong các Views

### Backward Compatibility

- Global functions cho HTML onclick handlers vẫn hoạt động
- Session storage format không thay đổi
- API endpoints không thay đổi

## Future Improvements

1. **TypeScript Migration**

   - Type safety
   - Better IDE support
   - Compile-time error checking

2. **Module System**

   - ES6 modules thay vì script tags
   - Build tool (Webpack/Vite)
   - Code splitting

3. **Testing**

   - Unit tests cho từng class
   - Integration tests
   - E2E tests

4. **Error Handling**

   - Centralized error handling
   - Error boundary pattern
   - User-friendly error messages

5. **Performance**
   - Virtual scrolling cho messages
   - Lazy loading rooms
   - Message pagination
