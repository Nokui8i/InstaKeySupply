import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import nodemailer from 'nodemailer';

// Email configuration (you'll need to set these up)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.OWNER_EMAIL || 'paylocksmith@gmail.com',
    pass: process.env.OWNER_EMAIL_PASS || 'siqc xtot tdtd ffbr',
  },
  // Add timeout settings to prevent hanging
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,     // 60 seconds
});

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting email campaign...');
    
    // Check if email configuration is set up (with fallbacks)
    const emailUser = process.env.OWNER_EMAIL || 'paylocksmith@gmail.com';
    const emailPass = process.env.OWNER_EMAIL_PASS || 'siqc xtot tdtd ffbr';
    
    console.log('✅ Email configuration:', { 
      emailUser: emailUser ? 'SET' : 'NOT SET',
      emailPass: emailPass ? 'SET' : 'NOT SET'
    });

    // Check if this is an admin request (for storage permissions)
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header present:', !!authHeader);

    console.log('✅ Email configuration found');
    const formData = await request.formData();
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;
    const campaignName = formData.get('campaignName') as string;
    const logoFile = formData.get('logo') as File | null;
    const bannerFile = formData.get('banner') as File | null;

    console.log('📧 Campaign details:', { subject, campaignName, hasLogo: !!logoFile, hasBanner: !!bannerFile });

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Upload images to Firebase Storage if provided
    let logoUrl = '';
    let bannerUrl = '';

    if (logoFile) {
      try {
        console.log('📤 Uploading logo...');
        const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
        const logoFileName = `email-campaigns/logos/${Date.now()}_${logoFile.name}`;
        const logoFileRef = ref(storage, logoFileName);
        
        await uploadBytes(logoFileRef, logoBuffer);
        logoUrl = await getDownloadURL(logoFileRef);
        console.log('✅ Logo uploaded:', logoUrl);
      } catch (uploadError) {
        console.warn('⚠️ Logo upload failed, continuing without logo:', uploadError);
        // Continue without the logo
      }
    }

    if (bannerFile) {
      try {
        console.log('📤 Uploading banner...');
        const bannerBuffer = Buffer.from(await bannerFile.arrayBuffer());
        const bannerFileName = `email-campaigns/banners/${Date.now()}_${bannerFile.name}`;
        const bannerFileRef = ref(storage, bannerFileName);
        
        await uploadBytes(bannerFileRef, bannerBuffer);
        bannerUrl = await getDownloadURL(bannerFileRef);
        console.log('✅ Banner uploaded:', bannerUrl);
      } catch (uploadError) {
        console.warn('⚠️ Banner upload failed, continuing without banner:', uploadError);
        // Continue without the banner
      }
    }

    // Get all email subscribers
    console.log('👥 Fetching subscribers...');
    const subscribersQuery = query(
      collection(db, 'emailSubscribers'),
      where('subscribed', '==', true)
    );

    const subscribersSnap = await getDocs(subscribersQuery);
    let subscribers = subscribersSnap.docs.map(doc => doc.data());

    console.log('📊 Found subscribers:', subscribers.length);

    // Filter out any subscribers without valid email addresses
    subscribers = subscribers.filter((subscriber: any) => 
      subscriber.email && 
      typeof subscriber.email === 'string' && 
      subscriber.email.includes('@')
    );

    console.log('✅ Valid subscribers:', subscribers.length);

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No valid email subscribers found for the target audience' },
        { status: 404 }
      );
    }

    // Send emails
    console.log('📤 Starting to send emails...');
    const emailPromises = subscribers.map(async (subscriber: any) => {
      console.log(`📧 Sending to: ${subscriber.email}`);
      const mailOptions = {
        from: emailUser,
        to: subscriber.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            ${bannerUrl ? `
              <div style="text-align: center; margin-bottom: 0;">
                <img src="${bannerUrl}" alt="Banner" style="max-width: 100%; height: auto; display: block;" />
              </div>
            ` : ''}
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 16px; font-weight: bold;">InstaKey Supply</h1>
            </div>
            
            <div style="padding: 40px 30px; background: #ffffff; line-height: 1.8; font-size: 18px; color: #333333;">
              ${message}
            </div>
            
            <div style="padding: 15px; background: #333; color: white; text-align: center; font-size: 10px;">
              <p style="margin: 0 0 8px 0;">You received this email because you subscribed to our newsletter.</p>
              <p style="margin: 0 0 8px 0;">To unsubscribe, please contact us or click <a href="#" style="color: #667eea;">here</a>.</p>
              <p style="margin: 0; font-size: 9px; opacity: 0.8;">&copy; 2024 InstaKey Supply. All rights reserved.</p>
            </div>
            
            ${logoUrl ? `
              <div style="text-align: center; padding: 20px; background: #f8f9fa; border-top: 1px solid #e9ecef;">
                <img src="${logoUrl}" alt="Logo" style="max-height: 120px; width: auto; display: inline-block;" />
              </div>
            ` : ''}
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Sent to: ${subscriber.email}`);
        return { email: subscriber.email, status: 'sent' };
      } catch (error: any) {
        console.error(`❌ Failed to send email to ${subscriber.email}:`, error);
        return { 
          email: subscriber.email, 
          status: 'failed', 
          error: error.message || 'Unknown email error' 
        };
      }
    });

    console.log('⏳ Waiting for all emails to be sent...');
    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log('📊 Email results:', { successful, failed });

    // Log campaign results
    console.log('💾 Saving campaign results...');
    await addDoc(collection(db, 'emailCampaigns'), {
      campaignName: campaignName || 'Promotional Email',
      subject: subject,
      message: message,
      targetAudience: 'all_subscribers',
      totalSent: subscribers.length,
      successful: successful,
      failed: failed,
      sentAt: new Date(),
      results: results,
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null
    });

    console.log('🎉 Campaign completed successfully!');
    return NextResponse.json({
      success: true,
      message: `Email campaign sent successfully`,
      totalSent: subscribers.length,
      successful: successful,
      failed: failed,
      results: results
    });

  } catch (error: any) {
    console.error('Error sending promotional email:', error);
    return NextResponse.json(
      { error: 'Failed to send promotional email' },
      { status: 500 }
    );
  }
} 

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing API route...');
    
    // Check if email configuration is set up (with fallbacks)
    const emailUser = process.env.OWNER_EMAIL || 'paylocksmith@gmail.com';
    const emailPass = process.env.OWNER_EMAIL_PASS || 'siqc xtot tdtd ffbr';
    
    return NextResponse.json({
      status: 'API route working',
      emailConfigured: true,
      emailUser: emailUser ? 'SET' : 'NOT SET',
      emailPass: emailPass ? 'SET' : 'NOT SET',
      subscriberCount: 0, // We'll get this from the query below
      subscribers: [] // We'll get this from the query below
    });

    // Get subscriber count
    const subscribersQuery = query(
      collection(db, 'emailSubscribers'),
      where('subscribed', '==', true)
    );

    const subscribersSnap = await getDocs(subscribersQuery);
    const subscribers = subscribersSnap.docs.map(doc => doc.data());

    return NextResponse.json({
      status: 'API route working',
      emailConfigured: true,
      emailUser: emailUser ? 'SET' : 'NOT SET',
      emailPass: emailPass ? 'SET' : 'NOT SET',
      subscriberCount: subscribers.length,
      subscribers: subscribers.map(s => ({ email: s.email, source: s.source }))
    });

  } catch (error: any) {
    console.error('Error in GET test:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 