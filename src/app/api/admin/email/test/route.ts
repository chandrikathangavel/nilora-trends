import { NextRequest, NextResponse } from 'next/server';
import { getEmailConfig, getEmailNotificationLogs, sendEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    const config = getEmailConfig();
    const logs = getEmailNotificationLogs();

    return NextResponse.json({
      success: true,
      configuration: {
        user: config.user,
        host: config.host,
        port: config.port,
        secure: config.secure,
        from: config.from,
        isConfigured: config.isConfigured,
        hasPassword: Boolean(config.pass),
        hasResendApiKey: Boolean(config.resendApiKey),
      },
      recentLogs: logs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { to = 'niloratrends@gmail.com' } = body;

    const testSubject = '✨ Nilora Trends — Atelier Email Notification Test';
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF7F2; padding: 24px; color: #392820;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #E8D6C7; padding: 32px;">
          <h2 style="font-family: Georgia, serif; color: #392820; margin-top: 0;">Nilora Trends Email Test</h2>
          <p style="color: #735D50; font-size: 14px;">This is a test notification verifying that the automated email dispatcher is working correctly.</p>
          <div style="background: #E6F4EA; color: #137333; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">
            &#10003; Email Delivery Service Online
          </div>
          <p style="color: #8A7A70; font-size: 12px; margin-top: 24px;">Sent at: ${new Date().toLocaleString('en-IN')}</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to,
      subject: testSubject,
      html: testHtml,
      text: 'Nilora Trends email test. Automated email delivery service is operational.',
      type: 'test_email',
    });

    return NextResponse.json({
      success: result.success,
      mode: result.mode,
      recipient: to,
      messageId: result.messageId,
      error: result.error,
      message: result.success
        ? `Test email dispatched successfully (${result.mode} mode).`
        : `Email dispatch failed: ${result.error}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
