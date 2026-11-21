import nodemailer from 'nodemailer';
import { formatPrice } from './utils';

export interface EmailLogEntry {
  id: string;
  type: 'order_confirmation' | 'password_reset' | 'test_email';
  recipient: string;
  subject: string;
  status: 'sent' | 'simulated' | 'failed';
  error?: string;
  timestamp: string;
  previewUrl?: string;
}

// In-memory log of recent email notifications (accessible to Admin)
export const EMAIL_LOGS: EmailLogEntry[] = [];

function recordLog(entry: Omit<EmailLogEntry, 'id' | 'timestamp'>) {
  const log: EmailLogEntry = {
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...entry,
    timestamp: new Date().toISOString(),
  };
  EMAIL_LOGS.unshift(log);
  if (EMAIL_LOGS.length > 50) EMAIL_LOGS.pop();
  return log;
}

export function getEmailNotificationLogs(): EmailLogEntry[] {
  return EMAIL_LOGS;
}

// Get SMTP Configuration
export function getEmailConfig() {
  const user = process.env.SMTP_USER || process.env.ADMIN_EMAIL || 'niloratrends@gmail.com';
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '';
  const host = process.env.SMTP_HOST || (user.endsWith('@gmail.com') ? 'smtp.gmail.com' : 'smtp.gmail.com');
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || `"Nilora Trends Atelier" <${user}>`;
  const resendApiKey = process.env.RESEND_API_KEY || '';

  const isConfigured = Boolean(pass || resendApiKey);

  return {
    user,
    pass,
    host,
    port,
    secure,
    from,
    resendApiKey,
    isConfigured,
  };
}

// Create Nodemailer Transporter
function createTransporter() {
  const config = getEmailConfig();
  if (!config.pass) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Universal email dispatcher
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  type = 'test_email',
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  type?: 'order_confirmation' | 'password_reset' | 'test_email';
}): Promise<{ success: boolean; mode: 'smtp' | 'resend' | 'simulated'; messageId?: string; error?: string }> {
  const config = getEmailConfig();

  // 1. Try Resend API if configured
  if (config.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.from,
          to: [to],
          subject,
          html,
          text,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        recordLog({ type, recipient: to, subject, status: 'sent' });
        return { success: true, mode: 'resend', messageId: data.id };
      }
      console.warn('Resend API notice:', data);
    } catch (err: any) {
      console.warn('Resend dispatch error:', err.message);
    }
  }

  // 2. Try SMTP via Nodemailer
  const transporter = createTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: config.from,
        to,
        subject,
        html,
        text,
      });

      recordLog({ type, recipient: to, subject, status: 'sent' });
      return { success: true, mode: 'smtp', messageId: info.messageId };
    } catch (err: any) {
      console.error('SMTP email error:', err);
      recordLog({ type, recipient: to, subject, status: 'failed', error: err.message });
      return { success: false, mode: 'smtp', error: err.message };
    }
  }

  // 3. Fallback: Simulated mode (when SMTP password is not set yet in .env.local)
  console.log(`\n======================================================`);
  console.log(`[EMAIL NOTIFICATION DISPATCHED (${type.toUpperCase()})]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Mode: Simulated (Add SMTP_PASSWORD in .env.local to enable live dispatch)`);
  console.log(`======================================================\n`);

  recordLog({
    type,
    recipient: to,
    subject,
    status: 'simulated',
  });

  return {
    success: true,
    mode: 'simulated',
    messageId: `sim-${Date.now()}`,
  };
}

/**
 * Send Luxury Order Confirmation Email
 */
export async function sendOrderConfirmationEmail(order: any): Promise<{ success: boolean; mode: string; error?: string }> {
  const shipping = order?.shipping_address_snapshot || {};
  const recipientEmail = shipping.email || order?.customer_email || order?.user_email;
  const customerName = shipping.fullName || 'Valued Patron';
  const orderNumber = order?.order_number || order?.id || 'NT-ORDER';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const orderUrl = `${siteUrl}/order-success/${orderNumber}`;

  if (!recipientEmail) {
    console.warn(`Cannot send order confirmation: No recipient email for order #${orderNumber}`);
    return { success: false, mode: 'none', error: 'No recipient email on order.' };
  }

  const items = order?.items || order?.order_items || [];
  const itemsSubtotal = items.reduce(
    (acc: number, it: any) =>
      acc + (Number(it.line_total) || Number(it.unit_price_snapshot) * Number(it.quantity) || 0),
    0
  );
  const subtotal = Number(order?.subtotal) || itemsSubtotal;
  const shippingFee = Number(order?.shipping_fee) || 0;
  const discountAmount = Number(order?.discount_amount) || 0;
  const totalAmount = Number(order?.total_amount) || Math.max(0, subtotal - discountAmount + shippingFee);

  const tracking = order?.tracking || {
    carrier: 'Delhivery Boutique Express',
    tracking_number: `NT-DEL-${orderNumber.replace('NT-', '')}`,
    estimated_delivery: 'Within 4-5 business days',
  };

  const itemsHtml = items
    .map(
      (item: any) => `
      <tr style="border-bottom: 1px solid #FAF7F2;">
        <td style="padding: 12px 0;">
          <strong style="color: #392820; font-size: 13px;">${item.product_name_snapshot || 'Boutique Attire'}</strong>
          <div style="color: #735D50; font-size: 11px; margin-top: 2px;">
            Size: ${item.size_snapshot || 'M'} &bull; Qty: ${item.quantity || 1}
          </div>
        </td>
        <td style="padding: 12px 0; text-align: right; color: #392820; font-weight: bold; font-size: 13px;">
          ${formatPrice(item.line_total || item.unit_price_snapshot * item.quantity)}
        </td>
      </tr>
    `
    )
    .join('');

  const subject = `✨ Confirmed Order: Nilora Trends #${orderNumber}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 24px; color: #392820; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #E8D6C7; padding: 36px 32px; box-shadow: 0 4px 20px rgba(57, 40, 32, 0.05); }
        .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #FAF7F2; }
        .badge { display: inline-block; background: #E6F4EA; color: #137333; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px; }
        .title { font-family: Georgia, serif; font-size: 26px; color: #392820; margin: 0 0 4px 0; }
        .subtitle { font-size: 12px; color: #735D50; margin: 0; }
        .ref { font-family: monospace; color: #D9A08C; font-weight: bold; }
        .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #735D50; margin: 24px 0 8px 0; }
        .info-box { background: #FAF7F2; border: 1px solid #E8D6C7; border-radius: 16px; padding: 14px 18px; margin: 12px 0; font-size: 12px; }
        .totals-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; color: #735D50; }
        .totals-table td { padding: 6px 0; }
        .total-row { border-top: 1px solid #E8D6C7; font-size: 15px; font-weight: bold; color: #392820; }
        .btn { display: block; width: 100%; max-width: 280px; margin: 28px auto 12px auto; text-align: center; background: #392820; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; }
        .footer { text-align: center; font-size: 11px; color: #8A7A70; margin-top: 24px; padding-top: 16px; border-top: 1px solid #FAF7F2; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div style="font-family: Georgia, serif; font-size: 28px; font-weight: bold; color: #392820; margin-bottom: 2px;">
            Thank You
          </div>
          <div style="font-size: 12px; color: #735D50; margin-bottom: 14px;">by Nilora</div>
          <div class="badge">&#10003; Confirmed Order</div>
          <h1 class="title">Your order is confirmed</h1>
          <p class="subtitle">Order Reference: <span class="ref">#${orderNumber}</span></p>
          <p style="font-size: 12px; color: #735D50; margin-top: 6px;">Your order is confirmed by Nilora Trends atelier.</p>
        </div>

        <div class="info-box">
          <strong style="color: #392820; display: block; margin-bottom: 4px;">Delivery &amp; Courier Details</strong>
          <div>Partner: <strong>${tracking.carrier}</strong></div>
          <div>Tracking AWB: <span class="ref">${tracking.tracking_number}</span></div>
          <div>Estimated Delivery: <strong>${tracking.estimated_delivery}</strong></div>
        </div>

        <div class="info-box">
          <strong style="color: #392820; display: block; margin-bottom: 4px;">Delivery Address</strong>
          <div><strong>${customerName}</strong></div>
          <div>${shipping.addressLine1 || ''} ${shipping.addressLine2 ? ', ' + shipping.addressLine2 : ''}</div>
          <div>${shipping.city || ''}, ${shipping.state || ''} - ${shipping.pincode || ''}</div>
          <div>Phone: +91 ${shipping.phone || ''}</div>
        </div>

        <div class="section-title">Ordered Pieces</div>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
        </table>

        <div class="section-title">Total Final Amount</div>
        <table class="totals-table">
          <tr>
            <td>Product Amount (${items.length} ${items.length === 1 ? 'piece' : 'pieces'})</td>
            <td style="text-align: right; font-weight: 600; color: #392820;">${formatPrice(subtotal)}</td>
          </tr>
          <tr>
            <td>Shipping &amp; Delivery Details</td>
            <td style="text-align: right; color: #392820;">${shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}</td>
          </tr>
          ${
            discountAmount > 0
              ? `
          <tr style="color: #137333;">
            <td>Coupon Discount</td>
            <td style="text-align: right;">-${formatPrice(discountAmount)}</td>
          </tr>
          `
              : ''
          }
          <tr class="total-row">
            <td style="padding-top: 10px;">Total Final Amount<br><span style="font-size: 10px; font-weight: normal; color: #735D50;">${order?.payment_method === 'cod' ? 'Payable on Delivery' : 'Total Paid'}</span></td>
            <td style="text-align: right; padding-top: 10px; font-size: 18px; font-family: Georgia, serif;">${formatPrice(totalAmount)}</td>
          </tr>
        </table>

        <a href="${orderUrl}" class="btn">View Order Online &rarr;</a>

        <div class="footer">
          <p>Questions about your ensemble? Reach our concierge on WhatsApp at <strong>+91 82481 55545</strong> or email <strong>niloratrends@gmail.com</strong>.</p>
          <p>&copy; ${new Date().getFullYear()} Nilora Trends Atelier. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Thank You by Nilora
Confirmed Order: #${orderNumber}

Your order is confirmed by Nilora Trends atelier.

Recipient: ${customerName}
Delivery Address: ${shipping.addressLine1 || ''}, ${shipping.city || ''} - ${shipping.pincode || ''}
Carrier: ${tracking.carrier} (AWB: ${tracking.tracking_number})
Estimated Delivery: ${tracking.estimated_delivery}

Product Amount: ${formatPrice(subtotal)}
Shipping Details: ${shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}
Total Final Amount: ${formatPrice(totalAmount)} (${order?.payment_method === 'cod' ? 'Payable on Delivery' : 'Total Paid'})

View order online: ${orderUrl}

Concierge WhatsApp: +91 82481 55545 | Email: niloratrends@gmail.com
  `.trim();

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
    type: 'order_confirmation',
  });
}

/**
 * Send Luxury Password Reset Email
 */
export async function sendPasswordResetEmail({
  email,
  resetUrl,
  customerName = 'Valued Patron',
}: {
  email: string;
  resetUrl: string;
  customerName?: string;
}): Promise<{ success: boolean; mode: string; error?: string }> {
  const subject = `🔒 Reset Your Password — Nilora Trends`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 24px; color: #392820; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #E8D6C7; padding: 36px 32px; box-shadow: 0 4px 20px rgba(57, 40, 32, 0.05); }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #FAF7F2; }
        .logo { font-family: Georgia, serif; font-size: 26px; font-weight: bold; color: #392820; margin-bottom: 4px; }
        .tagline { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #D9A08C; }
        .content { padding: 24px 0; font-size: 13px; line-height: 1.6; color: #735D50; }
        .content p { margin: 12px 0; }
        .btn { display: block; width: 100%; max-width: 260px; margin: 28px auto; text-align: center; background: #392820; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; }
        .footer { text-align: center; font-size: 11px; color: #8A7A70; margin-top: 24px; padding-top: 16px; border-top: 1px solid #FAF7F2; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">Nilora Trends</div>
          <div class="tagline">Indian Artisanal Atelier</div>
        </div>

        <div class="content">
          <p><strong style="color: #392820;">Hello ${customerName},</strong></p>
          <p>We received a request to reset the password for your Nilora Trends account (<strong>${email}</strong>).</p>
          <p>Please click the button below to securely set a new password for your account:</p>

          <a href="${resetUrl}" class="btn">Reset Password &rarr;</a>

          <p style="font-size: 11px; color: #8A7A70;">
            This link is secure and valid for <strong>1 hour</strong>. If the button above does not open, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #D9A08C; word-break: break-all;">${resetUrl}</a>
          </p>

          <p style="font-size: 11px; color: #8A7A70; margin-top: 20px;">
            If you did not make this request, you can safely ignore this email. Your current password will remain completely secure.
          </p>
        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Nilora Trends. Handcrafted Luxury Indian Wear.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Nilora Trends — Password Reset Request

Hello ${customerName},

We received a request to reset the password for your Nilora Trends account (${email}).

Reset your password here:
${resetUrl}

This link is valid for 1 hour. If you did not request this, you can safely ignore this email.

Nilora Trends Atelier
  `.trim();

  return sendEmail({
    to: email,
    subject,
    html,
    text,
    type: 'password_reset',
  });
}
