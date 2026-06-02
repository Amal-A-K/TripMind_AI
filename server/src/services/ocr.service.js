/**
 * OCR Extraction Service
 *
 * Uses Tesseract.js to perform Optical Character Recognition on
 * image files (JPG, PNG). Extracts printed text from scanned
 * boarding passes, hotel vouchers, visa documents, etc.
 *
 * Architecture note: Tesseract.js v4+ uses a worker-based API.
 * We create a worker, run recognition, then terminate to free memory.
 */

import Tesseract from "tesseract.js";

/**
 * Extract text from an image file using OCR.
 *
 * @param {string} filePath - Absolute or relative path to the image file
 * @returns {Promise<string>} Recognized plain text from the image
 */
const extractTextFromImage = async (filePath) => {
  const worker = await Tesseract.createWorker("eng");

  try {
    const { data } = await worker.recognize(filePath);
    return data.text.trim();
  } finally {
    // Always terminate the worker to prevent memory leaks
    await worker.terminate();
  }
};

export default extractTextFromImage;
