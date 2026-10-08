import nodemailer from "nodemailer";
import { ENV } from "./env.js";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

// SMTP relay is preferred: it uses its own SMTP key and is not blocked by Brevo's "authorised IPs" list.
const useSmtp = () => Boolean(ENV.smtpUser && ENV.smtpKey);

export function isMailConfigured() {
  return Boolean(ENV.mailFrom && (useSmtp() || ENV.brevoApiKey));
}

export function mailTransportName() {
  return useSmtp() ? "smtp" : ENV.brevoApiKey ? "api" : "none";
}

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: ENV.smtpPort,
      secure: ENV.smtpPort === 465,
      auth: { user: ENV.smtpUser, pass: ENV.smtpKey },
    });
  }
  return transporter;
}

const toText = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// Sends one transactional email; returns the provider's message id.
export async function sendEmail({ to, subject, html, text }) {
  if (!isMailConfigured()) {
    throw new Error("Email is not configured: set MAIL_FROM plus BREVO_SMTP_USER and BREVO_SMTP_KEY (or BREVO_API_KEY).");
  }
  const recipients = Array.isArray(to) ? to : [to];
  if (useSmtp()) {
    const info = await getTransporter().sendMail({
      from: `"${ENV.mailFromName}" <${ENV.mailFrom}>`,
      to: recipients.join(", "),
      subject,
      html,
      text: text ?? toText(html),
    });
    return info.messageId ?? null;
  }
  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
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
    throw new Error(`Brevo rejected the email (${response.status}): ${detail}`);
  }
  const data = await response.json().catch(() => ({}));
  return data.messageId ?? null;
}

// Reads the remaining email credits from the Brevo account; needs the API key (credits are not visible over SMTP).
export async function getEmailCredits() {
  const base = { configured: isMailConfigured(), transport: mailTransportName(), credits: null, plan: null, account: null };
  if (!ENV.brevoApiKey) return base;
  const response = await fetch("https://api.brevo.com/v3/account", { headers: { "api-key": ENV.brevoApiKey, accept: "application/json" } });
  if (!response.ok) throw new Error(`Brevo account lookup failed (${response.status})`);
  const data = await response.json();
  const plans = Array.isArray(data.plan) ? data.plan : [];
  const plan = plans.find((p) => typeof p.credits === "number") ?? plans[0] ?? null;
  return { ...base, credits: plan?.credits ?? null, plan: plan?.type ?? null, account: data.email ?? null };
}
