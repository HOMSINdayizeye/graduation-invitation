import QRCode from "qrcode";
import { toPng } from "html-to-image";
import * as XLSX from "xlsx";

// Copies text with the async clipboard API, falling back to a hidden textarea for older or non-secure contexts.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fall through to the legacy path */ }
  try {
    const area = document.createElement("textarea");
    area.value = text; area.setAttribute("readonly", ""); area.style.position = "fixed"; area.style.opacity = "0";
    document.body.appendChild(area); area.select(); area.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch { return false; }
}

export const canShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

// Opens the phone's share sheet (WhatsApp, SMS, email); returns false when the user cancels or the API is missing.
export async function shareLink(data: { title: string; text: string; url: string }): Promise<boolean> {
  if (!canShare()) return false;
  try { await navigator.share(data); return true; } catch { return false; }
}

export const qrDataUrl = (text: string, width: number) => QRCode.toDataURL(text, { width, margin: 2, errorCorrectionLevel: "M", color: { dark: "#1f2a2a", light: "#ffffff" } });

// Builds a printable PNG: the QR code with the invitation details written underneath it.
export async function qrPosterBlob(link: string, lines: string[]): Promise<Blob> {
  const size = 1024, pad = 64, lineHeight = 52;
  const canvas = document.createElement("canvas");
  canvas.width = size + pad * 2;
  canvas.height = size + pad * 2 + lines.length * lineHeight + pad;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const img = new Image();
  img.src = await qrDataUrl(link, size);
  await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error("QR render failed")); });
  ctx.drawImage(img, pad, pad, size, size);
  ctx.fillStyle = "#1f2a2a"; ctx.textAlign = "center";
  lines.forEach((line, index) => {
    ctx.font = index === 0 ? "600 40px Georgia, serif" : "28px Arial, sans-serif";
    ctx.fillText(line, canvas.width / 2, size + pad * 2 + index * lineHeight + 20);
  });
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png"));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Shrinks an uploaded photo so it fits comfortably in localStorage and the API request.
export function shrinkImage(file: File, maxSide = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Unsupported image"));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// Renders the letter node to a PNG at 2x, using the template page colour as the backdrop.
export async function letterToPng(node: HTMLElement): Promise<Blob> {
  const page = node.closest<HTMLElement>(".public-invite");
  const backgroundColor = page ? getComputedStyle(page).backgroundColor : "#ffffff";
  // Rendering waits on image decoding, which browsers pause in hidden tabs, so give up instead of hanging forever.
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Rendering took too long. Keep this tab visible and try again.")), 30000));
  const dataUrl = await Promise.race([toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor }), timeout]);
  return (await fetch(dataUrl)).blob();
}

export const canShareFiles = () => typeof navigator !== "undefined" && typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] });

// Hands an image to the phone's share sheet; returns false when unsupported or cancelled.
export async function shareFile(blob: Blob, filename: string, title: string): Promise<boolean> {
  if (!canShareFiles()) return false;
  try { await navigator.share({ files: [new File([blob], filename, { type: blob.type })], title }); return true; } catch { return false; }
}

// Writes a UTF-8 CSV that Excel opens cleanly; phone numbers keep their leading zero.
export function downloadCsv(rows: (string | number)[][], filename: string) {
  const esc = (v: string | number) => { const t = String(v ?? ""); return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const csv = "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename);
}

export const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "guest";

export type GuestRow = { creator: string; graduate: string; date: string; ceremony: string; guest: string; phone: string; link: string };
type GuestSource = { id: string; email: string; graduate: { name: string; date: string }; ceremony: { name: string }; invitees: { id: string; name: string; phone: string }[] };

// Flattens invitations into one row per guest; the link is the guest's private invitation URL.
export const guestRows = (campaigns: GuestSource[], origin = window.location.origin): GuestRow[] =>
  campaigns.flatMap((c) => c.invitees.map((g) => ({ creator: c.email, graduate: c.graduate.name, date: c.graduate.date, ceremony: c.ceremony.name, guest: g.name, phone: g.phone, link: `${origin}/invite/${c.id}-${g.id}` })));

const HEADERS = ["Invited by", "Graduate", "Graduation date", "Ceremony", "Guest", "Phone", "Invitation link"];
const toCells = (r: GuestRow) => [r.creator, r.graduate, r.date, r.ceremony, r.guest, r.phone, r.link];
const sheetName = (name: string, index: number) => (name.replace(/[\\/?*[\]:]/g, " ").slice(0, 28) || "Group") + (index ? ` ${index + 1}` : "");

// One workbook: a sheet per group plus an "All guests" sheet when there are several groups. Phones stay text.
export function downloadExcel(groups: { name: string; rows: GuestRow[] }[], filename: string) {
  const book = XLSX.utils.book_new();
  const addSheet = (name: string, rows: GuestRow[]) => {
    const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows.map(toCells)]);
    sheet["!cols"] = [26, 24, 14, 26, 24, 14, 60].map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(book, sheet, name);
  };
  if (groups.length > 1) addSheet("All guests", groups.flatMap((g) => g.rows));
  groups.forEach((g, i) => addSheet(sheetName(g.name, i), g.rows));
  XLSX.writeFile(book, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

const escapeHtml = (v: string) => v.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch] as string));

// Opens a print-ready page with one table per group; the browser's print dialog saves it as PDF.
export function printGuestPdf(title: string, groups: { name: string; rows: GuestRow[] }[]): boolean {
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  const table = (rows: GuestRow[]) => `<table><thead><tr>${HEADERS.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${toCells(r).map((c) => `<td>${escapeHtml(String(c ?? ""))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>
    body { font-family: 'DM Sans', system-ui, sans-serif; color: #263334; margin: 32px; }
    h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 26px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 26px 0 8px; }
    .sub { color: #89928e; font-size: 12px; margin-bottom: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; } th, td { border: 1px solid #d8ddd8; padding: 6px 8px; text-align: left; vertical-align: top; word-break: break-all; }
    th { background: #f7f5f0; font-weight: 700; } @media print { body { margin: 0; } h2 { page-break-after: avoid; } }
  </style></head><body><h1>${escapeHtml(title)}</h1><div class="sub">Generated ${new Date().toLocaleString("en-GB")} · ${groups.length} group${groups.length === 1 ? "" : "s"} · ${total} guests</div>
  ${groups.map((g) => `<h2>${escapeHtml(g.name)} · ${g.rows.length} guest${g.rows.length === 1 ? "" : "s"}</h2>${table(g.rows)}`).join("")}</body></html>`;
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.open(); win.document.write(html); win.document.close(); win.focus();
  window.setTimeout(() => win.print(), 400);
  return true;
}
