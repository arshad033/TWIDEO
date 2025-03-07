import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

export const connectDB = async () => {
  try {
    const dbConnectionInstance = await mongoose.connect(
      `${process.env.DATABASE_URI}/${DB_NAME}`
    );
    console.log("database is connected: "); //see this object
  } catch (error) {
    console.log("Database connection failed: ", error);
    process.exit(1); // learn this
  }
};
