import { Router } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact { name, email, message }
// Sends you an email if SMTP_* env vars are set. If they aren't, it still
// "works" — the message is logged to the server console — so you can run and
// demo the form before wiring up real email.
router.post('/', async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim();
  const message = String(req.body?.message ?? '').trim();

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: 'Please include your name, email, and a message.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'That email address looks off.' });
  }
  if (message.length > 5000) {
    return res.status(400).json({ error: 'That message is a bit too long.' });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;

  // Not configured yet — log it and report success without delivery.
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('[contact] email not configured; message received:', {
      name,
      email,
      message,
    });
    return res.json({ ok: true, delivered: false });
  }

  try {
    const port = Number(SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Portfolio contact" <${SMTP_USER}>`,
      to: CONTACT_TO || SMTP_USER,
      replyTo: email,
      subject: `New message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    res.json({ ok: true, delivered: true });
  } catch (err) {
    console.error('[contact]', err);
    res
      .status(500)
      .json({ error: 'Could not send your message. Please try again later.' });
  }
});

export default router;
