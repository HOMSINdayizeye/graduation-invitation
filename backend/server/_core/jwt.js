import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const JWT_EXPIRY = "24h";

// Signs the access token carrying the user id, email and role.
export function generateAccessToken(payload) {
  return jwt.sign(payload, ENV.jwtSecret, { expiresIn: JWT_EXPIRY });
}

// Returns { valid, decoded } or { valid, error } instead of throwing.
export function verifyAccessToken(token) {
  try {
    return { valid: true, decoded: jwt.verify(token, ENV.jwtSecret) };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Pulls the token out of an "Authorization: Bearer <token>" header.
export function extractToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}
