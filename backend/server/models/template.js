import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    className: { type: String, required: true },
    accent: { type: String, default: "#d76b4f" },
    monogram: { type: String, default: "G" },
    sampleName: { type: String, default: "", trim: true },
    sampleImage: { type: String, default: "" },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// Same shape as DEFAULT_TEMPLATES so the frontend can use either source.
templateSchema.methods.toPublic = function toPublic() {
  return {
    id: this.key,
    name: this.name,
    subtitle: this.subtitle,
    className: this.className,
    accent: this.accent,
    monogram: this.monogram,
    sampleName: this.sampleName,
    sampleImage: this.sampleImage,
    active: this.active,
    sortOrder: this.sortOrder,
  };
};

export const Template = mongoose.models.Template || mongoose.model("Template", templateSchema);
