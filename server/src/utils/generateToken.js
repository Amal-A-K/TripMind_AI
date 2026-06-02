/**
 * JWT Token Utility
 *
 * Encapsulates token generation logic so controllers stay clean.
 * Token payload is minimal — only the user ID is embedded.
 */

import jwt from "jsonwebtoken";

/**
 * @param {string} userId - MongoDB ObjectId of the authenticated user
 * @returns {string} Signed JWT token valid for 7 days
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export default generateToken;
