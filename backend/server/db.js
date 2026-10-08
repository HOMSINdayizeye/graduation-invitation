import dns from "node:dns";
import mongoose from "mongoose";
import { ENV } from "./_core/env.js";

let connected = false;

export function isDbConnected() {
  return connected && mongoose.connection.readyState === 1;
}

// Connects once at startup; the server still runs without a database so the public pages keep working.
export async function connectDb() {
  if (!ENV.mongoUri) {
    console.warn("[Database] MONGODB_URI is not set. Sign-in and accounts are disabled until it is.");
    return false;
  }
  // Atlas SRV records need a resolver that handles them; the OS default often does not (same fix as cok_systems).
  if (ENV.mongoUri.startsWith("mongodb+srv://")) dns.setServers(["8.8.8.8", "1.1.1.1"]);
  try {
    await mongoose.connect(ENV.mongoUri, {
      serverSelectionTimeoutMS: 10000,
      ...(ENV.mongoDbName ? { dbName: ENV.mongoDbName } : {}),
    });
    connected = true;
    console.log(`[Database] Connected to MongoDB, database "${mongoose.connection.name}"`);
  } catch (error) {
    connected = false;
    console.error("[Database] Connection failed:", error.message);
  }
  return connected;
}
