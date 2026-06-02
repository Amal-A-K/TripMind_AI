/**
 * Upload Routes
 *
 * POST /api/upload
 *   - Protected (requires JWT)
 *   - Accepts up to 5 files via multipart/form-data (field name: "files")
 *   - Triggers full extraction + AI pipeline
 */

import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import { uploadMultiple } from "../middlewares/upload.middleware.js";
import { uploadAndProcess } from "../controllers/upload.controller.js";

const router = Router();

// Middleware chain: auth guard → multer file parsing → controller
router.post("/", protect, uploadMultiple, uploadAndProcess);

export default router;
