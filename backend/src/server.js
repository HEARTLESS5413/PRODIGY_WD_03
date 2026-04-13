import http from 'http';
import express from 'express';
import mongoose from 'mongoose';
import { configureApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { initializeSocketServer } from './sockets/index.js';

const app = express();
const server = http.createServer(app);
const socketApi = initializeSocketServer(server);

configureApp(app, socketApi);

async function startServer() {
  try {
    await connectDatabase();
    server.listen(env.port, () => {
      console.log(`Server listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown for Docker / cloud platforms
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    } catch (err) {
      console.error('Error closing MongoDB:', err);
    }
    console.log('Server shut down.');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown stalls
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
