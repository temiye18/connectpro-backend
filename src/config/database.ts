import { ConnectOptions, connect } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const dbURL = process.env.MONGO_URI || "mongodb://localhost/auth";

export const connectDB = async () => {
  await connect(dbURL, {
    retryWrites: true,
    w: "majority",
  } as ConnectOptions);
};
