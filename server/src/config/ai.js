/**
 * Gemini AI Client Configuration — Lazy Initialization
 *
 * WHY LAZY: In ES Modules, all static `import` statements are hoisted and
 * executed before any code in the importing module runs. This means this
 * file is initialized BEFORE `dotenv.config()` is called in server.js —
 * so process.env values are not yet populated at module load time.
 *
 * Solution: defer both validation and instantiation to the first call of
 * getGeminiModel(). By then, dotenv has been configured and env vars are
 * available. The result is cached in `genAI` for subsequent calls.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

/**
 * Returns a Gemini generative model instance.
 * Initializes the client on first call, then reuses it (singleton).
 *
 * @returns {GenerativeModel} Ready-to-use Gemini model
 */
export const getGeminiModel = (modelName = "gemini-2.5-flash") => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }

  // Initialize once, reuse on every subsequent call
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return genAI.getGenerativeModel({ model: modelName });
};

export default genAI;
