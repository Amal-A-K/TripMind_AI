/**
 * Itinerary Controller
 *
 * Handles read operations for itineraries:
 *  - getUserItineraries — list all itineraries for the authenticated user
 *  - getItineraryById   — get a single itinerary (must belong to user)
 *  - getSharedItinerary — public read via shareId (no auth required)
 */

import Itinerary from "../models/Itinerary.js";
import { generateItineraryFromPreferences } from "../services/ai.service.js";

// ─── GET /api/itineraries ─────────────────────────────────────────────────────
// Returns all itineraries for the logged-in user (newest first)
export const getUserItineraries = async (req, res, next) => {
  try {
    const itineraries = await Itinerary.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("-extractedText"); // Omit raw text from list view — keeps response lean

    res.status(200).json({
      success: true,
      count: itineraries.length,
      data: itineraries,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/itineraries/:id ─────────────────────────────────────────────────
// Returns a single itinerary — enforces ownership
export const getItineraryById = async (req, res, next) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      userId: req.user._id, // Ownership check — users can only read their own
    });

    if (!itinerary) {
      const error = new Error("Itinerary not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    // Handle invalid MongoDB ObjectId format
    if (error.name === "CastError") {
      const castError = new Error("Invalid itinerary ID format");
      castError.statusCode = 400;
      return next(castError);
    }
    next(error);
  }
};

// ─── POST /api/itineraries/generate ──────────────────────────────────────────
// Generates a new itinerary from user form preferences using Gemini
export const createItineraryFromPreferences = async (req, res, next) => {
  console.log("[Controller Execution] createItineraryFromPreferences started");
  console.log("[Controller Payload]", req.body);
  try {
    const { destination, duration, budget, travelStyle, interests, startDate, additionalNotes } = req.body;

    if (!destination) {
      const error = new Error("Please provide a destination.");
      error.statusCode = 400;
      return next(error);
    }

    console.log(`[Controller Execution] Querying Gemini to generate itinerary for: ${destination} (${duration} Days)...`);
    const generatedItinerary = await generateItineraryFromPreferences({
      destination,
      duration,
      budget,
      travelStyle,
      interests,
      startDate,
      additionalNotes
    });
    console.log("[Controller Execution] Gemini generated itinerary response successfully");

    // Persist to database with flat fields for frontend display
    const itinerary = await Itinerary.create({
      userId: req.user._id,
      destination,
      duration: Number(duration),
      budget,
      travelStyle,
      summary: generatedItinerary.title || `${destination} Adventure`,
      days: generatedItinerary.days || [],
      tips: generatedItinerary.practicalInfo?.packingTips || [],
      totalEstimatedCost: generatedItinerary.totalEstimatedCost || "",
      startDate: startDate ? new Date(startDate) : undefined,
      generatedItinerary,
      isPublic: false
    });

    console.log(`[Controller Execution] Saved itinerary to DB with ID: ${itinerary._id}`);
    res.status(201).json({
      success: true,
      message: "Itinerary generated successfully",
      data: itinerary
    });
  } catch (error) {
    console.error("[Controller Error] Failed to generate itinerary:", error);
    if (error.isAIError || error.message?.toLowerCase().includes("gemini") || error.message?.toLowerCase().includes("ai")) {
      const apiError = new Error("AI service is currently busy. Please try again.");
      apiError.statusCode = 503;
      return next(apiError);
    }
    next(error);
  }
};

// ─── PATCH /api/itineraries/:id/toggle-public ──────────────────────────────
// Toggles the isPublic sharing state of an itinerary
export const toggleItineraryPublic = async (req, res, next) => {
  console.log(`[Controller Execution] toggleItineraryPublic started for ID: ${req.params.id}`);
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!itinerary) {
      console.log("[Controller Execution] Itinerary not found or ownership mismatch");
      const error = new Error("Itinerary not found");
      error.statusCode = 404;
      return next(error);
    }

    itinerary.isPublic = !itinerary.isPublic;
    await itinerary.save();

    console.log(`[Controller Execution] Toggled public access to: ${itinerary.isPublic}`);
    res.status(200).json({
      success: true,
      message: `Itinerary is now ${itinerary.isPublic ? 'public' : 'private'}`,
      data: itinerary
    });
  } catch (error) {
    console.error("[Controller Error] Failed to toggle sharing:", error);
    next(error);
  }
};

// ─── GET /api/share/:shareId ──────────────────────────────────────────────────
// Public endpoint — accessible without authentication
// Returns the public itinerary metadata and day details
export const getSharedItinerary = async (req, res, next) => {
  console.log(`[Controller Execution] getSharedItinerary started for shareId: ${req.params.shareId}`);
  try {
    const itinerary = await Itinerary.findOne({
      shareId: req.params.shareId,
      isPublic: true, // Enforce public visibility constraint
    }).select("destination duration budget travelStyle summary days tips totalEstimatedCost startDate generatedItinerary structuredBookingData createdAt isPublic shareId");

    if (!itinerary) {
      console.log("[Controller Execution] Shared itinerary not found or not set to public");
      const error = new Error("Shared itinerary not found or link is invalid");
      error.statusCode = 404;
      return next(error);
    }

    console.log(`[Controller Execution] Successfully retrieved shared itinerary: ${itinerary.destination}`);
    res.status(200).json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    console.error("[Controller Error] Failed to fetch shared itinerary:", error);
    next(error);
  }
};

// ─── DELETE /api/itineraries/:id ──────────────────────────────────────────────
// Deletes a single itinerary — enforces ownership
export const deleteItinerary = async (req, res, next) => {
  console.log("[Controller Execution] deleteItinerary started");
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      userId: req.user._id, // Ownership check
    });

    if (!itinerary) {
      const error = new Error("Itinerary not found");
      error.statusCode = 404;
      return next(error);
    }

    await Itinerary.deleteOne({ _id: req.params.id });

    console.log("[Controller Execution] itinerary deleted successfully");
    res.status(200).json({
      success: true,
      message: "Itinerary deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      const castError = new Error("Invalid itinerary ID format");
      castError.statusCode = 400;
      return next(castError);
    }
    next(error);
  }
};

