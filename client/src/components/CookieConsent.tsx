import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Cookie, Settings } from 'lucide-react';

interface CookieConsentProps {
  onAccept: (preferences: CookiePreferences) => void;
  onDecline: () => void;
}

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    onAccept(allAccepted);
  };

  const handleAcceptSelected = () => {
    onAccept(preferences);
  };

  const handlePreferenceChange = (category: keyof CookiePreferences, checked: boolean) => {
    if (category === 'necessary') return; // Cannot be changed
    setPreferences(prev => ({
      ...prev,
      [category]: checked,
    }));
  };

  if (!showDetails) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg dark:bg-gray-900 dark:border-gray-700">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <Cookie className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                We use cookies to enhance your experience
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                We use cookies and similar technologies to provide essential website functionality, 
                analyze usage patterns, and improve our services. You can customize your preferences 
                or accept all cookies.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleAcceptAll} className="bg-blue-600 hover:bg-blue-700">
                  Accept All
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onDecline}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Decline Optional
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowDetails(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Customize
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Cookie Preferences</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDetails(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Manage your cookie preferences below. You can enable or disable different categories 
            of cookies and change your preferences at any time in your account settings.
          </p>

          {/* Necessary Cookies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  checked={preferences.necessary} 
                  disabled 
                  className="opacity-50"
                />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Necessary Cookies
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Required for basic website functionality and security
                  </p>
                </div>
              </div>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                Always Active
              </span>
            </div>
            <div className="ml-8 text-xs text-gray-500 dark:text-gray-400">
              <p>Includes: Session management, authentication, security, basic preferences</p>
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox 
                checked={preferences.analytics}
                onCheckedChange={(checked) => handlePreferenceChange('analytics', checked as boolean)}
              />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Analytics Cookies
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Help us understand how visitors interact with our website
                </p>
              </div>
            </div>
            <div className="ml-8 text-xs text-gray-500 dark:text-gray-400">
              <p>Includes: Mixpanel analytics, usage patterns, feature performance (anonymized)</p>
            </div>
          </div>

          {/* Functional Cookies */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox 
                checked={preferences.functional}
                onCheckedChange={(checked) => handlePreferenceChange('functional', checked as boolean)}
              />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Functional Cookies
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Enable enhanced functionality and personalization
                </p>
              </div>
            </div>
            <div className="ml-8 text-xs text-gray-500 dark:text-gray-400">
              <p>Includes: Language preferences, voice settings, UI customizations</p>
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox 
                checked={preferences.marketing}
                onCheckedChange={(checked) => handlePreferenceChange('marketing', checked as boolean)}
              />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Marketing Cookies
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Used to deliver relevant advertisements and measure effectiveness
                </p>
              </div>
            </div>
            <div className="ml-8 text-xs text-gray-500 dark:text-gray-400">
              <p>Includes: Advertising targeting, campaign tracking, conversion measurement</p>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row gap-3">
            <Button onClick={handleAcceptSelected} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Save Preferences
            </Button>
            <Button 
              variant="outline" 
              onClick={handleAcceptAll}
              className="flex-1"
            >
              Accept All
            </Button>
            <Button 
              variant="outline" 
              onClick={onDecline}
              className="flex-1"
            >
              Decline Optional
            </Button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t">
            <p>
              For more information about our use of cookies, please see our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> and{' '}
              <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a>.
              You can change these preferences at any time in your account settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CookieConsent;