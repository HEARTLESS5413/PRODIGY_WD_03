import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import createFriendRoutes from './routes/friendRoutes.js';
import createGameRoutes from './routes/gameRoutes.js';
import createUserRoutes from './routes/userRoutes.js';

function parseOrigins(clientUrl) {
  if (!clientUrl) return '*';
  const origins = clientUrl.split(',').map((o) => o.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

export function configureApp(app, socketApi) {
  app.use(
    cors({
      credentials: true,
      origin: parseOrigins(env.clientUrl),
    })
  );

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', createUserRoutes(socketApi));
  app.use('/api/friends', createFriendRoutes(socketApi));
  app.use('/api/games', createGameRoutes());

  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    const message = error.message || 'Internal server error.';
    res.status(status).json({ message });
  });

  // In production, serve the React frontend build as static files.
  // This enables single-process deployment on Render / Railway / Fly.io.
  if (env.nodeEnv === 'production') {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}
