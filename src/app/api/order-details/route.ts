import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { db } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    
    // Get session ID from URL parameters - use nextUrl for better compatibility
    const sessionId = request.nextUrl?.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    console.log('Fetching order details for session:', sessionId);

    // Fetch session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    console.log('Stripe session found:', session.id, 'Payment status:', session.payment_status);

    // Try to find order in Firestore
    const orderQuery = query(
      collection(db, 'orders'),
      where('stripeSessionId', '==', sessionId)
    );
    const orderSnapshot = await getDocs(orderQuery);

    if (!orderSnapshot.empty) {
      const orderDoc = orderSnapshot.docs[0];
      const orderData = orderDoc.data();
      
      console.log('Order found in Firestore:', orderDoc.id);
      
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

    console.log('Order not found in Firestore, returning session data');

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