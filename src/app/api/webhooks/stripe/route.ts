import { NextRequest, NextResponse } from 'next/server';
import { stripe, validateStripeConfig } from '../../../../lib/stripe';
import { db } from '../../../../firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  // Validate Stripe configuration
  const configValidation = validateStripeConfig();
  if (!configValidation.isValid) {
    console.error('Stripe webhook: Configuration missing:', configValidation.missing);
    return NextResponse.json({ error: 'Stripe not properly configured' }, { status: 500 });
  }

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

  console.log('Stripe webhook received:', {
    type: event.type,
    id: event.id,
    created: new Date(event.created * 1000).toISOString(),
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, request);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        console.log('Invoice payment succeeded:', event.data.object.id);
        break;
      case 'customer.subscription.created':
        console.log('Customer subscription created:', event.data.object.id);
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

async function handleCheckoutSessionCompleted(session: any, request: NextRequest) {
  try {
    console.log('Processing completed checkout session:', session.id);

    // Extract order data from session metadata
    const {
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      promoDiscount,
      total,
      environment
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
      environment: environment || 'production',
      stripeCustomerId: session.customer,
      paymentMethod: session.payment_method_types?.[0] || 'card',
    };

    const orderRef = await addDoc(collection(db, 'orders'), orderData);
    console.log('Order created in Firestore:', orderRef.id);

    // Send order confirmation email
    try {
      // Get the base URL from environment or construct from request
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      
      if (!baseUrl) {
        // Try to get from request headers
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        baseUrl = host ? `${protocol}://${host}` : '';
      }
      
      // Ensure we have a valid base URL
      if (!baseUrl || !baseUrl.startsWith('http')) {
        // Use the request origin as fallback
        const origin = request.headers.get('origin');
        if (origin) {
          baseUrl = origin;
        } else {
          // Last resort: construct from host header
          const host = request.headers.get('host');
          const protocol = request.headers.get('x-forwarded-proto') || 'https';
          baseUrl = host ? `${protocol}://${host}` : 'https://instakeysupply.com';
        }
      }
      
      console.log('Sending email using base URL:', baseUrl);
      
      const emailResponse = await fetch(`${baseUrl}/api/send-order-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Stripe-Webhook/1.0'
        },
        body: JSON.stringify({
          customer: orderData.customer,
          address: orderData.address,
          items: orderData.items,
          total: orderData.total,
          orderId: session.id,
          firestoreOrderId: orderRef.id,
        }),
      });

      console.log('Email API response status:', emailResponse.status);
      
      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('Failed to send order email. Status:', emailResponse.status, 'Error:', errorText);
      } else {
        const emailResult = await emailResponse.json();
        console.log('Order confirmation email sent successfully:', emailResult);
      }
    } catch (emailError) {
      console.error('Failed to send order email:', emailError);
    }

    // Log successful order processing
    console.log('Order processing completed successfully:', {
      sessionId: session.id,
      orderId: orderRef.id,
      customerEmail: orderData.customer.email,
      total: orderData.total,
    });

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error; // Re-throw to trigger webhook failure
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    console.log('Processing successful payment:', paymentIntent.id);

    // Update order status if needed
    const orderQuery = query(
      collection(db, 'orders'),
      where('stripePaymentIntentId', '==', paymentIntent.id)
    );
    const orderSnapshot = await getDocs(orderQuery);
    
    if (!orderSnapshot.empty) {
      const orderDoc = orderSnapshot.docs[0];
      await updateDoc(doc(db, 'orders', orderDoc.id), {
        paymentStatus: 'completed',
        updatedAt: Timestamp.now(),
        paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
        lastPaymentError: null,
      });
      console.log('Order payment status updated:', orderDoc.id);
    } else {
      console.log('No order found for payment intent:', paymentIntent.id);
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    console.log('Processing failed payment:', paymentIntent.id);

    // Update order status
    const orderQuery = query(
      collection(db, 'orders'),
      where('stripePaymentIntentId', '==', paymentIntent.id)
    );
    const orderSnapshot = await getDocs(orderQuery);
    
    if (!orderSnapshot.empty) {
      const orderDoc = orderSnapshot.docs[0];
      await updateDoc(doc(db, 'orders', orderDoc.id), {
        paymentStatus: 'failed',
        orderStatus: 'cancelled',
        updatedAt: Timestamp.now(),
        lastPaymentError: paymentIntent.last_payment_error?.message || 'Payment failed',
      });
      console.log('Order payment status updated to failed:', orderDoc.id);
    } else {
      console.log('No order found for failed payment intent:', paymentIntent.id);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
} 