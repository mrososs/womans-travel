import nodemailer from 'nodemailer';

/**
 * SMTP mailer shared by the server API. Configured via the same env vars as the
 * contact form (SMTP_HOST / SMTP_USER / SMTP_PASS / SMTP_PORT / SMTP_SECURE /
 * SMTP_FROM). All sends are best-effort: when SMTP isn't configured we log and
 * no-op instead of throwing, so email delivery never blocks the core action.
 */

const BRAND = 'رحلات المستقبل الذهبي';

/** Build a transport from env, or null when SMTP is not configured. */
function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host,
    port,
    // Implicit TLS on 465; STARTTLS on 587 and others.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user, pass },
  });
}

/** Low-level send. Returns false (and logs) when SMTP isn't configured. */
export async function sendMail(opts: { to: string; subject: string; text: string; html: string }) {
  const transport = getTransport();
  if (!transport) {
    console.warn('[mailer] SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS) — skipping email delivery.');
    return false;
  }
  await transport.sendMail({
    from: `"${BRAND}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
  return true;
}

const nf = new Intl.NumberFormat('en-US');

/**
 * Confirmation email sent when an admin approves a bank transfer. Tells the
 * customer the payment was received and the trip is successfully booked.
 */
export async function sendBookingConfirmedEmail(params: {
  to: string;
  orderId: string;
  total: number;
  currency: string;
  items?: string;
}) {
  const ref = params.orderId.slice(0, 8);
  const amount = `${nf.format(params.total)} ${params.currency}`;
  const items = params.items ? `\nالرحلة/الباقة: ${params.items}` : '';

  const text =
    `أهلاً بكِ،\n\n` +
    `تم استلام مبلغ التحويل البنكي بنجاح وتأكيد حجزكِ لدى ${BRAND}.\n\n` +
    `رقم الطلب: ${ref}\n` +
    `المبلغ المدفوع: ${amount}${items}\n\n` +
    `نتطلّع لرحلةٍ استثنائية بصحبتكِ.\n${BRAND}`;

  const html =
    `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;color:#2b2b3a;line-height:1.8">` +
    `<h2 style="color:#b8860b;margin:0 0 12px">تم تأكيد حجزكِ 🎉</h2>` +
    `<p>أهلاً بكِ،</p>` +
    `<p>تم استلام مبلغ <strong>التحويل البنكي</strong> بنجاح وتأكيد حجزكِ لدى ${BRAND}.</p>` +
    `<table style="border-collapse:collapse;margin:16px 0">` +
    `<tr><td style="padding:6px 12px;color:#777">رقم الطلب</td><td style="padding:6px 12px"><strong>${ref}</strong></td></tr>` +
    `<tr><td style="padding:6px 12px;color:#777">المبلغ المدفوع</td><td style="padding:6px 12px"><strong>${amount}</strong></td></tr>` +
    (params.items
      ? `<tr><td style="padding:6px 12px;color:#777">الرحلة/الباقة</td><td style="padding:6px 12px">${params.items}</td></tr>`
      : '') +
    `</table>` +
    `<p>نتطلّع لرحلةٍ استثنائية بصحبتكِ.</p>` +
    `<p style="color:#b8860b;font-weight:bold">${BRAND}</p>` +
    `</div>`;

  return sendMail({
    to: params.to,
    subject: `تم تأكيد حجزكِ لدى ${BRAND} — طلب ${ref}`,
    text,
    html,
  });
}
