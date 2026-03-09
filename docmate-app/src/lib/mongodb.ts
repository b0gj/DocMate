import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/docmate";

declare global {
  var _mongoosePromise: Promise<typeof mongoose> | undefined;
}

export async function connectDB() {
  if (globalThis._mongoosePromise) {
    return globalThis._mongoosePromise;
  }

  globalThis._mongoosePromise = mongoose.connect(MONGODB_URI);
  return globalThis._mongoosePromise;
}
