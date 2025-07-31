import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
// Use static path for Next.js compatibility
import serviceAccount from '../../../../firebase-admin-setup/serviceAccountKey.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });
}
const firestore = admin.firestore();

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { customer, address, items, total } = data;

  // Setup Nodemailer transporter (Gmail SMTP)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.OWNER_EMAIL || 'paylocksmith@gmail.com',
      pass: process.env.OWNER_EMAIL_PASS || 'siqc xtot tdtd ffbr',
    },
  });

  const itemLines = items.map((item: any) => `${item.title} x ${item.quantity} - $${item.price * item.quantity}`).join('<br>');

  // Fetch email templates and logo URL from Firestore
  let logoUrl = '';
  let emailTemplates = null;
  try {
    const snap = await firestore.doc('siteContent/emailTemplates').get();
    const data = snap.data();
    if (snap.exists && data) {
      logoUrl = data.logoUrl || '';
      emailTemplates = data;
      console.log('Logo URL fetched:', logoUrl); // Debug log
    }
  } catch (e) {
    console.error('Failed to fetch email templates:', e);
  }

  // Ensure logo URL is properly formatted for email
  if (logoUrl && !logoUrl.startsWith('http')) {
    console.log('Invalid logo URL format:', logoUrl);
    logoUrl = '';
  }

  // Email to admin (plain text)
  const mailOptionsAdmin = {
    from: process.env.OWNER_EMAIL || 'paylocksmith@gmail.com',
    to: process.env.OWNER_EMAIL || 'paylocksmith@gmail.com',
    subject: 'New Order Received',
    text: `New order received!\n\nCustomer: ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone}\n\nShipping Address:\n${address.street}\n${address.city}, ${address.state} ${address.zip}, ${address.country}\n\nOrder Items:\n${items.map((item: any) => `${item.title} x ${item.quantity} - $${item.price * item.quantity}`).join('\n')}\n\nTotal: $${total}\n`,
  };

  // Prepare customer email content
  let customerSubject = 'Thank you for your order!';
  let customerBody = `Hi ${customer.name || ''},

Thank you for your order! Here is your order summary:

Order Items:
{orderItems}

Shipping To:
{shippingAddress}

Total: ${'{orderTotal}'}

We appreciate your business! If you have any questions, reply to this email.

Best regards,
InstaKey Supply Team`;

  // Use custom template if available
  if (emailTemplates && emailTemplates.orderPlaced) {
    customerSubject = emailTemplates.orderPlaced.subject || customerSubject;
    customerBody = emailTemplates.orderPlaced.body || customerBody;
  }

  // Replace placeholders in the template
  const shippingAddress = `${address.street}\n${address.city}, ${address.state} ${address.zip}, ${address.country}`;
  
  let processedBody = customerBody
    .replace(/{customerName}/g, customer.name || '')
    .replace(/{orderItems}/g, items.map((item: any) => `${item.title} x ${item.quantity} - $${item.price * item.quantity}`).join('\n'))
    .replace(/{shippingAddress}/g, shippingAddress)
    .replace(/{orderTotal}/g, `$${total}`)
    .replace(/{logo}/g, logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-width:180px; margin-bottom:16px; display:block; margin-left:auto; margin-right:auto;" />` : '');

  // Convert to HTML and add logo at the top if not already in template
  const logoHtml = logoUrl ? `<div style="text-align:center; margin-bottom:16px;"><img src="${logoUrl}" alt="Logo" style="max-width:180px; margin-bottom:16px; display:block; margin-left:auto; margin-right:auto;" /></div>` : '';
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${!customerBody.includes('{logo}') ? logoHtml : ''}
      ${processedBody.replace(/\n/g, '<br>')}
    </div>
  `;

  console.log('Final HTML body length:', htmlBody.length); // Debug log
  console.log('Logo included:', !!logoUrl); // Debug log

  // Email to customer (HTML with logo and template)
  const mailOptionsCustomer = {
    from: process.env.OWNER_EMAIL || 'paylocksmith@gmail.com',
    to: customer.email,
    subject: customerSubject,
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptionsAdmin);
    await transporter.sendMail(mailOptionsCustomer);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('ORDER EMAIL ERROR:', err, err?.response?.data || '', err?.message || '');
    return NextResponse.json({ success: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
} 