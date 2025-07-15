import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/providers/auth-provider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, Settings, Shield, Download, UserX, AlertTriangle, BarChart3, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";

export default function ProfilePage() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("account");
  
  // Form state for profile updates
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || ""
  });

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update form state when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || ""
      });
    }
  }, [user]);

  // Get analytics consent status
  const { data: analyticsConsent, isLoading: consentLoading } = useQuery({
    queryKey: ["/api/analytics/consent"],
    enabled: isAuthenticated
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: typeof profileForm) => {
      console.log('Submitting profile data:', profileData);
      const res = await apiRequest("PATCH", "/api/auth/user", profileData);
      const data = await res.json();
      console.log('Profile update response:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      console.log('Profile update successful:', data);
      toast({
        title: "Profile Updated",
        description: "Your account information has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('Profile update error:', error);
      toast({
        title: "Failed to Update Profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update analytics consent mutation
  const updateAnalyticsConsentMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("POST", "/api/analytics/consent", { enabled });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/consent"] });
      toast({
        title: "Privacy Settings Updated",
        description: data.enabled 
          ? "Analytics tracking is now enabled. This helps us improve the app."
          : "Analytics tracking is now disabled. Your usage data will not be collected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cancel-subscription");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully. You'll continue to have access until your current billing period ends.",
      });
      // Refresh the page to update subscription status
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Cancel Subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/export-data");
      return res.blob();
    },
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parrotspeak-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Data Exported",
        description: "Your data has been downloaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Export Data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/delete-account");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });
      // Log out and redirect to home
      logout();
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/auth/change-password", passwordData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      // Reset password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Change Password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Password change handler
  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure your new password and confirmation match.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate password according to NIST guidelines
    const { validatePassword } = await import('@shared/password-validation');
    const passwordValidation = validatePassword(newPassword);
    
    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid Password",
        description: passwordValidation.errors.join('. '),
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    navigate("/auth");
    return null;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const getNameInitials = () => {
    if (user?.firstName) {
      // Use first two letters of first name or first letter + 'U' for User
      return user.firstName.length > 1 
        ? user.firstName.substring(0, 2).toUpperCase()
        : `${user.firstName[0]}U`.toUpperCase();
    } else if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "US";
  };

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect browser
    if (userAgent.includes('Edg/')) {
      browser = 'Edge';
    } else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) {
      // Check if it's actually Brave or just Chrome
      browser = userAgent.includes('Brave') ? 'Brave' : 'Chrome';
    } else if (userAgent.includes('Firefox/')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
      browser = 'Safari';
    }

    // Detect OS
    if (userAgent.includes('Mac OS X') || userAgent.includes('Macintosh')) {
      os = 'macOS';
    } else if (userAgent.includes('Windows NT')) {
      os = 'Windows';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      os = 'iOS';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    }

    // Special case for Replit desktop app
    if (userAgent.includes('Electron') || userAgent.includes('Replit')) {
      browser = 'Replit Desktop';
    }

    return `${browser} on ${os}`;
  };

  return (
    <>
      <Header />
      <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Account & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your account details and subscription settings
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                  <AvatarFallback className="text-lg">{getNameInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-lg">{user?.firstName || user?.email}</div>
                  <div className="text-muted-foreground">{user?.email}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="hidden md:block">
            <div className="space-y-1">
              <Button
                variant={activeTab === "account" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setActiveTab("account")}
              >
                <User className="h-4 w-4" />
                Account
              </Button>
              <Button
                variant={activeTab === "billing" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setActiveTab("billing")}
              >
                <CreditCard className="h-4 w-4" />
                Billing & Plans
              </Button>
              <Button
                variant={activeTab === "security" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setActiveTab("security")}
              >
                <Shield className="h-4 w-4" />
                Security
              </Button>
              <Button
                variant={activeTab === "privacy" ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setActiveTab("privacy")}
              >
                <BarChart3 className="h-4 w-4" />
                Privacy
              </Button>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="block md:hidden">
            <Tabs defaultValue="account" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="account">
                  <User className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="billing">
                  <CreditCard className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Shield className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="privacy">
                  <BarChart3 className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Account Information */}
          {activeTab === "account" && (
            <>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Manage your account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={profileForm.firstName} 
                          onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={profileForm.lastName} 
                          onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={profileForm.email} 
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>

                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Logout Section */}
                  <div className="border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <LogOut className="h-5 w-5 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-destructive">Logout</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sign out of your ParrotSpeak account. You'll need to sign in again to access your conversations and settings.
                        </p>
                        <Button 
                          variant="destructive" 
                          className="mt-3"
                          onClick={() => logout()}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={() => updateProfileMutation.mutate(profileForm)}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>

              {/* Data Management */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>
                    Export your data or delete your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <Download className="h-5 w-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-medium">Export Your Data</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Download all your conversations, voice profiles, and account data in JSON format.
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={() => exportDataMutation.mutate()}
                            disabled={exportDataMutation.isPending}
                          >
                            {exportDataMutation.isPending ? "Exporting..." : "Export Data"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-medium text-red-900">Delete Account</h3>
                          <p className="text-sm text-red-700 mb-3">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive">
                                <UserX className="h-4 w-4 mr-2" />
                                Delete Account
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Account</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:
                                  <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>All conversations and messages</li>
                                    <li>Voice profiles and settings</li>
                                    <li>Account information</li>
                                    <li>Subscription history</li>
                                  </ul>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => deleteAccountMutation.mutate()}
                                  disabled={deleteAccountMutation.isPending}
                                >
                                  {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Billing & Plans */}
          {activeTab === "billing" && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>
                  Choose the plan that's right for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  {/* Current Subscription Status */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>Current Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {user?.subscriptionTier 
                              ? (user?.subscriptionStatus === "active" 
                                  ? `${user.subscriptionTier} Plan` 
                                  : "Your plan is complete")
                              : "Free Plan"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user?.subscriptionStatus === "active" && user?.subscriptionExpiresAt 
                              ? `Renews on ${new Date(user.subscriptionExpiresAt).toLocaleDateString()}`
                              : (user?.subscriptionTier && user?.subscriptionStatus !== "active"
                                  ? "Plan has ended - purchase another plan to continue"
                                  : "Limited features available")}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!user?.subscriptionTier && (
                            <Button variant="outline">
                              Upgrade
                            </Button>
                          )}
                          {user?.subscriptionStatus === "active" && user?.subscriptionTier && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" className="text-red-600 hover:text-red-700">
                                  Cancel Subscription
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel your subscription? You'll continue to have access until your current billing period ends on {user?.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : 'the end of your billing period'}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => cancelSubscriptionMutation.mutate()}
                                    disabled={cancelSubscriptionMutation.isPending}
                                  >
                                    {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Available Plans */}
                  <div className="grid gap-4">
                    <h3 className="text-lg font-medium">Available Plans</h3>
                    
                    {/* One-time payment plans */}
                    <h4 className="text-base font-medium text-muted-foreground">One-Time Payments</h4>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {/* 1 Week Plan */}
                      <Card className="relative">
                        <CardHeader>
                          <CardTitle>1 Week</CardTitle>
                          <CardDescription>
                            Perfect for short trips
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">$4.99</div>
                          <div className="text-sm text-muted-foreground mb-4">one-time payment</div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Unlimited translations</li>
                            <li>Voice-to-Voice conversation</li>
                            <li>Visual translation</li>
                            <li>7 days of access</li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => navigate("/checkout?plan=1week")}
                          >
                            Buy Now
                          </Button>
                        </CardFooter>
                      </Card>

                      {/* 1 Month Plan */}
                      <Card className="relative">
                        <CardHeader>
                          <CardTitle>1 Month</CardTitle>
                          <CardDescription>
                            Great for longer trips
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">$14.99</div>
                          <div className="text-sm text-muted-foreground mb-4">one-time payment</div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>All basic features</li>
                            <li>Offline mode</li>
                            <li>Priority support</li>
                            <li>30 days of access</li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => navigate("/checkout?plan=1month")}
                          >
                            Buy Now
                          </Button>
                        </CardFooter>
                      </Card>

                      {/* 3 Months Plan */}
                      <Card className="relative">
                        <CardHeader>
                          <CardTitle>3 Months</CardTitle>
                          <CardDescription>
                            Better value for longer stays
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">$39.99</div>
                          <div className="text-sm text-muted-foreground mb-4">one-time payment</div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>All 1-month features</li>
                            <li>Voice profile customization</li>
                            <li>Save 11% vs monthly</li>
                            <li>90 days of access</li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => navigate("/checkout?plan=3months")}
                          >
                            Buy Now
                          </Button>
                        </CardFooter>
                      </Card>

                      {/* 6 Months Plan */}
                      <Card className="relative">
                        <CardHeader>
                          <CardTitle>6 Months</CardTitle>
                          <CardDescription>
                            Value for extended use
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">$69.99</div>
                          <div className="text-sm text-muted-foreground mb-4">one-time payment</div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>All premium features</li>
                            <li>Multiple device sync</li>
                            <li>Save 22% vs monthly</li>
                            <li>180 days of access</li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => navigate("/checkout?plan=6months")}
                          >
                            Buy Now
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                    
                    {/* Subscription plans */}
                    <h4 className="text-base font-medium text-muted-foreground pt-4">Recurring Subscriptions</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Monthly Subscription */}
                      <Card className="relative border-primary">
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-md rounded-tr-md">
                          Popular
                        </div>
                        <CardHeader>
                          <CardTitle>Monthly</CardTitle>
                          <CardDescription>
                            Convenient recurring access
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">$10<span className="text-xl">/month</span></div>
                          <div className="text-sm text-muted-foreground mb-4">billed monthly</div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>All premium features</li>
                            <li>Cloud backup of conversations</li>
                            <li>Premium voice profiles</li>
                            <li>Cancel anytime</li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full"
                            onClick={() => navigate("/checkout?plan=monthly")}
                          >
                            Subscribe
                          </Button>
                        </CardFooter>
                      </Card>

                      {/* Annual Subscription */}
                      <Card className="relative">
                        <div className="absolute top-0 right-0 bg-green-600 text-white text-xs px-2 py-1 rounded-bl-md rounded-tr-md">
                          Best Value
                        </div>
                        <CardHeader>
                          <CardTitle>Annual</CardTitle>
                          <CardDescription>
                            Save with yearly billing
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">$99<span className="text-xl">/year</span></div>
                          <div className="text-sm text-muted-foreground mb-4">billed annually</div>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>All monthly subscription features</li>
                            <li>Save $21 compared to monthly</li>
                            <li>Priority technical support</li>
                            <li>Early access to new features</li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            className="w-full"
                            onClick={() => navigate("/checkout?plan=annual")}
                          >
                            Subscribe
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your security settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input 
                        id="currentPassword" 
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input 
                        id="newPassword" 
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="font-medium">Your new password must include:</div>
                        <ul className="text-xs space-y-1 ml-2">
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            At least 8 characters long
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            One uppercase letter (A-Z)
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            One lowercase letter (a-z)
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            One number (0-9)
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            One special character (!@#$%^&*)
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button 
                    className="mt-2"
                    onClick={handlePasswordChange}
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                  </Button>
                </div>

                <Separator />

                {/* Login Sessions (future feature) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Login Sessions</h3>
                  <p className="text-muted-foreground">
                    View and manage your active login sessions across devices.
                  </p>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Current Session</div>
                        <div className="text-sm text-muted-foreground">{getBrowserInfo()} • This device</div>
                      </div>
                      <div className="text-sm text-green-600">Active</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy Settings */}
          {activeTab === "privacy" && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Privacy & Analytics</CardTitle>
                <CardDescription>
                  Control how your data is used to improve ParrotSpeak
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-medium">Usage Analytics</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Analytics are enabled by default to help us improve ParrotSpeak with anonymous usage data. 
                        This includes language pairs used, feature usage patterns, and performance metrics. 
                        You can opt out anytime - no conversation content, personal information, or voice recordings are ever shared.
                      </p>
                    </div>
                    <Switch
                      checked={analyticsConsent?.analyticsEnabled || false}
                      onCheckedChange={(checked) => updateAnalyticsConsentMutation.mutate(checked)}
                      disabled={updateAnalyticsConsentMutation.isPending || consentLoading}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">What We Track (When Enabled)</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        Language pairs and translation frequency
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        Feature usage (voice profiles, visual translation)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        App performance and error rates
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        Session duration and navigation patterns
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">What We Never Track</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        Conversation content or translations
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        Voice recordings or audio data
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        Personal information or identifiable data
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        Location data or device information
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Privacy-First Analytics
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                          All analytics data is anonymized and encrypted before being processed. 
                          You can opt out at any time, and your preference will be respected immediately.
                        </p>
                      </div>
                    </div>
                  </div>

                  {analyticsConsent?.analyticsEnabled && analyticsConsent?.consentDate && (
                    <div className="text-xs text-muted-foreground">
                      Analytics enabled on {new Date(analyticsConsent.consentDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </>
  );
}