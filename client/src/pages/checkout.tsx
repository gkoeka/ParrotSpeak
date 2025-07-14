import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/providers/auth-provider';
import { Loader2, Download, Smartphone, CheckCircle2, ArrowLeft } from 'lucide-react';

// Check if running in mobile app context
const isMobileApp = () => {
  return window.location.href.includes('mobile-app-preview') || 
         navigator.userAgent.includes('Mobile') ||
         window.innerWidth <= 768;
};

// IAP-based checkout component for mobile apps
const IAP_PurchaseForm = ({ 
  plan, 
  amount, 
  onSuccess
}: { 
  plan: string;
  amount: number;
  onSuccess: () => void;
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    
    try {
      // Simulate IAP purchase flow
      toast({
        title: 'Purchase Initiated',
        description: 'Opening app store for purchase...',
      });
      
      // In a real mobile app, this would trigger IAP
      setTimeout(() => {
        toast({
          title: 'Purchase Successful',
          description: `You now have ${plan} access to ParrotSpeak!`,
        });
        onSuccess();
      }, 2000);
      
    } catch (error) {
      toast({
        title: 'Purchase Failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-primary/10 rounded-lg">
        <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Secure purchase through your app store
        </p>
      </div>
      
      <Button 
        onClick={handlePurchase}
        className="w-full" 
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Purchase ${plan} for $${amount}`
        )}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        You'll be redirected to your app store to complete the purchase
      </p>
    </div>
  );
};

// Mobile app download component for web users
const MobileAppDownload = ({ planName }: { planName: string }) => {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <Smartphone className="h-8 w-8 text-primary" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-2">Download Our Mobile App</h3>
        <p className="text-muted-foreground mb-4">
          To purchase {planName} access, please download our mobile app where you can make secure purchases through your app store.
        </p>
      </div>
      
      <div className="space-y-3">
        <Button className="w-full" size="lg" asChild>
          <a href="#" className="flex items-center justify-center gap-2">
            <Download className="h-5 w-5" />
            Download for iOS
          </a>
        </Button>
        
        <Button variant="outline" className="w-full" size="lg" asChild>
          <a href="#" className="flex items-center justify-center gap-2">
            <Download className="h-5 w-5" />
            Download for Android
          </a>
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>• Secure in-app purchases</p>
        <p>• Full feature access</p>
        <p>• Automatic updates</p>
      </div>
    </div>
  );
};

// Main checkout page component
export default function CheckoutPage() {
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthContext();
  
  // Get the plan details from the URL query parameters
  const params = new URLSearchParams(window.location.search);
  const plan = params.get('plan') || 'monthly';
  const planDetails = getPlanDetails(plan);
  
  // Check if user is on mobile
  const isOnMobile = isMobileApp();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Initialize page
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [isAuthenticated]);
  
  // Handle successful purchase
  const handlePurchaseSuccess = () => {
    toast({
      title: 'Welcome to ParrotSpeak!',
      description: `You now have ${planDetails.name} access. Start translating right away!`,
    });
    navigate('/');
  };
  
  // Loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container max-w-md mx-auto py-16 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Preparing checkout...</p>
      </div>
    );
  }
  
  // If user already has active access, show message
  if (user?.subscription_status === 'active') {
    return (
      <div className="container max-w-md mx-auto py-16">
        <Card>
          <CardHeader>
            <CardTitle>Active Access</CardTitle>
            <CardDescription>You already have active access to ParrotSpeak</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You have active {user.subscription_tier} access until {user.subscription_expires_at 
                ? new Date(user.subscription_expires_at).toLocaleDateString() 
                : 'unknown date'}.
            </p>
            <p className="mb-4">
              You can purchase additional access when your current access expires.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Start Translating
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Choose Your Plan</CardTitle>
              <CardDescription>
                {isOnMobile ? 'Secure purchase through app store' : 'Get our mobile app to purchase'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Plan details */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Plan:</span>
              <span>{planDetails.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Price:</span>
              <span className="text-lg font-bold">${planDetails.amount}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Duration:</span>
              <span>{planDetails.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Type:</span>
              <span className="capitalize">{planDetails.interval}</span>
            </div>
          </div>
          
          {/* Show IAP form for mobile, download for web */}
          {isOnMobile ? (
            <IAP_PurchaseForm 
              plan={planDetails.name} 
              amount={planDetails.amount} 
              onSuccess={handlePurchaseSuccess} 
            />
          ) : (
            <MobileAppDownload planName={planDetails.name} />
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-muted-foreground"
          >
            Maybe later
          </Button>
        </CardFooter>
      </Card>
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
      amount: 9.99,
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
  
  return plans[planId as keyof typeof plans] || plans["monthly"];
}