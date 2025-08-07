import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { getOrderBySessionId } from '../../../firebase-admin';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('Order details API called');
  
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    console.log('Fetching session from Stripe:', sessionId);
    
    // Fetch session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    console.log('Session found, checking Firestore for order');
    
    // Get order from Firestore using the new helper function
    const order = await getOrderBySessionId(sessionId);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: order,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        customer_details: session.customer_details
      }
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
} 