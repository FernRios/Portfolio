import type { Context } from "@netlify/functions";
import nodemailer from "nodemailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const message = String(body?.message ?? "").trim();

  if (!name || !email || !message)
    return Response.json({ error: "Please include your name, email, and a message." }, { status: 400 });
  if (!EMAIL_RE.test(email))
    return Response.json({ error: "That email address looks off." }, { status: 400 });
  if (message.length > 5000)
    return Response.json({ error: "That message is a bit too long." }, { status: 400 });

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;

  // Not configured yet -> log and report success without delivery.
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log("[contact] email not configured; message received:", { name, email, message });
    return Response.json({ ok: true, delivered: false });
  }

  try {
    const port = Number(SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST, port, secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"Portfolio contact" <${SMTP_USER}>`,
      to: CONTACT_TO || SMTP_USER,
      replyTo: email,
      subject: `New message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });
    return Response.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[contact]", err);
    return Response.json({ error: "Could not send your message. Please try again later." }, { status: 500 });
  }
};