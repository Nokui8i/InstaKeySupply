import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';
import { addOrder } from '../../../../firebase-admin';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event;

  // Check if stripe is initialized
  if (!stripe) {
    console.error('Stripe not initialized - missing STRIPE_SECRET_KEY');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
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
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log('Handling checkout session completed:', session.id);
  
  try {
    // Parse order data from session metadata
    console.log('Parsing order data from session metadata');
    const orderData = JSON.parse(session.metadata.orderData || '{}');
    
    // Create order object
    const order = {
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      customer: {
        name: orderData.customerName || '',
        email: orderData.customerEmail || '',
        phone: orderData.customerPhone || ''
      },
      address: {
        street: orderData.street || '',
        city: orderData.city || '',
        state: orderData.state || '',
        zip: orderData.zip || '',
        country: orderData.country || ''
      },
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      total: orderData.total || 0,
      promoDiscount: orderData.promoDiscount || 0,
      orderStatus: 'paid',
      paymentStatus: 'completed',
      shippingStatus: 'pending',
      createdAt: new Date()
    };

    console.log('Creating order in Firestore');
    console.log('Adding order to Firestore:', session.id);
    
    // Use the new addOrder helper function
    const orderId = await addOrder(order);
    console.log('Order created successfully:', orderId);
    
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  console.log('Handling payment succeeded:', paymentIntent.id);
  
  try {
    // Update order status if needed
    // This could be used for additional payment processing
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  console.log('Handling payment failed:', paymentIntent.id);
  
  try {
    // Update order status to failed
    // This could be used for failed payment handling
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
} 