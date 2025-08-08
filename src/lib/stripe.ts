import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
      // Enable sandbox mode logging
      typescript: true,
    })
  : null;

// Client-side Stripe instance
export const getStripe = () => {
  if (typeof window !== 'undefined') {
    return require('@stripe/stripe-js').loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return null;
};

// Helper function to validate Stripe configuration
export const validateStripeConfig = () => {
  const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
  const hasPublishableKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;
  
  return {
    isValid: hasSecretKey && hasPublishableKey && hasWebhookSecret,
    missing: {
      secretKey: !hasSecretKey,
      publishableKey: !hasPublishableKey,
      webhookSecret: !hasWebhookSecret,
    }
  };
}; 