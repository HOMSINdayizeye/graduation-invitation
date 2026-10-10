import mongoose from "mongoose";

// One row per piece of feedback left on a public invitation.
const feedbackSchema = new mongoose.Schema(
  {
    invitationId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    ip: { type: String, default: "" },
    status: { type: String, enum: ["new", "reviewed", "resolved", "rejected"], default: "new", index: true },
    adminNote: { type: String, default: "", trim: true, maxlength: 1000 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

feedbackSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    invitationId: this.invitationId,
    rating: this.rating,
    message: this.message,
    phone: this.phone,
    email: this.email,
    status: this.status,
    adminNote: this.adminNote,
    createdAt: this.created_at,
    updatedAt: this.updated_at,
  };
};

export const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);