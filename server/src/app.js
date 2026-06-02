/**
 * Express Application
 *
 * Assembles all middleware, routes, and error handling in the
 * correct order. Server startup (listen) lives in server.js — not here.
 * This separation makes the app easier to test in isolation.
 */

import express from "express";
import cors from "cors";
import morgan from "morgan";

// Routes
import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import itineraryRoutes, { shareRouter } from "./routes/itinerary.routes.js";

// Centralized error handler (must be registered LAST)
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ""));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or postman)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");
      const isAllowed = allowedOrigins.includes(normalizedOrigin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "TripMind AI API is running",
    version: "1.0.0",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/itineraries", itineraryRoutes);
app.use("/api/share", shareRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
// Catches any request that didn't match a registered route
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ─── Centralized Error Handler ────────────────────────────────────────────────
// Must be the LAST middleware — Express identifies error handlers by 4 args
app.use(errorHandler);

export default app;