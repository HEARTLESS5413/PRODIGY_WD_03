import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (env.useMemoryMongo) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`MongoDB connected (memory): ${mongoose.connection.host}`);
    return memoryServer;
  }

  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  return null;
}
