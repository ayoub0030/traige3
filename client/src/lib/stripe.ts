import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export default stripePromise;

// Payment utilities
export const createSubscriptionPayment = async (planType: string = 'premium') => {
  try {
    const response = await fetch('/api/payments/create-subscription-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planType }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating subscription payment:', error);
    throw error;
  }
};

export const createCoinsPayment = async (packType: string) => {
  try {
    const response = await fetch('/api/payments/create-coins-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ packType }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating coins payment:', error);
    throw error;
  }
};

export const getPaymentPlans = async () => {
  try {
    const response = await fetch('/api/payments/plans');
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching payment plans:', error);
    throw error;
  }
};