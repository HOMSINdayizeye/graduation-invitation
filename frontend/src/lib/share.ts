import QRCode from "qrcode";

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
