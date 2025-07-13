import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

// Step 1: Request Reset - Form Schema
const requestResetSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

// Step 2: Reset Password - Form Schema
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export default function PasswordResetPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1); // Step 1: Request reset, Step 2: Enter new password
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  
  // Extract token from URL if present
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');
  
  if (tokenFromUrl && step === 1) {
    setToken(tokenFromUrl);
    setStep(2);
  }
  
  // Step 1: Request Password Reset Form
  const requestResetForm = useForm<z.infer<typeof requestResetSchema>>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: ''
    }
  });

  // Step 2: Reset Password Form
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  // Handle request password reset
  async function onRequestReset(data: z.infer<typeof requestResetSchema>) {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/auth/request-reset', data);
      setEmail(data.email);
      toast({
        title: 'Reset link sent',
        description: 'If an account exists with this email, you will receive a password reset link.',
      });
      setIsLoading(false);
      // We don't change the step here because the user needs to check their email
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again later.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  }

  // Handle reset password
  async function onResetPassword(data: z.infer<typeof resetPasswordSchema>) {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/auth/reset-password', {
        token,
        password: data.password
      });
      toast({
        title: 'Password reset successful',
        description: 'Your password has been reset. You can now log in with your new password.',
      });
      setIsLoading(false);
      // Redirect to login page
      navigate('/auth');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid or expired token. Please request a new reset link.',
        variant: 'destructive'
      });
      setIsLoading(false);
      setStep(1);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        {step === 1 ? (
          <>
            <CardHeader>
              <CardTitle>Reset Your Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...requestResetForm}>
                <form onSubmit={requestResetForm.handleSubmit(onRequestReset)} className="space-y-4">
                  <FormField
                    control={requestResetForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Reset Link...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Enter New Password</CardTitle>
              <CardDescription>
                Create a new password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...resetPasswordForm}>
                <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                  <FormField
                    control={resetPasswordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter new password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetPasswordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm new password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </>
        )}
        <CardFooter className="flex justify-center">
          <Button variant="ghost" onClick={() => navigate('/auth')}>
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}