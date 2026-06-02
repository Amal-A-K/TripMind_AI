/**
 * Upload Controller
 *
 * Orchestrates the full pipeline triggered by POST /api/upload:
 *   1. Validate uploaded files exist
 *   2. Extract text from files (PDF or OCR)
 *   3. Call Gemini to parse extracted text into structured booking data
 *   4. Call Gemini again to generate a travel itinerary
 *   5. Save everything to the Itinerary model and return the result
 *
 * Each step is a separate service call — this controller is intentionally
 * thin, just coordinating the flow.
 */

import Itinerary from "../models/Itinerary.js";
import extractTextFromFiles from "../services/extraction.service.js";
import { parseBookingData, generateItinerary, validateTravelDocument } from "../services/ai.service.js";

// POST /api/upload
export const uploadAndProcess = async (req, res, next) => {
  try {
    // 1. Validate files
    if (!req.files || req.files.length === 0) {
      const error = new Error("No files uploaded. Please attach at least one file.");
      error.statusCode = 400;
      return next(error);
    }

    // Build a clean file metadata array for the DB (Multer paths are absolute)
    const filesMeta = req.files.map((file) => ({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
    }));

    // 2. Extract text from all uploaded files (PDF → pdf-parse, image → OCR)
    const extractedText = await extractTextFromFiles(req.files);

    if (!extractedText) {
      const error = new Error(
        "Could not extract any text from the uploaded files. Please check file quality."
      );
      error.statusCode = 422;
      return next(error);
    }

    // ─── Travel Document Validation Layer ────────────────────────
    console.log("[Validation] Checking uploaded document...");
    const textLower = extractedText.toLowerCase();
    const travelKeywords = [
      "flight", "airline", "pnr", "ticket", "boarding", "layover", "terminal", "gate",
      "hotel", "booking", "reservation", "check-in", "checkout", "room", "stay", "accommodation",
      "train", "railway", "irctc", "coach", "berth",
      "bus", "travel", "itinerary", "destination", "trip", "tour", "voucher", "passenger",
      "confirmation", "reference"
    ];
    const hasLocalKeywords = travelKeywords.some(keyword => textLower.includes(keyword));

    if (!hasLocalKeywords) {
      console.log("[Validation] Document rejected");
      console.log("[Validation] Reason: No travel-related information found");
      const error = new Error(
        "No travel booking information found in the uploaded document. Please upload a flight ticket, hotel booking, travel reservation, or similar travel document."
      );
      error.statusCode = 400;
      return next(error);
    }

    const validationResult = await validateTravelDocument(extractedText);
    if (!validationResult || !validationResult.isTravelDocument) {
      console.log("[Validation] Document rejected");
      console.log(`[Validation] Reason: ${validationResult?.reason || "No travel-related information found"}`);
      const error = new Error(
        "No travel booking information found in the uploaded document. Please upload a flight ticket, hotel booking, travel reservation, or similar travel document."
      );
      error.statusCode = 400;
      return next(error);
    }

    console.log("[Validation] Travel document detected");
    console.log(`[Validation] Confidence: ${validationResult.confidence}`);


    // 3. Parse extracted text into structured booking data via Gemini
    console.log("[Controller Execution] Parsing extracted text into structured booking data via Gemini...");
    const structuredBookingData = await parseBookingData(extractedText);
    console.log("[Controller Execution] Successfully structured booking data");

    // Secondary check: Validate that at least one meaningful travel indicator exists in the parsed structured data
    const hasDestination = structuredBookingData?.tripSummary?.destination && 
                           structuredBookingData.tripSummary.destination !== "null" && 
                           structuredBookingData.tripSummary.destination !== null;
    const hasFlights = Array.isArray(structuredBookingData?.flights) && structuredBookingData.flights.length > 0;
    const hasHotels = Array.isArray(structuredBookingData?.hotels) && structuredBookingData.hotels.length > 0;
    const hasBookingRef = (Array.isArray(structuredBookingData?.flights) && structuredBookingData.flights.some(f => f.confirmationCode)) ||
                          (Array.isArray(structuredBookingData?.hotels) && structuredBookingData.hotels.some(h => h.confirmationCode));
    const hasTravelDate = Array.isArray(structuredBookingData?.flights) && structuredBookingData.flights.some(f => f.departureDate || f.arrivalDate);
    const hasCheckInCheckOut = Array.isArray(structuredBookingData?.hotels) && structuredBookingData.hotels.some(h => h.checkIn || h.checkOut);

    const atLeastOneIndicator = hasDestination || hasFlights || hasHotels || hasBookingRef || hasTravelDate || hasCheckInCheckOut;

    if (!atLeastOneIndicator) {
      console.log("[Validation] Document rejected");
      console.log("[Validation] Reason: No travel-related information found");
      const error = new Error(
        "No travel booking information found in the uploaded document. Please upload a flight ticket, hotel booking, travel reservation, or similar travel document."
      );
      error.statusCode = 400;
      return next(error);
    }

    // 4. Generate itinerary from structured data via Gemini
    console.log("[Controller Execution] Generating itinerary from structured data via Gemini...");
    const generatedItinerary = await generateItinerary(structuredBookingData);
    console.log("[Controller Execution] Successfully generated itinerary");

    // Extract flat fields for frontend rendering compatibility
    const destination = structuredBookingData?.tripSummary?.destination || generatedItinerary?.title || "Unknown Destination";

    // --- duration: root cause of NaN ---
    // Gemini returns tripDuration as a string like "5 days" or "3 nights", NOT a number.
    // Number("5 days") === NaN → Mongoose CastError.
    // Fix: parse the leading integer, fall back to days array length, then default to 1.
    const rawTripDuration = structuredBookingData?.tripSummary?.tripDuration;
    console.log(`[DEBUG] rawTripDuration from structuredBookingData: "${rawTripDuration}" (type: ${typeof rawTripDuration})`);

    let duration = parseInt(String(rawTripDuration ?? ""), 10); // "5 days" → 5, null → NaN
    if (!Number.isFinite(duration) || duration <= 0) {
      duration = generatedItinerary?.days?.length;              // fall back to actual day count
      console.log(`[DEBUG] duration from generatedItinerary.days.length: ${duration}`);
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      duration = 1;                                             // final safe default
      console.log("[DEBUG] duration fell back to default: 1");
    }
    console.log(`[DEBUG] Final resolved duration: ${duration}`);

    const summary = generatedItinerary?.title || `Trip to ${destination}`;
    const days = generatedItinerary?.days || [];
    const tips = generatedItinerary?.practicalInfo?.packingTips || [];
    const totalEstimatedCost = generatedItinerary?.totalEstimatedCost || generatedItinerary?.practicalInfo?.currency || "N/A";

    // Debug: log exact payload before persisting
    const itineraryPayload = {
      userId: req.user._id,
      originalFiles: filesMeta,
      extractedText,
      structuredBookingData,
      generatedItinerary,
      destination,
      duration,
      summary,
      days,
      tips,
      totalEstimatedCost,
      budget: "Moderate",
      travelStyle: "Balanced",
      isPublic: false
    };
    console.log("[DEBUG] Structured Booking Data:", JSON.stringify(structuredBookingData, null, 2));
    console.log("[DEBUG] Generated Itinerary (days count):", generatedItinerary?.days?.length);
    console.log("[DEBUG] Final Mongo Payload (excluding large fields):", JSON.stringify({
      destination: itineraryPayload.destination,
      duration: itineraryPayload.duration,
      summary: itineraryPayload.summary,
      totalEstimatedCost: itineraryPayload.totalEstimatedCost,
      daysCount: itineraryPayload.days?.length,
    }, null, 2));

    // 5. Persist to database
    console.log("[Controller Execution] Persisting itinerary to database...");
    const itinerary = await Itinerary.create(itineraryPayload);

    console.log(`[Controller Execution] uploadAndProcess success - Saved itinerary ID: ${itinerary._id}`);

    // Convert to plain object so _id is serialized as a string, not an ObjectId
    const itineraryJSON = itinerary.toJSON();
    console.log(`[Controller Response] Sending itinerary with _id: ${itineraryJSON._id}, id: ${itineraryJSON.id}`);

    res.status(201).json({
      success: true,
      message: "Itinerary generated successfully",
      data: itineraryJSON,
    });
  } catch (error) {
    console.error("[Controller Error] uploadAndProcess failed:", error);
    if (error.isAIError || error.message?.toLowerCase().includes("gemini") || error.message?.toLowerCase().includes("ai")) {
      const apiError = new Error("AI service is currently busy. Please try again.");
      apiError.statusCode = 503;
      return next(apiError);
    }
    next(error);
  }
};

