
# 📄 WhatsApp Automation API – Documentation

## 🧰 Tech Stack
- **Backend Framework:** Node.js + Express.js
- **WhatsApp Integration:** [`venom-bot`](https://github.com/orkestral/venom)
- **Containerization:** Docker
- **Data Storage:** In-memory sessions with file-based persistence (tokens stored in `./tokens` folder)

---

## 🚀 Getting Started

### 🔧 Installation

```bash
npm install
```

### ▶️ Run the server

```bash
node index.js
```

### 🐳 Run with Docker

#### 1. Create a `Dockerfile`

```dockerfile
# Dockerfile
FROM node:18

# Set working directory
WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN npm install

# Expose port
EXPOSE 5000

# Run app
CMD ["node", "index.js"]
```

#### 2. Build & Run

```bash
docker build -t whatsapp-automation .
docker run -p 5000:5000 whatsapp-automation
```

---

## 📡 API Endpoints

### 1. **Create / Init Session**

**URL:** `POST /session/:sessionName`

**Description:** Initializes a new session and generates a QR code for authentication.

**Params:**
- `sessionName` (string): The unique name of the session.

**Response:**
```json
{
  "message": "Session mysession initialization started"
}
```

### 2. **Get QR Code**

**URL:** `GET /qr/:sessionName`

**Description:** Retrieves the Base64-encoded QR code for a session.

**Params:**
- `sessionName` (string): The session to get the QR code for.

**Response:**
```json
{
  "qr": "data:image/png;base64,..."
}
```

**Errors:**
```json
{
  "error": "QR code not yet generated or session does not exist"
}
```

### 3. **Send Message**

**URL:** `POST /send-text/:sessionName`

**Description:** Sends a WhatsApp message via the session.

**Params:**
- `sessionName` (string): The session to use for sending.
- **Body:**
```json
{
  "mobile": "919999999999",
  "message": "Hello from Venom!"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "id": "...",
    "body": "..."
  }
}
```

**Errors:**
```json
{
  "error": "WhatsApp client not ready for this session"
}
```

### 4. **Get Connection State**

**URL:** `GET /connection-state/:sessionName`

**Description:** Returns the connection status of a WhatsApp session.

**Response:**
```json
{
  "state": "CONNECTED"
}
```

**Errors:**
```json
{
  "state": "NOT_INITIALIZED"
}
```

### 5. **Delete Session**

**URL:** `DELETE /session/:sessionName`

**Description:** Terminates a session, shuts down the client, and removes local session storage.

**Response:**
```json
{
  "message": "Session mysession deleted successfully"
}
```

**Errors:**
```json
{
  "error": "Session mysession does not exist"
}
```

---

## 🗂️ Session Storage

- Session tokens are saved in the `./tokens/:sessionName` folder.
- Deleting a session also deletes its folder using `fs.rmSync`.

---

## 🧠 Internal Architecture

```
index.js
│
├── createSession(sessionName)
│   ├── venom.create() -> starts a new session
│   ├── returns QR & client references
│
├── sessions object
│   ├── { [sessionName]: { qrCodeBase64, client } }
│
├── Express Endpoints
│   ├── /session/:sessionName     -> Create/init
│   ├── /qr/:sessionName          -> Get QR
│   ├── /send-text/:sessionName  -> Send message
│   ├── /connection-state/:sName  -> Check connection
│   └── /session/:sessionName     -> Delete session
```

---

## 🔐 Notes & Best Practices

- Ensure session names are unique across devices.
- Use a process manager like PM2 or Docker to persist sessions.
- You can serve the QR code directly to a frontend for scan-based login.
- Consider adding rate-limiting and auth for production use.

---
