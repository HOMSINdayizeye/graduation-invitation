import mongoose from "mongoose";

const venueSchema = new mongoose.Schema({ name: { type: String, default: "" }, location: { type: String, default: "" }, directions: { type: String, default: "" } }, { _id: false });
const inviteeSchema = new mongoose.Schema({ id: { type: String, required: true }, name: { type: String, default: "" }, phone: { type: String, default: "" } }, { _id: false });

// One created invitation set: the graduate's details plus every guest, so shared links work on any device.
const campaignSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    templateId: { type: String, default: "" },
    graduate: { name: { type: String, default: "" }, nickname: { type: String, default: "" }, phone: { type: String, default: "" }, email: { type: String, default: "" }, date: { type: String, default: "" }, message: { type: String, default: "" } },
    ceremony: { type: venueSchema, default: () => ({}) },
    celebration: { type: venueSchema, default: () => ({}) },
    invitees: { type: [inviteeSchema], default: [] },
    delivery: { type: String, enum: ["link", "qr", "both"], default: "both" },
    image: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// Guests only need names: phone numbers and the creator's email stay private.
campaignSchema.methods.toPublic = function toPublic() {
  return {
    id: this.key,
    email: "",
    templateId: this.templateId,
    graduate: { ...this.graduate, phone: "", email: "" },
    ceremony: this.ceremony,
    celebration: this.celebration,
    invitees: this.invitees.map((item) => ({ id: item.id, name: item.name, phone: "" })),
    delivery: this.delivery,
    image: this.image ?? null,
    createdAt: this.created_at?.toISOString?.() ?? "",
  };
};

// The creator's own view keeps every phone number so the guest list can be reviewed and exported.
campaignSchema.methods.toOwner = function toOwner() {
  return { ...this.toPublic(), email: this.email, graduate: { ...this.graduate }, invitees: this.invitees.map((item) => ({ id: item.id, name: item.name, phone: item.phone })) };
};

export const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);
