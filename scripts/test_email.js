const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Resend } = require('resend');

async function testEmail() {
  const token = process.env.RESEND_TOKEN;
  console.log('Token exists:', !!token, 'prefix:', token ? token.slice(0, 8) : 'none');
  const resend = new Resend(token);
  const sender = `${process.env.RESEND_EMAIL_NAME || 'Technewity Labs'} <${process.env.RESEND_EMAIL_FROM || 'noreply@technewity.com'}>`;
  console.log('Sending test email from:', sender, 'to: vp983351@gmail.com');
  const result = await resend.emails.send({
    from: sender,
    to: ['vp983351@gmail.com'],
    subject: '[Technewity CRM] System Audit & Verification Test Email',
    html: '<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;"><h2>Technewity CRM System Verification</h2><p>This is a live verification email sent during the CRM audit.</p><p>All backend commands, AI routing, and notification subsystems are under active regression testing.</p></div>'
  });
  console.log('Resend send result:', JSON.stringify(result, null, 2));
}

testEmail().catch(console.error);
