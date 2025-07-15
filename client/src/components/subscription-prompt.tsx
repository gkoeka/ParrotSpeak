import { AlertTriangle, Crown, Clock, X, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";

interface SubscriptionPromptProps {
  feature: string;
  isExpired?: boolean;
  expiresAt?: Date;
  daysRemaining?: number | null;
  onClose?: () => void;
  hasEverSubscribed?: boolean;
  open?: boolean;
}

export function SubscriptionPrompt({ 
  feature, 
  isExpired = false, 
  expiresAt, 
  daysRemaining,
  onClose,
  hasEverSubscribed = false,
  open = true
}: SubscriptionPromptProps) {
  const [, setLocation] = useLocation();

  const handleUpgrade = (planId: string) => {
    onClose?.(); // Close modal first
    setLocation(`/checkout?plan=${planId}`); // Go to checkout page with selected plan
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Determine user state and messaging
  const isNewUser = !hasEverSubscribed && !isExpired;
  const isReturningCustomer = hasEverSubscribed || isExpired;
  
  let title, description, buttonText;
  
  if (isNewUser) {
    title = "Connect with Others";
    description = "Please purchase a plan that fits your needs to make meaningful connections worldwide";
    buttonText = "Choose your plan";
  } else if (isReturningCustomer) {
    title = "Keep the Conversation Going";
    description = "Choose a plan again to keep connecting and grow your global network";
    buttonText = "Choose a plan again";
  } else {
    // Fallback
    title = "Connect with Others";
    description = "Please purchase a plan that fits your needs to make meaningful connections worldwide";
    buttonText = "Choose your plan";
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="w-[90vw] max-w-sm">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Crown className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </DialogHeader>
        
        {/* Plan Options */}
        <div className="space-y-3 pt-4">
          {/* One-time Purchase Plans */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">One-Time Purchase</h4>
            
            <Button 
              onClick={() => handleUpgrade('1week')} 
              variant="outline"
              className="w-full flex justify-between p-3 h-auto"
            >
              <div className="text-left">
                <div className="font-medium">1 Week</div>
                <div className="text-xs text-muted-foreground">7 days access</div>
              </div>
              <div className="font-bold">$4.99</div>
            </Button>
            
            <Button 
              onClick={() => handleUpgrade('1month')} 
              variant="outline"
              className="w-full flex justify-between p-3 h-auto"
            >
              <div className="text-left">
                <div className="font-medium">1 Month</div>
                <div className="text-xs text-muted-foreground">30 days access</div>
              </div>
              <div className="font-bold">$14.99</div>
            </Button>
            
            <Button 
              onClick={() => handleUpgrade('3months')} 
              variant="outline"
              className="w-full flex justify-between p-3 h-auto"
            >
              <div className="text-left">
                <div className="font-medium">3 Months</div>
                <div className="text-xs text-muted-foreground">90 days access</div>
              </div>
              <div className="font-bold">$39.99</div>
            </Button>
            
            <Button 
              onClick={() => handleUpgrade('6months')} 
              variant="outline"
              className="w-full flex justify-between p-3 h-auto"
            >
              <div className="text-left">
                <div className="font-medium">6 Months</div>
                <div className="text-xs text-muted-foreground">180 days access</div>
              </div>
              <div className="font-bold">$69.99</div>
            </Button>
          </div>
          
          {/* Subscription Plans */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recurring Plans</h4>
            
            <Button 
              onClick={() => handleUpgrade('monthly')} 
              className="w-full flex justify-between p-3 h-auto bg-blue-600 hover:bg-blue-700"
            >
              <div className="text-left">
                <div className="font-medium flex items-center gap-2">
                  Monthly <Badge variant="secondary" className="text-xs">Popular</Badge>
                </div>
                <div className="text-xs text-blue-100">Renewed monthly</div>
              </div>
              <div className="font-bold">$9.99</div>
            </Button>
            
            <Button 
              onClick={() => handleUpgrade('annual')} 
              className="w-full flex justify-between p-3 h-auto bg-green-600 hover:bg-green-700"
            >
              <div className="text-left">
                <div className="font-medium flex items-center gap-2">
                  Annual <Badge variant="secondary" className="text-xs">Best Value</Badge>
                </div>
                <div className="text-xs text-green-100">Renewed yearly</div>
              </div>
              <div className="font-bold">$99.00</div>
            </Button>
          </div>
          
          {onClose && (
            <Button 
              variant="ghost" 
              onClick={handleClose}
              className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mt-4"
            >
              Maybe later
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SubscriptionAlert({ 
  feature, 
  isExpired = false, 
  daysRemaining 
}: Omit<SubscriptionPromptProps, 'onClose'>) {
  const [, setLocation] = useLocation();

  if (isExpired) {
    return (
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800 dark:text-orange-200">
          Subscription Required
        </AlertTitle>
        <AlertDescription className="text-orange-700 dark:text-orange-300">
          Your subscription has expired. 
          <Button 
            variant="link" 
            className="p-0 h-auto ml-1 text-orange-600 hover:text-orange-700"
            onClick={() => setLocation('/profile')}
          >
            Renew now
          </Button> to continue using {feature}.
        </AlertDescription>
      </Alert>
    );
  }

  if (daysRemaining !== null && daysRemaining !== undefined && daysRemaining <= 7) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">
          Subscription Expiring Soon
        </AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          Your subscription expires in {daysRemaining} days. 
          <Button 
            variant="link" 
            className="p-0 h-auto ml-1 text-yellow-600 hover:text-yellow-700"
            onClick={() => setLocation('/profile')}
          >
            Renew now
          </Button> to avoid interruption.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
      <Crown className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800 dark:text-blue-200">
        Premium Feature Required
      </AlertTitle>
      <AlertDescription className="text-blue-700 dark:text-blue-300">
        {feature} requires an active subscription. 
        <Button 
          variant="link" 
          className="p-0 h-auto ml-1 text-blue-600 hover:text-blue-700"
          onClick={() => setLocation('/profile')}
        >
          Subscribe now
        </Button> to unlock all translation features.
      </AlertDescription>
    </Alert>
  );
}