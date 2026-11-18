import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medguard';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick fail if local MongoDB isn't running so server starts fast
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    isConnected = false;
    console.warn(`[MongoDB] Notice: Could not connect to MongoDB at ${uri}.`);
    console.warn(`[MongoDB] The Express server will run with built-in in-memory fallback store.`);
    console.warn(`[MongoDB] Tip: To persist directly to MongoDB, start MongoDB locally (mongod) or set MONGODB_URI in .env to a MongoDB Atlas cluster.`);
    return null;
  }
};

export const getDBStatus = () => {
  return {
    connected: isConnected,
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/medguard',
    state: mongoose.connection.readyState === 1 ? 'connected' : 'fallback_memory'
  };
};
