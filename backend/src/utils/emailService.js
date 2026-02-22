/**
 * EMAIL SERVICE - Handles all email sending in the application
 * 
 * Purpose: Send emails for registration confirmations, tickets, and account credentials
 * Uses: nodemailer package to send emails via SMTP
 * 
 * Flow:
 * 1. Create email transporter (connection to email server)
 * 2. Define email content (HTML template)
 * 3. Send email
 * 4. Return success/error
 */

import nodemailer from "nodemailer";

/**
 * CREATE EMAIL TRANSPORTER
 * This creates the connection to the email server
 * 
 * IMPORTANT: To send real emails, you need to:
 * 1. Set NODE_ENV=production in your .env file
 * 2. Set EMAIL_USER to your Gmail address
 * 3. Set EMAIL_PASSWORD to your Gmail App Password (NOT your regular password!)
 *    - Go to Google Account > Security > 2-Step Verification > App passwords
 *    - Generate a 16-character app password
 * 
 * If environment variables are not set, emails won't be sent (test mode).
 */
const createTransporter = async () => {
  try {
    // Check if email credentials are configured
    const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    
    if (hasEmailConfig && process.env.NODE_ENV === "production") {
      // PRODUCTION MODE: Send real emails via Gmail
      console.log('📧 Email Service: Using Gmail to send real emails');
      console.log(`📧 Sending from: ${process.env.EMAIL_USER}`);
      
      return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    } else {
      // TEST MODE: Fake email server (emails don't actually send)
      console.log('⚠️ Email Service: Test mode (emails will NOT be sent)');
      console.log('⚠️ To send real emails:');
      console.log('   1. Set NODE_ENV=production in .env file');
      console.log('   2. Add EMAIL_USER=your-email@gmail.com');
      console.log('   3. Add EMAIL_PASSWORD=your-app-password (get from Google Account settings)');
      
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
  } catch (error) {
    console.error('❌ Email transporter error:', error);
    throw new Error('Failed to create email transporter');
  }
};

/**
 * SEND REGISTRATION CONFIRMATION EMAIL
 * 
 * Purpose: Send a beautiful email with ticket and QR code after successful registration
 * When called: After participant registers for an event
 * 
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email address
 * @param {String} options.participantName - Name of the participant
 * @param {String} options.eventName - Name of the event
 * @param {String} options.ticketId - Unique ticket ID
 * @param {String} options.qrCode - Base64 encoded QR code image
 * @param {Date} options.eventDate - Event date and time
 * 
 * Returns: Email sending info (messageId, etc.)
 * Throws: Error if email fails to send
 */
export const sendRegistrationEmail = async ({
  to,
  participantName,
  eventName,
  ticketId,
  qrCode,
  eventDate,
}) => {
  try {
    const transporter = await createTransporter();

    // Extract base64 data from data URL
    const base64Data = qrCode.replace(/^data:image\/\w+;base64,/, '');

    const mailOptions = {
      from: process.env.EMAIL_FROM || "Felicity <noreply@felicity.iiit.ac.in>",
      to,
      subject: `Registration Confirmed: ${eventName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Registration Confirmed! 🎉</h2>
          
          <p>Dear ${participantName},</p>
          
          <p>Your registration for <strong>${eventName}</strong> has been confirmed!</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Event Details</h3>
            <p><strong>Event:</strong> ${eventName}</p>
            <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</p>
            <p><strong>Ticket ID:</strong> <code style="background: white; padding: 5px 10px; border-radius: 4px;">${ticketId}</code></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p><strong>Your Ticket QR Code</strong></p>
            <img src="cid:qrcode" alt="Ticket QR Code" style="max-width: 250px; border: 2px solid #E5E7EB; border-radius: 8px; padding: 10px;"/>
            <p style="font-size: 12px; color: #6B7280;">Show this QR code at the event venue</p>
          </div>
          
          <p>Please save this email or take a screenshot of the QR code for entry at the event.</p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;"/>
          
          <p style="font-size: 12px; color: #6B7280;">
            If you have any questions, please contact the event organizer.<br/>
            This is an automated email, please do not reply.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: base64Data,
          encoding: 'base64',
          cid: 'qrcode' // Content-ID for embedding in HTML
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log("✅ Registration email sent successfully!");
    console.log(`   To: ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    
    // For test mode, show preview URL
    if (!process.env.EMAIL_USER || process.env.NODE_ENV !== "production") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("📧 Test Email Preview:", previewUrl);
      console.log("⚠️ This is a TEST email. To send real emails, configure .env file.");
    }
    
    return info;
  } catch (error) {
    console.error("❌ Failed to send registration email:", error.message);
    if (error.code === 'EAUTH') {
      console.error("⚠️ Email authentication failed. Check your EMAIL_USER and EMAIL_PASSWORD in .env");
    }
    throw error;
  }
};

/**
 * Send organizer credentials email
 */
export const sendOrganizerCredentials = async ({
  to,
  organizerName,
  email,
  password,
}) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || "Felicity Admin <admin@felicity.iiit.ac.in>",
      to,
      subject: "Your Felicity Organizer Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Welcome to Felicity! 🎉</h2>
          
          <p>Dear ${organizerName},</p>
          
          <p>Your organizer account has been created. Here are your login credentials:</p>
          
          <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> <code style="background: white; padding: 5px 10px; border-radius: 4px;">${password}</code></p>
          </div>
          
          <p><strong>⚠️ Important:</strong> Please change your password after your first login.</p>
          
          <p>You can now login and start creating events for Felicity.</p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;"/>
          
          <p style="font-size: 12px; color: #6B7280;">
            Keep these credentials secure. If you need a password reset, contact the admin.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Organizer credentials email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email sending error:", error);
    throw new Error("Failed to send credentials email");
  }
};
