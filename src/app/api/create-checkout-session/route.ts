import { NextRequest, NextResponse } from 'next/server';
import { stripe, validateStripeConfig } from '../../../lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Validate Stripe configuration
    const configValidation = validateStripeConfig();
    if (!configValidation.isValid) {
      console.error('Stripe configuration missing:', configValidation.missing);
      return NextResponse.json({ 
        error: 'Stripe not properly configured',
        details: configValidation.missing 
      }, { status: 500 });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    
    const { items, customerInfo, promoDiscount = 0 } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Validate customer info
    if (!customerInfo?.email || !customerInfo?.name) {
      return NextResponse.json({ error: 'Customer information required' }, { status: 400 });
    }

    // Calculate total
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const total = Math.max(0, subtotal - promoDiscount);

    // Validate minimum order amount (Stripe requires at least $0.50)
    if (total < 0.50) {
      return NextResponse.json({ error: 'Order total must be at least $0.50' }, { status: 400 });
    }

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          description: item.model || item.description || 'Car key replacement',
          images: item.imageUrl ? [item.imageUrl] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add discount if applicable
    if (promoDiscount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Promo Discount',
            description: 'Promotional discount applied',
          },
          unit_amount: -Math.round(promoDiscount * 100), // Negative amount for discount
        },
        quantity: 1,
      });
    }

    // Create checkout session with enhanced metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/checkout`,
      customer_email: customerInfo.email,
      metadata: {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone || '',
        customerAddress: JSON.stringify(customerInfo.address),
        items: JSON.stringify(items),
        subtotal: subtotal.toString(),
        promoDiscount: promoDiscount.toString(),
        total: total.toString(),
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      phone_number_collection: {
        enabled: true,
      },
      // Add billing address collection for better fraud prevention
      billing_address_collection: 'required',
      // Enable automatic tax calculation (if available)
      automatic_tax: {
        enabled: true,
      },
      // Add payment intent data for better tracking
      payment_intent_data: {
        metadata: {
          customer_email: customerInfo.email,
          order_type: 'car_key_replacement',
        },
      },
    });

    console.log('Stripe checkout session created:', {
      sessionId: session.id,
      amount: total,
      customerEmail: customerInfo.email,
      itemCount: items.length,
    });

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url,
      amount: total,
      currency: 'usd'
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    
    // Provide more specific error messages
    if (error.type === 'StripeCardError') {
      return NextResponse.json({ 
        error: 'Card error: ' + error.message 
      }, { status: 400 });
    } else if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ 
        error: 'Invalid request: ' + error.message 
      }, { status: 400 });
    } else if (error.type === 'StripeAPIError') {
      return NextResponse.json({ 
        error: 'Stripe API error: ' + error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
} 