import mongoose from "mongoose";

// A single settings document (key "app") holds the admin switches.
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "app" },
    otpRequired: { type: Boolean, default: true },
    allowWithoutOtpWhenEmailExhausted: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

settingSchema.methods.toPublic = function toPublic() {
  return {
    otpRequired: this.otpRequired,
    allowWithoutOtpWhenEmailExhausted: this.allowWithoutOtpWhenEmailExhausted,
    updatedAt: this.updated_at,
  };
};

export const Setting = mongoose.models.Setting || mongoose.model("Setting", settingSchema);

// Returns the settings document, creating it with defaults the first time.
export async function getSettings() {
  return (await Setting.findOne({ key: "app" })) || Setting.create({ key: "app" });
}
