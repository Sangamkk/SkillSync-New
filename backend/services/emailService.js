import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

dotenv.config({ path: envPath, override: true });

let transporter = null;
let cachedCredsKey = "";

/**
 * Returns a configured Nodemailer transporter using Gmail SMTP over TLS (port 465).
 */
const getTransporter = () => {
  dotenv.config({ path: envPath, override: true });
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || user.trim() === "" || pass.trim() === "") {
    const error = new Error(
      "Gmail SMTP credentials are not configured. Please set EMAIL_USER and EMAIL_PASS (Google App Password) in backend/.env."
    );
    error.statusCode = 500;
    throw error;
  }

  const cleanUser = user.trim();
  const cleanPass = pass.trim().replace(/\s+/g, "");
  const credsKey = `${cleanUser}:${cleanPass}`;

  if (!transporter || cachedCredsKey !== credsKey) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Secure TLS over port 465
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
    });
    cachedCredsKey = credsKey;
  }

  return transporter;
};

/**
 * Sends a branded SkillSync verification email containing the 6-digit OTP code via Gmail SMTP.
 * Never logs the OTP code or returns credentials to the client.
 */
export const sendVerificationEmail = async (email, code) => {
  const mailTransporter = getTransporter();
  const senderEmail = process.env.EMAIL_USER.trim();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SkillSync Email Verification</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #070b14; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #0d1322; border-radius: 20px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
              <!-- Header -->
              <tr>
                <td style="padding: 36px 32px 24px; text-align: center; border-bottom: 1px solid #1a2235;">
                  <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: linear-gradient(135deg, #0a66c2, #7c3aed); font-weight: 800; font-size: 22px; color: #ffffff; text-align: center; margin-bottom: 12px;">
                    S
                  </div>
                  <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Skill<span style="color: #38bdf8;">Sync</span></h1>
                  <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">Verifiable Academic & Skill Credential Network</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 32px 32px 28px; text-align: center;">
                  <h2 style="margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #ffffff;">Email Verification Code</h2>
                  <p style="margin: 0 0 24px; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
                    Please enter the following 6-digit verification code to complete your SkillSync student profile registration:
                  </p>

                  <!-- OTP Code Box -->
                  <div style="display: inline-block; padding: 16px 32px; background: #070b14; border: 2px dashed #0284c7; border-radius: 14px; font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #38bdf8; text-indent: 10px;">
                    ${code}
                  </div>

                  <p style="margin: 24px 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                    ⏱ This verification code will expire in <strong style="color: #f1f5f9;">10 minutes</strong>.<br>
                    If you did not request this verification code, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 32px 28px; background-color: #0a0f1c; border-top: 1px solid #1a2235; text-align: center; font-size: 12px; color: #64748b;">
                  <p style="margin: 0;">Secured with SkillSync Zero-Trust Verification</p>
                  <p style="margin: 6px 0 0;">© ${new Date().getFullYear()} SkillSync Network. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const info = await mailTransporter.sendMail({
      from: `"SkillSync Verification" <${senderEmail}>`,
      to: email,
      subject: `SkillSync Verification Code: ${code}`,
      html: htmlContent,
      text: `Your SkillSync verification code is: ${code}. It expires in 10 minutes.`,
    });

    console.log(`[EMAIL] Verification email sent to ${email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[EMAIL SERVICE ERROR]:", error.message);
    const err = new Error(
      error.message?.includes("Invalid login")
        ? "Gmail authentication failed. Please verify that EMAIL_PASS is a valid 16-character Google App Password (not your personal account password)."
        : error.message || "Failed to send verification email via Gmail SMTP."
    );
    err.statusCode = error.statusCode || 400;
    throw err;
  }
};

/**
 * Sends a notification email for real-time activities (e.g., job offers, approvals, rejections, certificates).
 * Only invoked for new activities when the recipient has a verified email and email notifications enabled.
 */
export const sendActivityNotificationEmail = async ({
  to,
  recipientName = "Applicant",
  title,
  message,
  link = "",
  isImportant = false,
  senderName = "",
}) => {
  try {
    const mailTransporter = getTransporter();
    const senderEmail = process.env.EMAIL_USER.trim();
    const appBaseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const fullActionUrl = link?.startsWith("http")
      ? link
      : `${appBaseUrl}${link.startsWith("/") ? "" : "/"}${link}`;

    const subject = isImportant
      ? `⭐ [IMPORTANT] ${title} — SkillSync`
      : `${title} — SkillSync`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f6f8; padding: 36px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #d9e1e8; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">
                <!-- Top Brand Header -->
                <tr>
                  <td style="padding: 24px 32px; background: #0f172a; border-bottom: 1px solid #1e293b;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="display: inline-block; width: 34px; height: 34px; line-height: 34px; border-radius: 8px; background: #0a66c2; font-weight: 800; font-size: 18px; color: #ffffff; text-align: center; vertical-align: middle;">
                            S
                          </div>
                          <span style="margin-left: 10px; font-size: 20px; font-weight: 800; color: #ffffff; vertical-align: middle;">Skill<span style="color: #38bdf8;">Sync</span></span>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; font-weight: 600; color: #94a3b8; background: #1e293b; padding: 4px 10px; border-radius: 12px; border: 1px solid #334155;">
                            Verified Notification
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Important Highlight Banner if Offer or High Priority -->
                ${
                  isImportant
                    ? `
                <tr>
                  <td style="padding: 12px 32px; background: linear-gradient(90deg, #fef3c7, #fde68a); border-bottom: 1px solid #f59e0b; text-align: center;">
                    <span style="font-size: 12px; font-weight: 800; color: #92400e; letter-spacing: 0.5px;">
                      ⭐ HIGH PRIORITY: OFFICIAL EMPLOYMENT / JOB OFFER
                    </span>
                  </td>
                </tr>
                `
                    : ""
                }

                <!-- Body Content -->
                <tr>
                  <td style="padding: 36px 32px 28px;">
                    <p style="margin: 0 0 16px; font-size: 14px; color: #64748b;">
                      Hello <strong style="color: #1e293b;">${recipientName}</strong>,
                    </p>

                    <h2 style="margin: 0 0 14px; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      ${title}
                    </h2>

                    <div style="background-color: ${
                      isImportant ? "#fffbeb" : "#f8fafc"
                    }; border: 1px solid ${
                      isImportant ? "#fde68a" : "#e2e8f0"
                    }; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                      <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.6;">
                        ${message}
                      </p>
                      ${
                        senderName
                          ? `<p style="margin: 12px 0 0; font-size: 12px; color: #64748b;">Sender: <strong style="color: #0f172a;">${senderName}</strong></p>`
                          : ""
                      }
                    </div>

                    ${
                      link
                        ? `
                    <div style="text-align: center; margin: 30px 0 16px;">
                      <a href="${fullActionUrl}" style="display: inline-block; background-color: #0a66c2; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(10, 102, 194, 0.25);">
                        View Details in SkillSync Portal →
                      </a>
                    </div>
                    `
                        : ""
                    }
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5;">
                    <p style="margin: 0;">
                      You received this email because you verified your email address and enabled email notifications in your SkillSync settings.
                    </p>
                    <p style="margin: 6px 0 0; font-size: 11px; color: #94a3b8;">
                      Manage notification preferences in your portal under <strong>Settings → Notifications</strong>.
                    </p>
                    <p style="margin: 10px 0 0; font-size: 11px; color: #94a3b8;">
                      © ${new Date().getFullYear()} SkillSync Network. All credentials anchored on blockchain.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await mailTransporter.sendMail({
      from: `"SkillSync Notifications" <${senderEmail}>`,
      to,
      subject,
      html: htmlContent,
      text: `${title}\n\n${message}\n\nView details: ${fullActionUrl}`,
    });

    console.log(`[EMAIL NOTIFICATION] Sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`[EMAIL NOTIFICATION FAILED] Could not send to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

