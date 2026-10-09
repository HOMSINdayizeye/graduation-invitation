import nodemailer from "nodemailer";
import { ENV } from "./env.js";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
// Hosted platforms often throttle or block SMTP, so every attempt is capped instead of nodemailer's 2-minute default.
const API_TIMEOUT_MS = 10000;
const SMTP_TIMEOUT_MS = 10000;

const hasSmtp = () => Boolean(ENV.smtpUser && ENV.smtpKey);
const hasApi = () => Boolean(ENV.brevoApiKey);

export function isMailConfigured() {
  return Boolean(ENV.mailFrom && (hasSmtp() || hasApi()));
}

export function mailTransportName() {
  if (hasApi() && hasSmtp()) return "api+smtp";
  return hasApi() ? "api" : hasSmtp() ? "smtp" : "none";
}

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: ENV.smtpPort,
      secure: ENV.smtpPort === 465,
      auth: { user: ENV.smtpUser, pass: ENV.smtpKey },
      pool: true,
      maxConnections: 2,
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS * 2,
    });
  }
  return transporter;
}

const toText = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

async function sendViaApi({ recipients, subject, html, text }) {
  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
    headers: { "api-key": ENV.brevoApiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: ENV.mailFrom, name: ENV.mailFromName },
      to: recipients.map((email) => ({ email })),
      subject,
      htmlContent: html,
      textContent: text ?? toText(html),
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Brevo API rejected the email (${response.status}): ${detail.slice(0, 200)}`);
  }
  const data = await response.json().catch(() => ({}));
  return data.messageId ?? null;
}

async function sendViaSmtp({ recipients, subject, html, text }) {
  const info = await getTransporter().sendMail({
    from: `"${ENV.mailFromName}" <${ENV.mailFrom}>`,
    to: recipients.join(", "),
    subject,
    html,
    text: text ?? toText(html),
  });
  return info.messageId ?? null;
}

// Sends one transactional email over HTTPS first (fast, works where SMTP is blocked) and falls back to SMTP.
export async function sendEmail({ to, subject, html, text }) {
  if (!isMailConfigured()) {
    throw new Error("Email is not configured: set MAIL_FROM plus BREVO_API_KEY and/or BREVO_SMTP_USER with BREVO_SMTP_KEY.");
  }
  const message = { recipients: Array.isArray(to) ? to : [to], subject, html, text };
  const attempts = [hasApi() && ["api", sendViaApi], hasSmtp() && ["smtp", sendViaSmtp]].filter(Boolean);
  const errors = [];
  for (const [name, send] of attempts) {
    const started = Date.now();
    try {
      const id = await send(message);
      console.log(`[mail] sent via ${name} in ${Date.now() - started}ms`);
      return id;
    } catch (error) {
      const detail = String(error?.message ?? error);
      console.error(`[mail] ${name} failed after ${Date.now() - started}ms: ${detail}`);
      errors.push(`${name}: ${detail}`);
    }
  }
  throw new Error(errors.join(" | "));
}

// Reads the remaining email credits from the Brevo account; needs the API key (credits are not visible over SMTP).
export async function getEmailCredits() {
  const base = { configured: isMailConfigured(), transport: mailTransportName(), credits: null, plan: null, account: null };
  if (!ENV.brevoApiKey) return base;
  const response = await fetch("https://api.brevo.com/v3/account", { signal: AbortSignal.timeout(API_TIMEOUT_MS), headers: { "api-key": ENV.brevoApiKey, accept: "application/json" } });
  if (!response.ok) throw new Error(`Brevo account lookup failed (${response.status})`);
  const data = await response.json();
  const plans = Array.isArray(data.plan) ? data.plan : [];
  const plan = plans.find((p) => typeof p.credits === "number") ?? plans[0] ?? null;
  return { ...base, credits: plan?.credits ?? null, plan: plan?.type ?? null, account: data.email ?? null };
}
