import mongoose from "mongoose";
import path from "node:path";

declare global {
  var __mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    memoryUri: string | null;
  } | undefined;
}

const cached = global.__mongooseConn ?? { conn: null, promise: null, memoryUri: null };
global.__mongooseConn = cached;

async function startEmbeddedFallback(): Promise<string> {
  if (cached.memoryUri) return cached.memoryUri;
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const instance = await MongoMemoryServer.create({
    instance: {
      dbName: "ecommerce_admin",
      dbPath: path.join(process.cwd(), ".data", "mongo"),
      storageEngine: "wiredTiger",
    },
  });
  cached.memoryUri = instance.getUri("ecommerce_admin");
  console.warn(
    "[db] MONGODB_URI was unreachable. Started an embedded MongoDB instance for local development. " +
      "Set MONGODB_URI (e.g. MongoDB Atlas) for production."
  );
  return cached.memoryUri;
}

async function resolveConnection(): Promise<typeof mongoose> {
  const primaryUri = process.env.MONGODB_URI;

  if (primaryUri) {
    try {
      return await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 3500,
        bufferCommands: false,
      });
    } catch (err) {
      console.warn("[db] Failed to connect to primary MONGODB_URI, falling back:", (err as Error).message);
    }
  }

  const fallbackUri = await startEmbeddedFallback();
  return mongoose.connect(fallbackUri, { bufferCommands: false });
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = resolveConnection();
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

export default connectDB;
