import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./db/db.js";
import { app } from "./app.js";
dotenv.config();
connectDB();

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`server is listening on Port : ${PORT}`));
