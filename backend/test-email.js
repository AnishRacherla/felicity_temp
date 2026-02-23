import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

console.log('\n🧪 Testing Email Configuration...\n');
console.log('Environment Variables:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : '❌ NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('\n');

async function testEmail() {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      debug: true, // Show debug output
      logger: true  // Log to console
    });

    console.log('✅ Transporter created\n');
    
    // Verify connection
    console.log('🔄 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_FROM, // Send to yourself for testing
      subject: 'Test Email from Felicity - Brevo SMTP',
      html: `
        <h2>Test Email ✅</h2>
        <p>If you're reading this, your Brevo SMTP is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    });

    console.log('\n✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
  } catch (error) {
    console.error('\n❌ Email test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️ Authentication failed! Check:');
      console.error('  1. EMAIL_USER and EMAIL_PASSWORD are correct');
      console.error('  2. SMTP key is valid in Brevo dashboard');
    } else if (error.code === 'EENVELOPE') {
      console.error('\n⚠️ Sender email rejected! Check:');
      console.error('  1. EMAIL_FROM is verified in Brevo');
      console.error('  2. Go to Brevo -> Settings -> Senders & IP');
    }
    
    console.error('\nFull error:', error);
  }
}

testEmail();
