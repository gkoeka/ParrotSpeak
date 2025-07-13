import sgMail from '@sendgrid/mail';

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

async function testSendGrid() {
  try {
    console.log('Testing SendGrid email delivery...\n');
    
    const msg = {
      to: 'greg.koeka@gmail.com',
      from: 'greg.koeka@gmail.com', // Using your verified email address
      subject: 'ParrotSpeak SendGrid Test',
      text: 'This is a test email to verify SendGrid is working properly.',
      html: '<p>This is a test email to verify SendGrid is working properly.</p>',
    };

    console.log('Sending test email...');
    const response = await sgMail.send(msg);
    
    console.log('✅ Email sent successfully!');
    console.log('Response status:', response[0].statusCode);
    console.log('Response headers:', response[0].headers);
    
  } catch (error: any) {
    console.error('❌ Error sending email:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
  }
  
  process.exit(0);
}

testSendGrid();