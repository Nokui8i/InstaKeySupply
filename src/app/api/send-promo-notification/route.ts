import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { customerEmail, promoCode, discountType, discountValue, expiresAt } = data;

    // Validate required fields
    if (!customerEmail || !promoCode || !discountType || !discountValue) {
      console.error('Missing required fields:', { customerEmail, promoCode, discountType, discountValue });
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Use environment variables with fallback values
    const emailUser = process.env.OWNER_EMAIL || 'paylocksmith@gmail.com';
    const emailPass = process.env.OWNER_EMAIL_PASS || 'siqc xtot tdtd ffbr';

    console.log('Setting up email transporter with:', {
      user: emailUser,
      pass: emailPass ? '***' : 'NOT_SET'
    });

    // Setup Nodemailer transporter (Gmail SMTP)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

  // Format the discount display
  const discountDisplay = discountType === 'percent' ? `${discountValue}% OFF` : `$${discountValue} OFF`;
  
  // Format expiration date
  const expirationText = expiresAt ? 
    `This code expires on ${new Date(expiresAt.seconds * 1000).toLocaleDateString()}.` : 
    'This code has no expiration date.';

  // Email to customer
  const mailOptions = {
    from: process.env.OWNER_EMAIL,
    to: customerEmail,
    subject: `🎉 Exclusive Promo Code: ${promoCode} - ${discountDisplay}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Exclusive Promo Code!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been selected for a special discount</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 25px;">
            <h2 style="color: #667eea; margin: 0 0 10px 0; font-size: 24px;">${promoCode}</h2>
            <p style="color: #28a745; font-size: 20px; font-weight: bold; margin: 0;">${discountDisplay}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">How to use your promo code:</h3>
            <ol style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Visit our website at <a href="https://instakeysuply.com" style="color: #667eea;">instakeysuply.com</a></li>
              <li>Add items to your cart</li>
              <li>At checkout, enter the promo code: <strong style="color: #333;">${promoCode}</strong></li>
              <li>Enjoy your ${discountDisplay} discount!</li>
            </ol>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Important:</strong> This promo code is exclusive to your email address (${customerEmail}). 
              ${expirationText}
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://instakeysuply.com" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Shop Now
            </a>
          </div>
          
          <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">Thank you for being a valued customer!</p>
            <p style="margin: 5px 0 0 0;">Best regards,<br>The InstaKey Supply Team</p>
          </div>
        </div>
      </div>
    `,
  };

    try {
      console.log('Attempting to send email to:', customerEmail);
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', customerEmail);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      console.error('Failed to send promo notification email:', err);
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  } catch (err: any) {
    console.error('API route error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
} 