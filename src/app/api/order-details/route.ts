import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { adminDb } from '../../../firebase-admin';

export async function GET(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Fetch session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Try to find order in Firestore
    const orderQuery = adminDb.collection('orders').where('stripeSessionId', '==', sessionId);
    const orderSnapshot = await orderQuery.get();

    if (!orderSnapshot.empty) {
      const orderDoc = orderSnapshot.docs[0];
      const orderData = orderDoc.data();
      
      return NextResponse.json({
        id: orderDoc.id,
        ...orderData,
        stripeSession: {
          id: session.id,
          payment_status: session.payment_status,
          customer_email: session.customer_email,
        }
      });
    }

    // If order not found in Firestore, return session data
    return NextResponse.json({
      id: session.id,
      customer: {
        email: session.customer_email,
        name: session.metadata?.customerName,
        phone: session.metadata?.customerPhone,
      },
      address: session.metadata?.customerAddress ? JSON.parse(session.metadata.customerAddress) : null,
      items: session.metadata?.items ? JSON.parse(session.metadata.items) : [],
      total: session.metadata?.total ? parseFloat(session.metadata.total) : 0,
      subtotal: session.metadata?.subtotal ? parseFloat(session.metadata.subtotal) : 0,
      promoDiscount: session.metadata?.promoDiscount ? parseFloat(session.metadata.promoDiscount) : 0,
      payment_status: session.payment_status,
      stripeSessionId: session.id,
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
} 