/**
 * Extraction Orchestrator Service
 *
 * Routes each uploaded file to the correct extraction strategy:
 *   - PDF  → pdf.service.js
 *   - Image → ocr.service.js
 *
 * Returns the combined extracted text from all uploaded files.
 * This is the single entry point the upload controller calls —
 * it doesn't need to know which strategy was used.
 */

import extractTextFromPDF from "./pdf.service.js";
import extractTextFromImage from "./ocr.service.js";
import fs from "fs";

/**
 * Determine which extractor to use based on MIME type,
 * extract the text, then delete the temp file from disk.
 *
 * @param {Express.Multer.File} file - Multer file object
 * @returns {Promise<string>} Extracted text for this file
 */
const extractFromFile = async (file) => {
  let text = "";

  try {
    if (file.mimetype === "application/pdf") {
      text = await extractTextFromPDF(file.path);
    } else if (["image/jpeg", "image/png"].includes(file.mimetype)) {
      text = await extractTextFromImage(file.path);
    }
  } finally {
    // Clean up temp file after extraction regardless of success/failure
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
      console.log(`[Cleanup] Deleted temporary file: ${file.originalname}`);
    }
  }

  return text;
};

/**
 * Process all uploaded files and concatenate their text.
 *
 * @param {Express.Multer.File[]} files - Array of Multer file objects
 * @returns {Promise<string>} Combined extracted text from all files
 */
const extractTextFromFiles = async (files) => {
  const results = await Promise.all(files.map(extractFromFile));
  // Join text from each file with a clear separator
  return results.filter(Boolean).join("\n\n--- NEW DOCUMENT ---\n\n");
};

export default extractTextFromFiles;
