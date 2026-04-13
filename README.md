# Real-Time Tic-Tac-Toe

A full-stack Tic-Tac-Toe platform with JWT authentication, MongoDB persistence, Socket.IO gameplay, friend requests, real-time invites, random matchmaking, in-game chat, typing indicators, online presence, and an offline bot mode.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + Socket.IO
- Database: MongoDB + Mongoose
- Auth: JWT + bcrypt
- Deployment: Docker / Render / Railway

## Features

- Unique username registration and login
- Protected routes with JWT session persistence
- User search and friend request workflow
- Friends list with online/offline status
- Play with friend via live invite acceptance
- Random matchmaking queue with waiting state
- Offline bot play with minimax AI
- Real-time game sync, rematch flow, and in-game chat
- Typing indicator and move sound effects

## Project Structure

```text
.
|-- backend
|   |-- .env.example
|   |-- Dockerfile
|   |-- package.json
|   `-- src
|       |-- app.js
|       |-- server.js
|       |-- config
|       |   |-- db.js
|       |   `-- env.js
|       |-- middleware
|       |   `-- auth.js
|       |-- models
|       |   |-- Game.js
|       |   `-- User.js
|       |-- routes
|       |   |-- authRoutes.js
|       |   |-- friendRoutes.js
|       |   |-- gameRoutes.js
|       |   |-- socketApi.js
|       |   `-- userRoutes.js
|       |-- sockets
|       |   `-- index.js
|       `-- utils
|           |-- asyncHandler.js
|           |-- gameLogic.js
|           |-- jwt.js
|           `-- serializers.js
|-- frontend
|   |-- .env.example
|   |-- Dockerfile
|   |-- nginx.conf
|   |-- index.html
|   |-- package.json
|   |-- postcss.config.js
|   |-- tailwind.config.js
|   |-- vite.config.js
|   `-- src
|       |-- App.jsx
|       |-- main.jsx
|       |-- index.css
|       |-- api
|       |   `-- client.js
|       |-- components
|       |   |-- ChatPanel.jsx
|       |   |-- FriendSearchResults.jsx
|       |   |-- FriendsPanel.jsx
|       |   |-- GameBoard.jsx
|       |   |-- ModeTile.jsx
|       |   |-- ProtectedRoute.jsx
|       |   `-- StatusBadge.jsx
|       |-- contexts
|       |   |-- AuthContext.jsx
|       |   `-- SocketContext.jsx
|       |-- hooks
|       |   `-- useMoveSound.js
|       |-- lib
|       |   `-- game.js
|       `-- pages
|           |-- AuthPage.jsx
|           |-- BotGamePage.jsx
|           |-- DashboardPage.jsx
|           `-- GamePage.jsx
|-- .dockerignore
|-- .env.docker
|-- .gitignore
|-- docker-compose.yml
|-- package.json
|-- render.yaml
`-- README.md
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/tictactoe_realtime` |
| `JWT_SECRET` | Secret for signing JWT tokens | *(required in production)* |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated | `http://localhost:5173` |
| `USE_MEMORY_MONGO` | Use in-memory MongoDB for dev | `false` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |

---

## Local Development Setup

1. **Install dependencies** from the root:

```bash
npm install
```

2. **Copy the example env files** and fill in your values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. **Start MongoDB** locally, OR set `USE_MEMORY_MONGO=true` in `backend/.env` for zero-setup dev.

4. **Start both apps** together:

```bash
npm run dev
```

5. Open `http://localhost:5173`.

---

## Docker Deployment (Recommended for Self-Hosting)

Run the full stack (MongoDB + Backend + Frontend) with a single command:

### Quick Start

```bash
# 1. Copy the environment template
cp .env.docker .env.compose

# 2. Edit .env.compose — set a strong JWT_SECRET!
#    Update CLIENT_URL / VITE_API_URL if deploying to a domain

# 3. Build and start all services
docker compose --env-file .env.compose up --build

# 4. Open http://localhost:3000 (frontend)
#    Backend API at http://localhost:5000
```

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  Docker Compose                                     │
│                                                     │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Frontend      │  │  Backend     │  │  MongoDB │ │
│  │  (Nginx:80)    │──│  (Node:5000) │──│  (:27017)│ │
│  │  React SPA     │  │  Express +   │  │  v7      │ │
│  │                │  │  Socket.IO   │  │          │ │
│  └───────────────┘  └──────────────┘  └──────────┘ │
│                                          ↕          │
│                                     mongo-data vol  │
└─────────────────────────────────────────────────────┘
```

### Useful Commands

```bash
# Stop all services
docker compose down

# Stop and remove volumes (wipes database!)
docker compose down -v

# Rebuild a single service
docker compose build backend

# View logs
docker compose logs -f backend
```

---

## Cloud Deployment (Render / Railway / Fly.io)

For platforms that give you a single service, the app runs in **single-process mode**: Express serves the React build as static files.

### Deploy to Render

1. Push your code to GitHub.
2. Connect the repo to [Render](https://render.com).
3. Render auto-detects `render.yaml` and configures the service.
4. Set environment variables:
   - `MONGO_URI` → Use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier available)
   - `JWT_SECRET` → A strong random string (auto-generated by Render)
   - `CLIENT_URL` → Your Render service URL (e.g. `https://tictactoe-server.onrender.com`)
5. Set the **build command**: `npm install && npm run build`
6. Set the **start command**: `npm run start`

### Deploy to Railway

1. Push code to GitHub → connect to [Railway](https://railway.app).
2. Add a **MongoDB** plugin from the Railway dashboard.
3. Set environment variables:
   - `MONGO_URI` → Railway's auto-injected MongoDB URL
   - `JWT_SECRET` → Generate a random string
   - `CLIENT_URL` → Your Railway public URL
   - `NODE_ENV` → `production`
4. Build command: `npm install && npm run build`
5. Start command: `npm run start`

### Key Notes for Cloud Deployment

- The `npm run build` command builds the frontend (Vite) into `frontend/dist/`.
- The `npm run start` command starts the Express server, which also serves `frontend/dist/` as static files in production.
- Socket.IO WebSocket connections work on Render/Railway out of the box.
- You need a persistent MongoDB — use [MongoDB Atlas](https://www.mongodb.com/atlas) free tier.

---

## API Reference

### REST Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Login |
| `GET` | `/api/auth/me` | Yes | Get current user profile |
| `GET` | `/api/users/search?q=` | Yes | Search users by username |
| `GET` | `/api/friends` | Yes | Get friends list |
| `GET` | `/api/friends/requests` | Yes | Get pending friend requests |
| `POST` | `/api/friends/request/:userId` | Yes | Send friend request |
| `POST` | `/api/friends/request/:userId/accept` | Yes | Accept friend request |
| `POST` | `/api/friends/request/:userId/reject` | Yes | Reject friend request |
| `GET` | `/api/games/:gameId` | Yes | Get game state |
| `GET` | `/api/health` | No | Health check |

### Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `joinRoom` | Client → Server | Join a game room |
| `sendInvite` | Client → Server | Send game invite to a friend |
| `acceptInvite` | Client → Server | Accept a game invite |
| `rejectInvite` | Client → Server | Reject a game invite |
| `matchmaking` | Client → Server | Join/leave random queue |
| `gameMove` | Client → Server | Make a move |
| `chatMessage` | Bidirectional | In-game chat |
| `typing` | Bidirectional | Typing indicator |
| `requestRematch` | Client → Server | Request rematch after game ends |
| `game:update` | Server → Client | Game state update |
| `gameStarted` | Server → Client | Game created, navigate to room |
| `presence:sync` | Server → Client | Initial online users list |
| `presence:update` | Server → Client | User online/offline update |
| `inviteReceived` | Server → Client | Incoming game invite |
| `friend:request` | Server → Client | Incoming friend request |
| `friend:accepted` | Server → Client | Friend request accepted |

---

## Useful Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start backend + frontend together (development) |
| `npm run dev:backend` | Start only the Express + Socket.IO server |
| `npm run dev:frontend` | Start only the React app |
| `npm run build` | Build frontend for production |
| `npm run start` | Start production server (serves API + static frontend) |
