/**
 * PDF Extraction Service
 *
 * Uses pdf-parse v2.x to extract raw text from PDF files.
 *
 * v2 API CHANGE (breaking from v1):
 *   v1: const pdfParse = require('pdf-parse'); await pdfParse(buffer)  ← function, REMOVED
 *   v2: const { PDFParse } = require('pdf-parse');                      ← named class
 *       new PDFParse({ data: buffer }) then await parser.getText()
 *
 * ESM note: pdf-parse ships CJS only. createRequire bridges CJS → ESM
 * without downgrading the entire project.
 */

import { createRequire } from "module";
import fs from "fs";

// Bridge: use Node's CJS require() inside an ESM file
const require = createRequire(import.meta.url);

// v2.x: destructure the named PDFParse class — require() returns an object, NOT a function
const { PDFParse } = require("pdf-parse");

console.log("[pdf.service] typeof PDFParse:", typeof PDFParse); // should be "function" (class)

/**
 * Extract text from a PDF file on disk.
 *
 * @param {string} filePath - Absolute or relative path to the PDF file
 * @returns {Promise<string>} Extracted plain text
 */
const extractTextFromPDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);

  // v2 API: pass buffer via { data: ... } in the constructor
  const parser = new PDFParse({ data: dataBuffer, verbosity: 0 });

  try {
    const result = await parser.getText();

    // Debug logs
    const text = result.text?.trim() ?? "";
    console.log(`[pdf.service] Extracted text length: ${text.length} characters`);
    console.log(`[pdf.service] First 200 chars: ${text.substring(0, 200)}`);

    return text;
  } finally {
    // Always free memory — required by v2 API
    await parser.destroy();
  }
};

export default extractTextFromPDF;

