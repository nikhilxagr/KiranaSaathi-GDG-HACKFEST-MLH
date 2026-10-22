import mongoose from 'mongoose';
import { env } from '../utils/env';

let isConnected = false;

export const connectMongoDB = async (): Promise<boolean> => {
  if (isConnected) return true;

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to ${env.MONGODB_URI}`);
    return true;
  } catch (error: any) {
    isConnected = false;
    console.warn(`[MongoDB] Unable to connect (${error?.message || 'timeout'}). Server running in resilient hybrid mode.`);
    return false;
  }
};

export const isMongoConnected = (): boolean => isConnected;

export const disconnectMongoDB = async (): Promise<void> => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
};
