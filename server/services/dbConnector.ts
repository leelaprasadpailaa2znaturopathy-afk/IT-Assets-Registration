import mongoose from "mongoose";

let isConnected = false;
let seedAttempted = false;

export async function connectDatabase(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is required. Application cannot start without MongoDB.");
    throw new Error("MONGODB_URI environment variable is required");
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log("🚀 Connected to MongoDB at", uri.split("@").pop()); // Hiding credentials
    return true;
  } catch (err: any) {
    console.error("❌ MongoDB Connection failed:", err.message);
    throw err;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}

export function markSeedAttempted() {
  seedAttempted = true;
}

export function hasSeedBeenAttempted(): boolean {
  return seedAttempted;
}
