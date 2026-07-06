import nodemailer from 'nodemailer';
import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/types/database.types';

/** Where contact submissions are delivered. Overridable via CONTACT_TO. */
const RECIPIENT = process.env.CONTACT_TO || 'info@goldenfuturetravel.com';

/**
 * Send the contact message to the business inbox over SMTP. Best-effort: a
 * missing/failed transport is logged but never fails the request, because the
 * message has already been stored in Supabase (the durable record of truth).
 */
async function sendContactEmail(msg: { name: string; email: string; phone: string; message: string }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[contact] SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS) — skipping email delivery.');
    return;
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host,
    port,
    // Implicit TLS on 465; STARTTLS on 587 and others.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user, pass },
  });

  const phoneLine = msg.phone ? `\nPhone: ${msg.phone}` : '';
  await transport.sendMail({
    // Envelope sender must be our own mailbox; the visitor's address goes in
    // Reply-To so a reply from the inbox goes straight back to them.
    from: `"Golden Future Travel" <${process.env.SMTP_FROM || user}>`,
    to: RECIPIENT,
    replyTo: `"${msg.name}" <${msg.email}>`,
    subject: `New contact message from ${msg.name}`,
    text: `Name: ${msg.name}\nEmail: ${msg.email}${phoneLine}\n\nMessage:\n${msg.message}`,
    html:
      `<h2>New contact message</h2>` +
      `<p><strong>Name:</strong> ${msg.name}</p>` +
      `<p><strong>Email:</strong> <a href="mailto:${msg.email}">${msg.email}</a></p>` +
      (msg.phone ? `<p><strong>Phone:</strong> ${msg.phone}</p>` : '') +
      `<p><strong>Message:</strong></p><p>${msg.message.replace(/\n/g, '<br>')}</p>`,
  });
}

/** POST /api/contact — store a contact message and email it to the business inbox. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const phone = String(body?.phone ?? '').trim();
  const message = String(body?.message ?? '').trim();

  if (!name || !email || !message) {
    throw createError({ statusCode: 400, statusMessage: 'name, email and message are required' });
  }

  const client = await serverSupabaseClient<Database>(event);
  const { error } = await client
    .from('contact_messages')
    .insert({ name, email, phone: phone || null, message });

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });

  // Best-effort email notification — never blocks the successful response.
  try {
    await sendContactEmail({ name, email, phone, message });
  } catch (err) {
    console.error('[contact] Failed to send email notification:', err);
  }

  return { ok: true };
});
