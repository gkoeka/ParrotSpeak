import sgMail from '@sendgrid/mail';

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Send an email using SendGrid
 * @param params Email parameters (to, subject, text, html)
 * @returns Promise<boolean> Success status
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    await sgMail.send({
      to: params.to,
      from: 'greg.koeka@gmail.com', // Using your verified email address
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Send a feedback notification email
 * @param feedback Feedback content
 * @param category Feedback category
 * @param userEmail User's email (if provided)
 * @param userName User's name (if available)
 * @returns Promise<boolean> Success status
 */
export async function sendFeedbackEmail(
  feedback: string,
  category: string,
  userEmail?: string | null,
  userName?: string | null
): Promise<boolean> {
  const adminEmail = 'greg.koeka@gmail.com'; // Admin email to receive notifications
  
  const subject = `New ParrotSpeak Feedback: ${category}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4b7bec;">New ParrotSpeak Feedback</h2>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>From:</strong> ${userName || 'Anonymous'} ${userEmail ? `(${userEmail})` : ''}</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="white-space: pre-wrap;">${feedback}</p>
      </div>
      <p style="color: #666; font-size: 12px;">This is an automated notification from ParrotSpeak.</p>
    </div>
  `;
  
  const text = `New ParrotSpeak Feedback\n\nCategory: ${category}\nFrom: ${userName || 'Anonymous'} ${userEmail ? `(${userEmail})` : ''}\n\n${feedback}\n\nThis is an automated notification from ParrotSpeak.`;
  
  return await sendEmail({
    to: adminEmail,
    subject,
    text,
    html
  });
}