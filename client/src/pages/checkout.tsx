import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/providers/auth-provider';
import { Loader2 } from 'lucide-react';

// Initialize Stripe with the publishable key
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// The checkout form component that will be wrapped by Elements
const CheckoutForm = ({ 
  plan, 
  amount, 
  interval,
  onSuccess
}: { 
  plan: string;
  amount: number;
  interval: string;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/profile?payment_success=true`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'An unexpected error occurred');
        toast({
          title: 'Payment failed',
          description: error.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
      } else {
        // Success case will redirect
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage('Failed to process payment, please try again');
      toast({
        title: 'Payment failed',
        description: 'Failed to process payment, please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {errorMessage}
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${amount} for ${plan} Access`
        )}
      </Button>
    </form>
  );
};

// Main checkout page component
export default function CheckoutPage() {
  const [location, navigate] = useLocation();
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthContext();
  
  // Get the plan details from the URL query parameters
  const params = new URLSearchParams(window.location.search);
  const plan = params.get('plan') || 'monthly';
  const planDetails = getPlanDetails(plan);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Create a payment intent on component mount
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: planDetails.amount,
            plan: planDetails.id,
            interval: planDetails.interval,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment. Please try again.');
        toast({
          title: 'Payment Error',
          description: 'Failed to initialize payment. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    createPaymentIntent();
  }, [isAuthenticated, plan, toast]);
  
  // Handle successful payment
  const handlePaymentSuccess = () => {
    toast({
      title: 'Payment Successful',
      description: `You have successfully purchased ${planDetails.name} access to Parrot Speak!`,
    });
    navigate('/profile');
  };
  
  // Loading state while checking authentication or creating payment intent
  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto py-16 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Preparing checkout...</p>
      </div>
    );
  }
  
  // Show error if payment intent creation failed
  if (error) {
    return (
      <div className="container max-w-md mx-auto py-16">
        <Card>
          <CardHeader>
            <CardTitle>Payment Error</CardTitle>
            <CardDescription>We encountered an error setting up your payment</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={() => navigate('/profile')}>
              Return to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If user already has active access, show message
  if (user?.subscriptionStatus === 'active') {
    return (
      <div className="container max-w-md mx-auto py-16">
        <Card>
          <CardHeader>
            <CardTitle>Active Access</CardTitle>
            <CardDescription>You already have active access to Parrot Speak</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You have active {user.subscriptionTier} access until {user.subscriptionExpiresAt 
                ? new Date(user.subscriptionExpiresAt).toLocaleDateString() 
                : 'unknown date'}.
            </p>
            <p className="mb-4">
              You can purchase additional access when your current access expires.
            </p>
            <Button onClick={() => navigate('/profile')}>
              Go to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Only render the Elements provider when we have a client secret
  if (clientSecret) {
    return (
      <div className="container max-w-md mx-auto py-16">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Purchase</CardTitle>
            <CardDescription>Buy {planDetails.name} Access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span>Plan:</span>
                <span className="font-medium">{planDetails.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Price:</span>
                <span className="font-medium">${planDetails.amount}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Payment Type:</span>
                <span className="font-medium">{planDetails.interval}</span>
              </div>
              <div className="flex justify-between">
                <span>Access Duration:</span>
                <span className="font-medium">{planDetails.duration}</span>
              </div>
            </div>
            
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'stripe',
                },
              }}
            >
              <CheckoutForm 
                plan={planDetails.name} 
                amount={planDetails.amount} 
                interval={planDetails.interval}
                onSuccess={handlePaymentSuccess} 
              />
            </Elements>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="ghost" onClick={() => navigate('/profile')}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Fallback while waiting for client secret
  return (
    <div className="container max-w-md mx-auto py-16 flex flex-col items-center justify-center min-h-[80vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Preparing checkout...</p>
    </div>
  );
}

// Helper function to get plan details based on the plan ID
function getPlanDetails(planId: string) {
  const plans = {
    // One-time payment plans
    "1week": {
      id: '1week',
      name: '1 Week',
      amount: 4.99,
      interval: 'one-time',
      duration: '7 days'
    },
    "1month": {
      id: '1month',
      name: '1 Month',
      amount: 14.99,
      interval: 'one-time',
      duration: '30 days'
    },
    "3months": {
      id: '3months',
      name: '3 Months',
      amount: 39.99,
      interval: 'one-time',
      duration: '90 days'
    },
    "6months": {
      id: '6months',
      name: '6 Months',
      amount: 69.99,
      interval: 'one-time',
      duration: '180 days'
    },
    
    // Subscription plans
    "monthly": {
      id: 'monthly',
      name: 'Monthly',
      amount: 10.00,
      interval: 'recurring',
      duration: 'Renewed monthly'
    },
    "annual": {
      id: 'annual',
      name: 'Annual',
      amount: 99.00,
      interval: 'recurring',
      duration: 'Renewed yearly'
    }
  };
  
  return plans[planId as keyof typeof plans] || plans["1month"];
}