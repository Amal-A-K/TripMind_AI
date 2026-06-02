/**
 * AI Service — Gemini Integration
 *
 * Two responsibilities:
 *  1. parseBookingData   — Convert raw extracted text → structured JSON
 *  2. generateItinerary  — Convert structured booking data → travel itinerary
 *
 * Both use a shared helper that calls Gemini and safely parses the JSON
 * response, with fallback error handling if the model output is malformed.
 */

import { getGeminiModel } from "../config/ai.js";
import {
  buildStructuredDataPrompt,
  buildItineraryPrompt,
  buildItineraryFromPreferencesPrompt,
  buildValidationPrompt,
} from "../utils/promptTemplates.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  const status = error.status || error.statusCode || error.response?.status;
  if (status) {
    return [429, 500, 502, 503, 504].includes(Number(status));
  }
  
  const msg = error.message || "";
  if (msg.includes("429") || msg.includes("500") || msg.includes("502") || msg.includes("503") || msg.includes("504")) {
    return true;
  }
  if (
    msg.toLowerCase().includes("high demand") || 
    msg.toLowerCase().includes("service unavailable") || 
    msg.toLowerCase().includes("too many requests") ||
    msg.toLowerCase().includes("busy")
  ) {
    return true;
  }
  return false;
};

/**
 * Internal helper: send a prompt to Gemini and parse JSON from the response.
 * Strips markdown code fences if Gemini wraps the JSON (happens occasionally).
 *
 * @param {string} prompt
 * @returns {Promise<object>} Parsed JSON object
 */
const callGeminiForJSON = async (prompt) => {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
  let lastError = null;

  for (let mIdx = 0; mIdx < models.length; mIdx++) {
    const modelName = models[mIdx];
    const isFallback = mIdx > 0;

    if (isFallback) {
      console.log(`[AI Service] Fallback activation: Switching to model ${modelName}`);
    }

    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      console.log(`[AI Service] Model being used: ${modelName} | Attempt: ${attempt + 1}/${maxRetries + 1}`);

      if (attempt > 0) {
        // Backoff: 2s, 4s, 8s
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.log(`[AI Service] Retry count: ${attempt} | Waiting for ${backoffMs / 1000} seconds before retrying...`);
        await sleep(backoffMs);
      }

      try {
        const model = getGeminiModel(modelName);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Strip ```json ... ``` or ``` ... ``` wrappers if present
        const cleaned = responseText
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();

        const parsedJson = JSON.parse(cleaned);
        console.log(`[AI Service] Final success: Content generated successfully using ${modelName} on attempt ${attempt}`);
        return parsedJson;
      } catch (error) {
        lastError = error;
        console.warn(`[AI Service] Attempt ${attempt} failed with model ${modelName}. Error: ${error.message}`);

        if (!isRetryableError(error)) {
          console.warn(`[AI Service] Non-retryable error: "${error.message}". Stopping retries for this model.`);
          break;
        }
      }
    }
  }

  // Both models failed
  console.error(`[AI Service] Final failure reason: Both primary and fallback models exhausted. Last error: ${lastError?.message}`);
  if (lastError) {
    lastError.isAIError = true;
  }
  throw lastError || new Error("Gemini API generation failed after retries and fallback.");
};

// ─── Public Service Methods ───────────────────────────────────────────────────

/**
 * Parse raw extracted text into structured booking data.
 *
 * @param {string} rawText - Combined text from PDF/OCR extraction
 * @returns {Promise<object>} Structured booking data (flights, hotels, etc.)
 */
export const parseBookingData = async (rawText) => {
  const prompt = buildStructuredDataPrompt(rawText);
  return callGeminiForJSON(prompt);
};

/**
 * Generate a full day-by-day travel itinerary from booking data.
 *
 * @param {object} bookingData - Structured booking object
 * @returns {Promise<object>} Complete itinerary JSON
 */
export const generateItinerary = async (bookingData) => {
  const prompt = buildItineraryPrompt(bookingData);
  return callGeminiForJSON(prompt);
};

/**
 * Generate a travel itinerary from custom user preferences.
 *
 * @param {object} preferences - User selected preferences from form
 * @returns {Promise<object>} Complete itinerary JSON
 */
export const generateItineraryFromPreferences = async (preferences) => {
  const prompt = buildItineraryFromPreferencesPrompt(preferences);
  return callGeminiForJSON(prompt);
};

/**
 * Classify whether the extracted text is a travel booking/ticket document.
 *
 * @param {string} rawText
 * @returns {Promise<{ isTravelDocument: boolean, confidence: number, reason: string }>}
 */
export const validateTravelDocument = async (rawText) => {
  const prompt = buildValidationPrompt(rawText);
  return callGeminiForJSON(prompt);
};

