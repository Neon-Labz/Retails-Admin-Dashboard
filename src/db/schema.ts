import { ObjectId, type Collection, type Filter, type Document, type UpdateFilter } from "mongodb";
import { connectDB } from "./index";

export type Id = ObjectId;
export type UserDoc = Document & { _id: ObjectId; name: string; email: string; passwordHash: string; phone: string | null; role: "customer" | "admin"; emailVerified: boolean; createdAt: Date };
export type SessionDoc = Document & { _id: ObjectId; userId: ObjectId; token: string; expiresAt: Date };
export type CategoryDoc = Document & { _id: ObjectId; name: string; slug: string };
export type ProductDoc = Document & { _id: ObjectId; categoryId?: ObjectId | null; price: string; stock: number };
export type OrderDoc = Document & { _id: ObjectId; userId: ObjectId; orderNumber: string; createdAt: Date };
export type OrderItemDoc = Document & { _id: ObjectId; orderId: ObjectId };

const idFields = new Set(["_id", "id", "userId", "categoryId", "orderId", "productId"]);

function objectId(value: unknown): unknown {
  if (typeof value === "string" && ObjectId.isValid(value)) return new ObjectId(value);
  if (Array.isArray(value)) return value.map(objectId);
  if (value && typeof value === "object" && !(value instanceof ObjectId) && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, idFields.has(k) ? objectId(v) : objectIdOperators(v)]));
  }
  return value;
}

function objectIdOperators(value: unknown): unknown {
  if (value && typeof value === "object" && !(value instanceof Date) && !(value instanceof ObjectId)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k.startsWith("$") ? objectId(v) : objectIdOperators(v)]));
  }
  return value;
}

function normalizeFilter(filter: Record<string, unknown>): Filter<Document> {
  return objectId(filter) as Filter<Document>;
}

function normalizeUpdate(update: Record<string, unknown>): UpdateFilter<Document> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(update)) {
    result[key] = key.startsWith("$") ? objectIdOperators(value) : value;
  }
  return result as UpdateFilter<Document>;
}

class Query<T extends Document> implements PromiseLike<T[]> {
  private promise: Promise<T[]>;
  constructor(collection: Promise<Collection<T>>, filter: Record<string, unknown>) {
    this.promise = collection.then(c => c.find(normalizeFilter(filter)).toArray());
  }
  sort(spec: Record<string, 1 | -1>) {
    this.promise = this.promise.then(rows =>
      rows.sort((a, b) => {
        for (const [key, direction] of Object.entries(spec)) {
          const av = a[key] as unknown, bv = b[key] as unknown;
          if (av < bv) return -direction;
          if (av > bv) return direction;
        }
        return 0;
      }),
    );
    return this;
  }
  skip(n: number) { this.promise = this.promise.then(rows => rows.slice(n)); return this; }
  limit(n: number) { this.promise = this.promise.then(rows => rows.slice(0, n)); return this; }
  select(fields: string) {
    const names = fields.split(/\s+/).filter(Boolean);
    this.promise = this.promise.then(rows => rows.map(row => Object.fromEntries(names.map(n => [n, row[n]])) as unknown as T));
    return this;
  }
  populate(_path: string, _select?: string) { return this; }
  lean() { return this; }
  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) { return this.promise.then(onfulfilled, onrejected); }
}

class OneQuery<T extends Document> implements PromiseLike<T | null> {
  private promise: Promise<T | null>;
  constructor(collection: Promise<Collection<T>>, filter: Record<string, unknown>) {
    this.promise = collection.then(c => c.findOne(normalizeFilter(filter)));
  }
  populate(_path: string, _select?: string) { return this; }
  lean() { return this; }
  then<TResult1 = T | null, TResult2 = never>(
    onfulfilled?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) { return this.promise.then(onfulfilled, onrejected); }
}

class Doc<T extends Document> {
  constructor(private value: T) { Object.assign(this, value); }
  toObject() { return this.value; }
}

class Model<T extends Document> {
  constructor(private name: string) {}
  private async collection() { return (await connectDB()).collection<T>(this.name); }
  find(filter: Record<string, unknown> = {}) { return new Query<T>(this.collection(), filter); }
  findOne(filter: Record<string, unknown> = {}) { return new OneQuery<T>(this.collection(), filter); }
  findById(id: unknown) { return new OneQuery<T>(this.collection(), { _id: id }); }
  async create(data: Record<string, unknown>) {
    const now = new Date();
    const doc = { ...data, _id: data._id ?? new ObjectId(), createdAt: data.createdAt ?? now, updatedAt: data.updatedAt ?? now } as unknown as T;
    await (await this.collection()).insertOne(doc);
    return new Doc<T>(doc);
  }
  async insertMany(data: Record<string, unknown>[]) { return Promise.all(data.map(d => this.create(d))); }
  async updateMany(filter: Record<string, unknown>, update: Record<string, unknown>) {
    return (await this.collection()).updateMany(normalizeFilter(filter), normalizeUpdate(update) as UpdateFilter<T>);
  }
  async findByIdAndUpdate(id: unknown, update: Record<string, unknown>, options: { new?: boolean; lean?: boolean } = {}) {
    const result = await (await this.collection()).findOneAndUpdate(
      { _id: objectId(id) as ObjectId } as Filter<T>,
      (normalizeUpdate(update).$set ?? normalizeUpdate(update)) as UpdateFilter<T>,
      { returnDocument: options.new ? "after" : "before" },
    );
    return result ? new Doc<T>(result as unknown as T) : null;
  }
  async deleteOne(filter: Record<string, unknown>) { return (await this.collection()).deleteOne(normalizeFilter(filter)); }
  async deleteMany(filter: Record<string, unknown>) { return (await this.collection()).deleteMany(normalizeFilter(filter)); }
  async countDocuments(filter: Record<string, unknown> = {}) { return (await this.collection()).countDocuments(normalizeFilter(filter)); }
}

export const User = new Model<UserDoc>("users");
export const Session = new Model<SessionDoc>("sessions");
export const VerificationToken = new Model<Document>("verificationTokens");
export const Address = new Model<Document>("addresses");
export const Category = new Model<CategoryDoc>("categories");
export const Product = new Model<ProductDoc>("products");
export const Order = new Model<OrderDoc>("orders");
export const OrderItem = new Model<OrderItemDoc>("orderItems");
