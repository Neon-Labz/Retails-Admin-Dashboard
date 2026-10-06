import { Db, MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL;
if (!uri) throw new Error("DATABASE_URL is required");

const globalForMongo = globalThis as typeof globalThis & {
  mongoClient?: MongoClient;
  mongoDb?: Db;
};

export async function connectDB(): Promise<Db> {
  if (globalForMongo.mongoDb) return globalForMongo.mongoDb;
  const client = globalForMongo.mongoClient ?? new MongoClient(uri);
  await client.connect();
  const db = client.db();
  if (process.env.NODE_ENV !== "production") {
    globalForMongo.mongoClient = client;
    globalForMongo.mongoDb = db;
  }
  return db;
}

export async function getDb() {
  return connectDB();
}
