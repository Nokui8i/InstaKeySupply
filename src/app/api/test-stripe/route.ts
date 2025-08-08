import { NextRequest, NextResponse } from 'next/server';
import { stripe, validateStripeConfig } from '../../../lib/stripe';

export async function GET(request: NextRequest) {
  try {
    // Validate Stripe configuration
    const configValidation = validateStripeConfig();
    
    if (!configValidation.isValid) {
      return NextResponse.json({
        status: 'error',
        message: 'Stripe configuration incomplete',
        missing: configValidation.missing,
        sandboxMode: false,
      }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({
        status: 'error',
        message: 'Stripe not initialized',
        sandboxMode: false,
      }, { status: 500 });
    }

    // Test Stripe connection by creating a test payment intent
    const testPaymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00
      currency: 'usd',
      metadata: {
        test: 'true',
        environment: 'sandbox',
      },
    });

    // Check if we're in sandbox mode (test keys start with sk_test_)
    const isSandboxMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false;

    return NextResponse.json({
      status: 'success',
      message: 'Stripe is properly configured and connected',
      sandboxMode: isSandboxMode,
      testPaymentIntentId: testPaymentIntent.id,
      configuration: {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        environment: process.env.NODE_ENV || 'development',
      },
      sandboxTestingInfo: {
        testCardNumbers: [
          '4242424242424242', // Visa (success)
          '4000000000000002', // Visa (declined)
          '4000000000009995', // Visa (insufficient funds)
          '5555555555554444', // Mastercard (success)
          '2223003122003222', // Mastercard (success)
        ],
        testExpiryDate: '12/34',
        testCVC: '123',
        testZipCode: '12345',
      },
      webhookEndpoint: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/stripe`,
    });

  } catch (error: any) {
    console.error('Stripe test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test Stripe connection',
      error: error.message,
      sandboxMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false,
    }, { status: 500 });
  }
}
