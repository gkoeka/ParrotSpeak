import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ConversationsPage from "@/pages/conversations";
import VoiceSettingsPage from "@/pages/voice-settings";
import SettingsPage from "@/pages/settings";
import AnalyticsPage from "@/pages/analytics";
import MobilePreviewPage from "@/pages/mobile-preview";
import ProfilePage from "@/pages/profile";
import CheckoutPage from "@/pages/checkout";
import AdminPage from "@/pages/admin";
import AdminAuthorizePage from "@/pages/admin-authorize";
import AdminMFASetup from "@/pages/admin-mfa-setup";
import AppSidebar from "@/components/app-sidebar";
import MobileNavigation from "@/components/mobile-navigation";
import { apiRequest } from "@/lib/queryClient";
import { Conversation } from "@/types";
import { ThemeProvider } from "./providers/theme-provider";
import { ConversationProvider } from "./providers/conversation-provider";
import { AuthProvider } from "./providers/auth-provider";
import { ProtectedRoute } from "@/components/protected-route";
import AuthPage from "@/pages/auth";
import PasswordResetPage from "@/pages/password-reset";
import PrivacyPage from "@/pages/privacy";
import CookiesPage from "@/pages/cookies";
import CookieConsent from "@/components/CookieConsent";

function MainLayout() {
  const [location, setLocation] = useLocation();
  
  // Fetch conversations for the sidebar
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest('GET', queryKey[0] as string);
      return response.json();
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <AppSidebar conversations={conversations} isLoading={isLoading} />
      </div>
      
      <div className="flex-1 overflow-auto pb-16 md:pb-0">
        <Switch>
          <ProtectedRoute path="/" component={Home} />
          <ProtectedRoute path="/conversations" component={ConversationsPage} />
          <ProtectedRoute path="/conversation/:id" component={Home} />
          <ProtectedRoute path="/settings" component={SettingsPage} />
          <ProtectedRoute path="/voice-settings" component={VoiceSettingsPage} />
          <ProtectedRoute path="/analytics" component={AnalyticsPage} />
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <ProtectedRoute path="/checkout" component={CheckoutPage} />
          <ProtectedRoute path="/admin" component={AdminPage} />
          <ProtectedRoute path="/admin-mfa-setup" component={AdminMFASetup} />
          <Route path="/admin-authorize" component={AdminAuthorizePage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/password-reset" component={PasswordResetPage} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/cookies" component={CookiesPage} />
          <Route component={NotFound} />
        </Switch>
        
        {/* Mobile bottom navigation */}
        <MobileNavigation />
      </div>
    </div>
  );
}

function App() {
  const [location] = useLocation();
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  useEffect(() => {
    // Check if user has already made cookie consent choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setShowCookieConsent(true);
    }
  }, []);

  const handleCookieAccept = async (preferences: any) => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setShowCookieConsent(false);
    
    // Send preferences to server
    try {
      await apiRequest('POST', '/api/analytics/consent', {
        body: JSON.stringify({
          analyticsEnabled: preferences.analytics,
          functionalEnabled: preferences.functional,
          marketingEnabled: preferences.marketing
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Failed to save cookie preferences:', error);
    }
  };

  const handleCookieDecline = () => {
    const declinedPreferences = {
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false
    };
    localStorage.setItem('cookieConsent', JSON.stringify(declinedPreferences));
    setShowCookieConsent(false);
  };
  
  // If we're on the mobile preview page, don't show the normal layout
  if (location === '/mobile-preview') {
    return (
      <ThemeProvider defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <MobilePreviewPage />
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    );
  }
  
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ConversationProvider>
            <MainLayout />
            <Toaster />
            {showCookieConsent && (
              <CookieConsent 
                onAccept={handleCookieAccept}
                onDecline={handleCookieDecline}
              />
            )}
          </ConversationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
