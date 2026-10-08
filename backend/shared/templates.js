// Built-in invitation styles. The id, CSS class and monogram are fixed (they map to styles in index.css);
// name, subtitle, accent, sample name and the active flag are editable by admins and stored in MongoDB.
export const DEFAULT_TEMPLATES = [
  { id: "terracotta", name: "Terracotta Toast", subtitle: "Warm, editorial and full of character", className: "template-terracotta", accent: "#d76b4f", monogram: "H", sampleName: "Homsi NDAYIZEYE", sampleImage: "", active: true, sortOrder: 1 },
  { id: "midnight", name: "Midnight Ceremony", subtitle: "A polished evening invitation", className: "template-midnight", accent: "#96c7c0", monogram: "J", sampleName: "Denis Niyonzima", sampleImage: "", active: true, sortOrder: 2 },
  { id: "garden", name: "Garden Gathering", subtitle: "Fresh, joyful and personal", className: "template-garden", accent: "#799c70", monogram: "M", sampleName: "Iradukunda Florence", sampleImage: "", active: true, sortOrder: 3 },
  { id: "voyage", name: "Bold Horizon", subtitle: "Bright, confident and modern", className: "template-voyage", accent: "#f08a3c", monogram: "D", sampleName: "Osuald Iradukunda", sampleImage: "/templates/voyage-sample.svg", active: true, sortOrder: 4 },
  { id: "classic", name: "Classic Celebration", subtitle: "A timeless, elegant invitation", className: "template-classic", accent: "#8b4513", monogram: "F", sampleName: "Frank Murenzi", sampleImage: "", active: true, sortOrder: 5 },
  { id: "sunset", name: "Sunset Serenade", subtitle: "Warm, romantic and intimate", className: "template-sunset", accent: "#ff6b35", monogram: "S", sampleName: "Serge SINGIZWA", sampleImage: "/templates/voyage-sample.svg", active: true, sortOrder: 6 },
  { id: "modern", name: "Modern Minimal", subtitle: "Clean, contemporary and versatile", className: "template-modern", accent: "#4a90e2", monogram: "M", sampleName: "TUYISENGE Monchel", sampleImage: "/templates/voyage-sample.svg", active: true, sortOrder: 7 },
  { id: "playful", name: "Playful Pop", subtitle: "Fun, colorful and cheerful", className: "template-playful", accent: "#f5a623", monogram: "O", sampleName: "Obed Ishimwe", sampleImage: "/templates/voyage-sample.svg", active: true, sortOrder: 8 },
];
