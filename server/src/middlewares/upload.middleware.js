/**
 * Multer Upload Middleware
 *
 * Handles multipart/form-data file uploads.
 * - Accepts PDF, JPG, PNG only
 * - Stores files temporarily in /uploads (cleaned up after processing)
 * - Limits file size to 10MB per file
 * - Allows up to 5 files per request (e.g., flight + hotel + visa PDFs)
 */

import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists at startup
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Prefix with timestamp to avoid filename collisions
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("Only PDF, JPG, and PNG files are allowed");
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// Named export: upload.multiple — used in the upload route
export const uploadMultiple = upload.array("files", 5);

export default upload;
