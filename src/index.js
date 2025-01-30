import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from './db/db.js';
const app = express();
dotenv.config()
connectDB();

const PORT = process.env.PORT || 8000;
app.listen(PORT ,()=>console.log(`server is listening on Port : ${PORT}`))