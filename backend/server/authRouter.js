import bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env.js";
import { generateAccessToken } from "./_core/jwt.js";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc.js";
import { isDbConnected } from "./db.js";
import { User } from "./models/user.js";

const SALT_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MESSAGE =
  "Account locked due to too many failed login attempts. Please contact the administrator to unlock your account.";

const emailField = z.string().trim().toLowerCase().email("Enter a valid email address");
const passwordField = z.string().min(8, "Password must be at least 8 characters");

// Every auth call needs MongoDB; fail with a clear message instead of a timeout.
function requireDb() {
  if (!isDbConnected()) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Database is not connected. Set MONGODB_URI and restart the server.",
    });
  }
}

// Token plus the public user shape; register and login return the same payload.
function session(user) {
  const token = generateAccessToken({ id: user._id.toString(), email: user.email, role: user.role });
  return { token, user: user.toPublic() };
}

// Counts a failed attempt and locks the account at the limit, like the cok_systems login.
async function recordFailedAttempt(user) {
  const attempts = (user.access_control.last_login_attempt || 0) + 1;
  user.access_control.last_login_attempt = attempts;
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    user.access_control.is_locked = true;
    user.access_control.reason = `Account locked after ${MAX_LOGIN_ATTEMPTS} failed login attempts`;
  }
  await user.save();
  return attempts;
}

export const authRouter = router({
  register: publicProcedure
    .input(z.object({ name: z.string().trim().min(2, "Enter your full name"), email: emailField, password: passwordField }))
    .mutation(async ({ input }) => {
      requireDb();
      const existing = await User.findOne({ email: input.email });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists. Sign in instead." });
      }
      const password = await bcrypt.hash(input.password, SALT_ROUNDS);
      // The address in ADMIN_EMAIL becomes the administrator; everyone else is a regular user.
      const role = ENV.adminEmail && input.email === ENV.adminEmail ? "admin" : "user";
      const user = await User.create({ name: input.name, email: input.email, password, role, last_signed_in: new Date() });
      return session(user);
    }),

  login: publicProcedure
    .input(z.object({ email: emailField, password: z.string().min(1, "Password is required") }))
    .mutation(async ({ input }) => {
      requireDb();
      const user = await User.findOne({ email: input.email }).select("+password");
      if (user?.access_control?.is_locked) {
        throw new TRPCError({ code: "FORBIDDEN", message: LOCK_MESSAGE });
      }
      const matches = user ? await bcrypt.compare(input.password.trim(), user.password) : false;
      if (!matches) {
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        const attempts = await recordFailedAttempt(user);
        const left = MAX_LOGIN_ATTEMPTS - attempts;
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: left > 0 ? `Invalid email or password. ${left} attempt${left === 1 ? "" : "s"} left before the account is locked.` : LOCK_MESSAGE,
        });
      }
      user.access_control.last_login_attempt = 0;
      user.last_signed_in = new Date();
      await user.save();
      return session(user);
    }),

  me: publicProcedure.query(({ ctx }) => ctx.user),

  // Tokens are stateless; the client discards its copy. Kept so the frontend hook has one call to make.
  logout: publicProcedure.mutation(() => ({ success: true })),

  changePassword: protectedProcedure
    .input(z.object({ currentPassword: z.string().min(1, "Current password is required"), newPassword: passwordField }))
    .mutation(async ({ ctx, input }) => {
      requireDb();
      const user = await User.findById(ctx.user.id).select("+password");
      if (!user || !(await bcrypt.compare(input.currentPassword, user.password))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect." });
      }
      user.password = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
      await user.save();
      return { success: true };
    }),
});
