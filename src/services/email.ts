import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || "Snadnee Client Space <noreply@example.com>";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const EmailService = {
  async send(options: EmailOptions): Promise<boolean> {
    try {
      if (!SMTP_HOST || !SMTP_USER) {
        console.warn("SMTP not configured, skipping email");
        return false;
      }

      await transporter.sendMail({
        from: SMTP_FROM,
        ...options,
      });

      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  },

  // Send invitation email
  async sendInvitation(email: string, inviterName: string, organizationName: string, token: string): Promise<boolean> {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/register/${token}`;

    return this.send({
      to: email,
      subject: `You've been invited to join ${organizationName} na Snadnee`,
      text: `
Hi,

${inviterName} has invited you to join ${organizationName} na Snadnee (Custom Client Space).

Click the link below to create your account:
${inviteUrl}

This invitation will expire in 7 days.

Best regards,
Snadnee Client Space
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>You've been invited!</h1>
    <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> na Snadnee (Custom Client Space).</p>
    <p>Click the button below to create your account:</p>
    <a href="${inviteUrl}" class="button">Accept Invitation</a>
    <p>Or copy this link: ${inviteUrl}</p>
    <div class="footer">
      <p>This invitation will expire in 7 days.</p>
      <p>Best regards,<br>Snadnee Client Space</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
  },

  // Send notification email for new comment
  async sendCommentNotification(
    email: string,
    userName: string,
    ticketId: string,
    ticketSummary: string,
    authorName: string,
    commentText: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const ticketUrl = `${baseUrl}/tickets/${ticketId}`;

    return this.send({
      to: email,
      subject: `New comment on ${ticketId}: ${ticketSummary}`,
      text: `
Hi ${userName},

${authorName} added a new comment on ticket ${ticketId}:

"${commentText}"

View the ticket: ${ticketUrl}

Best regards,
Snadnee Client Space
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .comment { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>New Comment</h1>
    <p>Hi ${userName},</p>
    <p><strong>${authorName}</strong> added a new comment on ticket <strong>${ticketId}</strong>:</p>
    <div class="comment">${commentText}</div>
    <a href="${ticketUrl}" class="button">View Ticket</a>
    <div class="footer">
      <p>Best regards,<br>Snadnee Client Space</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
  },

  // Send notification email for state change
  async sendStateChangeNotification(
    email: string,
    userName: string,
    ticketId: string,
    ticketSummary: string,
    oldState: string,
    newState: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const ticketUrl = `${baseUrl}/tickets/${ticketId}`;

    return this.send({
      to: email,
      subject: `State changed on ${ticketId}: ${ticketSummary}`,
      text: `
Hi ${userName},

The state of ticket ${ticketId} has been changed:

From: ${oldState}
To: ${newState}

View the ticket: ${ticketUrl}

Best regards,
Snadnee Client Space
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .state-change { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .state { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
    .arrow { margin: 0 10px; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>State Changed</h1>
    <p>Hi ${userName},</p>
    <p>The state of ticket <strong>${ticketId}</strong> has been changed:</p>
    <div class="state-change">
      <span class="state">${oldState}</span>
      <span class="arrow">→</span>
      <span class="state">${newState}</span>
    </div>
    <a href="${ticketUrl}" class="button">View Ticket</a>
    <div class="footer">
      <p>Best regards,<br>Snadnee Client Space</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
  },

  // Send notification email for assignee change
  async sendAssigneeChangeNotification(
    email: string,
    userName: string,
    ticketId: string,
    ticketSummary: string,
    newAssigneeName: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const ticketUrl = `${baseUrl}/tickets/${ticketId}`;

    return this.send({
      to: email,
      subject: `Assignee changed on ${ticketId}: ${ticketSummary}`,
      text: `
Hi ${userName},

The ticket ${ticketId} has been assigned to ${newAssigneeName}.

View the ticket: ${ticketUrl}

Best regards,
Snadnee Client Space
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Assignee Changed</h1>
    <p>Hi ${userName},</p>
    <p>The ticket <strong>${ticketId}</strong> has been assigned to <strong>${newAssigneeName}</strong>.</p>
    <a href="${ticketUrl}" class="button">View Ticket</a>
    <div class="footer">
      <p>Best regards,<br>Snadnee Client Space</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
  },
};

export default EmailService;
