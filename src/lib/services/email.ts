import nodemailer from "nodemailer";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!user || !pass) {
    throw new Error(
      "Gmail not configured. Add your Gmail and App Password to .env.local:\n" +
        "SMTP_USER=your-email@gmail.com\n" +
        "SMTP_PASS=your-16-char-app-password\n\n" +
        "Get App Password at: https://myaccount.google.com/apppasswords"
    );
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  try {
    const config = {
      user: process.env.SMTP_USER || "",
      fromName: process.env.EMAIL_FROM_NAME || "TSR CMS",
    };

    if (!config.user) {
      return {
        success: false,
        error: "Gmail not configured. Go to Settings > Email to add your Gmail account.",
      };
    }

    const transport = getTransporter();
    const recipients = Array.isArray(options.to) ? options.to.join(", ") : options.to;

    const info = await transport.sendMail({
      from: `"${config.fromName}" <${config.user}>`,
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    console.error("[Email Error]", err.message);

    if (err.code === "EAUTH") {
      return {
        success: false,
        error: "Gmail authentication failed. Make sure you're using an App Password (not your regular password). Get one at: https://myaccount.google.com/apppasswords",
      };
    }

    return {
      success: false,
      error: err.message || "Failed to send email",
    };
  }
}

export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string
): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    const result = await sendEmail({ to: recipient, subject, html });
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${recipient}: ${result.error}`);
    }
  }

  return { success: failed === 0, sent, failed, errors };
}

export async function sendTemplatedEmail(
  to: string,
  subject: string,
  template: string,
  variables: Record<string, string>
): Promise<EmailResponse> {
  let html = template;
  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return sendEmail({ to, subject, html });
}

export async function testEmailConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const transport = getTransporter();
    await transport.verify();
    return {
      success: true,
      message: "Gmail connection successful! Emails will be sent from: " + process.env.SMTP_USER,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      success: false,
      message: "Gmail connection failed: " + (err.message || "Unknown error"),
    };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: #1E3A5F; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .btn { display: inline-block; background: #E91E63; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { padding: 20px; text-align: center; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>TSR CMS - Password Reset</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You requested a password reset for your TSR CMS account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="btn">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <br>
          <p>Best regards,<br><strong>TSR CMS Team</strong></p>
        </div>
        <div class="footer">
          <p>TSR</p>
          <p>TSR</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject: "TSR CMS - Password Reset Request", html });
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  role: string
): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: #1E3A5F; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .footer { padding: 20px; text-align: center; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Welcome to TSR CMS</h2>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Welcome to <strong>TSR</strong> College Management System!</p>
          <p>Your account has been created successfully.</p>
          <p><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
          <p>You can now log in to access the system.</p>
          <br>
          <p>Best regards,<br><strong>TSR CMS Team</strong></p>
        </div>
        <div class="footer">
          <p>TSR</p>
          <p>TSR</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject: "Welcome to TSR CMS", html });
}

export async function sendAttendanceAlert(
  to: string,
  studentName: string,
  subject: string,
  percentage: number
): Promise<EmailResponse> {
  const color = percentage < 60 ? "#dc2626" : percentage < 75 ? "#f59e0b" : "#16a34a";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: #1E3A5F; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .percentage { font-size: 48px; font-weight: bold; color: ${color}; text-align: center; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Attendance Alert</h2>
        </div>
        <div class="content">
          <p>Hello ${studentName},</p>
          <p>Your attendance for <strong>${subject}</strong> needs attention.</p>
          <div class="percentage">${percentage}%</div>
          <p>${percentage < 60 ? "Your attendance is critically low. Please attend all upcoming classes." : percentage < 75 ? "Your attendance is below the required 75%. Please improve." : "Your attendance is satisfactory."}</p>
          <br>
          <p>Best regards,<br><strong>TSR CMS Team</strong></p>
        </div>
        <div class="footer">
          <p>TSR</p>
          <p>TSR</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject: `Attendance Alert - ${subject}`, html });
}
