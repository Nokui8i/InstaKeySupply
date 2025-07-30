import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import serviceAccount from '../../../../firebase-admin-setup/serviceAccountKey.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });
}
const firestore = admin.firestore();

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { customer, address, items, total, trackingNumber } = data;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.OWNER_EMAIL || 'paylocksmith@gmail.com',
      pass: process.env.OWNER_EMAIL_PASS || 'siqc xtot tdtd ffbr',
    },
  });

  const itemLines = items.map((item: any) => `${item.title} x ${item.quantity} - $${item.price * item.quantity}`).join('<br>');

  // Fetch logo URL from Firestore
  let logoUrl = '';
  try {
    const snap = await firestore.doc('siteContent/emailTemplates').get();
    const data = snap.data();
    if (snap.exists && data && data.logoUrl) {
      logoUrl = data.logoUrl;
    }
  } catch (e) {
    console.error('Failed to fetch logo URL:', e);
  }

  const mailOptions = {
    from: process.env.OWNER_EMAIL || 'paylocksmith@gmail.com',
    to: customer.email,
    subject: 'Your order has shipped!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        ${logoUrl ? `<div style='text-align:center; margin-bottom:16px;'><img src='${logoUrl}' alt='Logo' style='max-width:180px; margin-bottom:16px;'/></div>` : ''}
        <h2 style="color:#2d3748;">Hi ${customer.name || ''},</h2>
        <p>Good news! Your order has shipped and is on its way.</p>
        <div style="margin: 18px 0; padding: 16px; background: #f8f9fa; border-radius: 8px;">
          <strong>Order Items:</strong><br>
          ${itemLines}
        </div>
        <div style="margin: 18px 0;">
          <strong>Shipping To:</strong><br>
          ${address.street}<br>
          ${address.city}, ${address.state} ${address.zip}, ${address.country}
        </div>
        <div style="margin: 18px 0; font-size: 1.2em; color: #3182ce;">
          <strong>Total:</strong> $${total}
        </div>
        ${trackingNumber ? `<div style='margin: 18px 0;'><strong>Tracking Number:</strong> ${trackingNumber}</div>` : ''}
        <p style="margin-top: 24px;">Thank you for shopping with us!</p>
        <div style="margin-top: 32px; color: #718096; font-size: 13px;">Best regards,<br>InstaKey Supply Team</div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('SHIPPED EMAIL ERROR:', err, err?.response?.data || '', err?.message || '');
    return NextResponse.json({ success: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
} 