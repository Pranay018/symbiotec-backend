import dotenv from "dotenv";
dotenv.config();

import path from "path";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.Routes.js";
import contentRoutes from "./routes/content.Routes.js";
import publicRoutes from "./routes/public.Routes.js";
  
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://symbiotec.com",
      "https://symbiotec.com",
      "https://www.symbiotec.com",
      "http://investor.symbiotec.com",
      "https://www.investor.symbiotec.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/public", publicRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running 🚀" });
});

/* DB */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
