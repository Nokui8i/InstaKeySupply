import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email, phone, source = 'promo_modal' } = await request.json();
    
    console.log('Email collection request:', { email, phone, source });

    // Validate email
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      console.log('Invalid email:', email);
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate phone (optional but if provided, should be valid)
    if (phone && !/^\+?\d{7,15}$/.test(phone.replace(/\D/g, ""))) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const emailQuery = query(collection(db, 'emailSubscribers'), where('email', '==', email.toLowerCase().trim()));
    const existingDocs = await getDocs(emailQuery);
    
    console.log('Checking for existing email:', email.toLowerCase().trim(), 'Found:', existingDocs.size);
    
    if (!existingDocs.empty) {
      // Email already exists, update the record instead of creating duplicate
      const existingDoc = existingDocs.docs[0];
      const existingData = existingDoc.data();
      
      console.log('Email already exists with source:', existingData.source, 'New source:', source);
      
      // Update with new source if different
      if (existingData.source !== source) {
        // Add new source to existing record or update it
        const updatedData = {
          ...existingData,
          lastUpdated: serverTimestamp(),
          // Keep the original source but note the new interaction
          additionalSources: existingData.additionalSources ? 
            [...existingData.additionalSources, source] : [source]
        };
        
        // Note: In a real implementation, you'd update the document here
        // For now, we'll just return success to avoid duplicates
        console.log(`Email ${email} already exists with source ${existingData.source}, new source: ${source}`);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Email already exists in list',
        id: existingDoc.id
      });
    }

    // Determine campaign based on source
    const campaign = source === 'promo_modal' ? 'promo_modal_10_percent_off' :
                    source === 'user_registration' ? 'user_registration' :
                    source === 'google_signin' ? 'google_signin' :
                    'general_signup';

    // Store in Firestore
    const emailData = {
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      source: source, // 'promo_modal', 'user_registration', 'google_signin', etc.
      subscribed: true,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      // Marketing preferences
      emailMarketing: true,
      smsMarketing: phone ? true : false,
      // GDPR/Privacy compliance
      consentGiven: true,
      consentDate: serverTimestamp(),
      // Additional metadata
      userAgent: request.headers.get('user-agent') || null,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      // Campaign tracking
      campaign: campaign,
      utmSource: request.nextUrl.searchParams.get('utm_source') || null,
      utmMedium: request.nextUrl.searchParams.get('utm_medium') || null,
      utmCampaign: request.nextUrl.searchParams.get('utm_campaign') || null
    };

    // Add to 'emailSubscribers' collection
    const docRef = await addDoc(collection(db, 'emailSubscribers'), emailData);
    console.log('Created email subscriber document:', docRef.id);

    // Also add to 'marketingEmails' collection for easier querying
    const marketingDocRef = await addDoc(collection(db, 'marketingEmails'), {
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      subscribed: true,
      createdAt: serverTimestamp(),
      source: source,
      campaign: campaign
    });
    console.log('Created marketing email document:', marketingDocRef.id);

    console.log(`Email collected: ${email} (ID: ${docRef.id})`);

    return NextResponse.json({
      success: true,
      message: 'Email collected successfully',
      id: docRef.id
    });

  } catch (error) {
    console.error('Error collecting email:', error);
    return NextResponse.json(
      { error: 'Failed to collect email' },
      { status: 500 }
    );
  }
} 