import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';
import { adminDb } from '../../../../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  try {
    // Extract order data from session metadata
    const {
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      promoDiscount,
      total
    } = session.metadata;

    // Parse the data
    const parsedItems = JSON.parse(items);
    const parsedAddress = JSON.parse(customerAddress);

    // Create order in Firestore
    const orderData = {
      createdAt: Timestamp.now(),
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      customer: {
        name: customerName,
        email: session.customer_details?.email || session.customer_email,
        phone: customerPhone,
      },
      address: parsedAddress,
      items: parsedItems,
      subtotal: parseFloat(subtotal),
      promoDiscount: parseFloat(promoDiscount),
      total: parseFloat(total),
      orderStatus: 'paid',
      paymentStatus: 'completed',
      shippingStatus: 'pending',
    };

    await adminDb.collection('orders').add(orderData);

    // Send order confirmation email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-order-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: orderData.customer,
          address: orderData.address,
          items: orderData.items,
          total: orderData.total,
          orderId: session.id,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send order email:', emailError);
    }

    console.log('Order created successfully:', session.id);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    // Update order status if needed
    const orderQuery = adminDb.collection('orders').where('stripePaymentIntentId', '==', paymentIntent.id);
    const orderSnapshot = await orderQuery.get();
    
    if (!orderSnapshot.empty) {
      const orderDoc = orderSnapshot.docs[0];
      await orderDoc.ref.update({
        paymentStatus: 'completed',
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    // Update order status
    const orderQuery = adminDb.collection('orders').where('stripePaymentIntentId', '==', paymentIntent.id);
    const orderSnapshot = await orderQuery.get();
    
    if (!orderSnapshot.empty) {
      const orderDoc = orderSnapshot.docs[0];
      await orderDoc.ref.update({
        paymentStatus: 'failed',
        orderStatus: 'cancelled',
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
} 