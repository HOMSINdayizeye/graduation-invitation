import mongoose from "mongoose";

// Lockout block for failed sign-ins, same shape as the cok_systems user model.
const accessControlSchema = new mongoose.Schema(
  {
    is_locked: { type: Boolean, default: false },
    reason: { type: String, default: null },
    last_login_attempt: { type: Number, default: 0 },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Never returned by default; queries that need the hash select it explicitly.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    access_control: { type: accessControlSchema, default: () => ({}) },
    last_signed_in: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// Shape sent to the client; it never includes the password hash.
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    lastSignedIn: this.last_signed_in,
  };
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
