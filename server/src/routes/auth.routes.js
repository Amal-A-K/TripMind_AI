import { Router } from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
} from "../controllers/auth.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getMe);

export default router;
