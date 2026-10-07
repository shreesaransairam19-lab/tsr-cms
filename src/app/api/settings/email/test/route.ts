import { NextRequest, NextResponse } from "next/server";
import { sendEmail, testEmailConnection } from "@/lib/services/email";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const body = await request.json();
    const { to, type } = body;

    if (type === "connection") {
      const result = await testEmailConnection();
      return NextResponse.json(result);
    }

    if (!to) {
      return NextResponse.json(
        { success: false, message: "Email address is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to,
      subject: "TSR CMS - Test Email",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
            .header { background: #1E3A5F; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; text-align: center; }
            .check { font-size: 64px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>TSR CMS</h2>
            </div>
            <div class="content">
              <div class="check">✅</div>
              <h3>Email Configuration Working!</h3>
              <p>If you received this email, your Gmail integration is set up correctly.</p>
              <p>You can now send notifications, attendance alerts, fee reminders, and more.</p>
              <br>
              <p><strong>TSR</strong></p>
            </div>
            <div class="footer">
              <p>TSR</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${to}! Check your inbox.`,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error || "Failed to send email",
      });
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, message: err.message || "Failed to send test email" },
      { status: 500 }
    );
  }
}
