// Email service for sending password reset emails
import SgMail from '@sendgrid/mail';

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  SgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Sends a password reset email to the user
 * @param email User's email address
 * @param resetToken Password reset token
 * @param resetUrl URL for the password reset page
 */
export async function sendPasswordResetEmail(email: string, resetToken: string, resetUrl: string): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not found, password reset email will not be sent');
    return false;
  }

  try {
    const msg = {
      to: email,
      from: 'noreply@parrotspeak.app', // Use your verified sender
      subject: 'ParrotSpeak: Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3366FF; padding: 20px; text-align: center; color: white;">
            <h1>ParrotSpeak</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>Reset Your Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password for your ParrotSpeak account. To complete the process, please click the link below:</p>
            <p style="margin: 30px 0; text-align: center;">
              <a href="${resetUrl}?token=${resetToken}" style="background-color: #3366FF; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
            </p>
            <p>If you didn't request this password reset, you can safely ignore this email. The link will expire in 30 minutes.</p>
            <p>Thank you,<br>The ParrotSpeak Team</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
            <p>${resetUrl}?token=${resetToken}</p>
          </div>
        </div>
      `,
    };

    await SgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

/**
 * Generate a mock email for development when SendGrid is not available
 * @param email User's email address
 * @param resetToken Password reset token
 * @param resetUrl URL for the password reset page
 */
export function generateMockResetEmail(email: string, resetToken: string, resetUrl: string): string {
  return `
    To: ${email}
    From: noreply@parrotspeak.app
    Subject: ParrotSpeak: Reset Your Password
    
    ----------------------------------------
    
    Hello,
    
    We received a request to reset your password for your ParrotSpeak account. 
    To complete the process, please use the following link:
    
    ${resetUrl}?token=${resetToken}
    
    If you didn't request this password reset, you can safely ignore this email.
    The link will expire in 30 minutes.
    
    Thank you,
    The ParrotSpeak Team
  `;
}