import { loadStripe } from '@stripe/stripe-js';

// Get the Stripe publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  console.error('All env vars:', import.meta.env);
  throw new Error('Missing Stripe publishable key. Please check your .env file.');
}

// Initialize Stripe
export const stripe = await loadStripe(stripePublishableKey);

export interface PaymentData {
  amount: number;
  currency: string;
  description: string;
  metadata: {
    registration_id: string;
    participant_name: string;
    participant_email: string;
  };
}