/**
 * Itinerary Routes
 *
 * Protected (requires JWT):
 *   GET /api/itineraries       — list user's itineraries
 *   GET /api/itineraries/:id   — get one itinerary by ID
 *
 * Public (no auth):
 *   GET /api/share/:shareId    — view a shared itinerary by share token
 */

import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import { uploadMultiple } from "../middlewares/upload.middleware.js";
import { uploadAndProcess } from "../controllers/upload.controller.js";
import {
  getUserItineraries,
  getItineraryById,
  getSharedItinerary,
  createItineraryFromPreferences,
  toggleItineraryPublic,
  deleteItinerary,
} from "../controllers/itinerary.controller.js";

const router = Router();

// Middleware for route hit logging
const routeLogger = (pathName) => (req, _res, next) => {
  console.log(`[Backend Route Hit] ${req.method} ${pathName}`);
  next();
};

// Protected routes
router.get("/", protect, routeLogger("/api/itineraries"), getUserItineraries);
router.post("/generate", protect, routeLogger("/api/itineraries/generate"), createItineraryFromPreferences);
router.post("/generate-from-file", protect, routeLogger("/api/itineraries/generate-from-file"), uploadMultiple, uploadAndProcess);
router.patch("/:id/toggle-public", protect, routeLogger("/api/itineraries/:id/toggle-public"), toggleItineraryPublic);
router.get("/:id", protect, routeLogger("/api/itineraries/:id"), getItineraryById);
router.delete("/:id", protect, routeLogger("/api/itineraries/:id"), deleteItinerary);

export default router;

// ─── Separate Share Router ────────────────────────────────────────────────────
// Exported individually so app.js can mount it at /api/share
export const shareRouter = Router();
shareRouter.get("/:shareId", (req, _res, next) => {
  console.log(`[Backend Route Hit] GET /api/share/${req.params.shareId}`);
  next();
}, getSharedItinerary);

