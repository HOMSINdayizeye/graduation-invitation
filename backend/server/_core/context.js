import { isDbConnected } from "../db.js";
import { User } from "../models/user.js";
import { extractToken, verifyAccessToken } from "./jwt.js";

// Reads the Bearer token, verifies it and loads the fresh user from MongoDB rather than trusting the payload.
export async function createContext(opts) {
  let user = null;
  const token = extractToken(opts.req.headers.authorization);
  if (token && isDbConnected()) {
    const verification = verifyAccessToken(token);
    if (verification.valid) {
      const doc = await User.findById(verification.decoded.id).catch(() => null);
      if (doc && !doc.access_control?.is_locked) user = doc.toPublic();
    }
  }
  return { req: opts.req, res: opts.res, user };
}
