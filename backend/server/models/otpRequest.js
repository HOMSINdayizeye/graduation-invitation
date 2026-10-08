import mongoose from "mongoose";

// One row per one-time code request: who asked, which template they were using, and what happened.
const otpRequestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    templateId: { type: String, default: "" },
    purpose: { type: String, enum: ["create", "view"], default: "create" },
    codeHash: { type: String, default: "" },
    status: { type: String, enum: ["sent", "verified", "bypassed", "failed"], default: "sent", index: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    error: { type: String, default: "" },
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

otpRequestSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    email: this.email,
    templateId: this.templateId,
    purpose: this.purpose,
    status: this.status,
    attempts: this.attempts,
    error: this.error,
    createdAt: this.created_at,
    verifiedAt: this.verifiedAt,
  };
};

export const OtpRequest = mongoose.models.OtpRequest || mongoose.model("OtpRequest", otpRequestSchema);
