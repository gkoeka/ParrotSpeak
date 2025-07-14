import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Cookie Policy</CardTitle>
            <p className="text-center text-muted-foreground">Last updated: June 4, 2025</p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h2>What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and enabling essential functionality.
            </p>

            <h2>Types of Cookies We Use</h2>
            
            <h3>1. Necessary Cookies (Always Active)</h3>
            <p>These cookies are essential for the website to function properly and cannot be disabled.</p>
            <ul>
              <li><strong>Authentication cookies:</strong> Keep you logged in securely</li>
              <li><strong>Session cookies:</strong> Maintain your session state across pages</li>
              <li><strong>Security cookies:</strong> Protect against CSRF attacks and ensure secure connections</li>
              <li><strong>Load balancing cookies:</strong> Ensure consistent performance</li>
            </ul>
            
            <h3>2. Analytics Cookies (Optional)</h3>
            <p>Help us understand how you use our service to improve performance and user experience.</p>
            <ul>
              <li><strong>Mixpanel analytics:</strong> Track feature usage and user behavior patterns</li>
              <li><strong>Performance monitoring:</strong> Monitor page load times and error rates</li>
              <li><strong>Usage statistics:</strong> Understand which features are most valuable</li>
            </ul>
            <p><em>Note: All analytics data is anonymized and cannot be used to identify individual users.</em></p>
            
            <h3>3. Functional Cookies (Optional)</h3>
            <p>Remember your preferences and settings to provide a personalized experience.</p>
            <ul>
              <li><strong>Language preferences:</strong> Remember your preferred interface language</li>
              <li><strong>Theme settings:</strong> Save your dark/light mode preference</li>
              <li><strong>Voice settings:</strong> Remember your custom voice profile preferences</li>
              <li><strong>UI preferences:</strong> Save sidebar state and layout preferences</li>
            </ul>
            
            <h3>4. Marketing Cookies (Optional)</h3>
            <p>Currently not used. Reserved for future marketing and advertising features.</p>

            <h2>How We Use Cookies</h2>
            <ul>
              <li>Provide secure authentication and session management</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns to improve our service</li>
              <li>Ensure optimal performance and security</li>
              <li>Deliver personalized content and experiences</li>
            </ul>

            <h2>Third-Party Cookies</h2>
            <p>We may use third-party services that set their own cookies:</p>
            <ul>
              <li><strong>App Store:</strong> For secure payment processing (necessary for subscriptions)</li>
              <li><strong>Mixpanel:</strong> For analytics and user behavior tracking (with your consent)</li>
            </ul>
            
            <h2>Managing Your Cookie Preferences</h2>
            
            <h3>Through Our Website</h3>
            <ul>
              <li>Use our cookie consent banner when first visiting</li>
              <li>Update preferences in your account settings</li>
              <li>Contact support to modify consent choices</li>
            </ul>
            
            <h3>Through Your Browser</h3>
            <p>You can control cookies through your browser settings:</p>
            <ul>
              <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
            </ul>
            
            <p><strong>Important:</strong> Disabling necessary cookies may affect website functionality and prevent you from using certain features.</p>

            <h2>Cookie Retention</h2>
            <ul>
              <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Authentication cookies:</strong> 7 days (or until logout)</li>
              <li><strong>Preference cookies:</strong> 1 year</li>
              <li><strong>Analytics cookies:</strong> 2 years (anonymized after 1 year)</li>
            </ul>

            <h2>Updates to This Policy</h2>
            <p>
              We may update this cookie policy to reflect changes in our practices or legal requirements. 
              Users will be notified of material changes through our website or email.
            </p>

            <h2>Contact Us</h2>
            <p>For questions about our cookie policy or to manage your preferences:</p>
            <ul>
              <li>Email: privacy@parrotspeak.app</li>
              <li>Use the feedback form in the app</li>
              <li>Visit your account settings</li>
            </ul>

            <div className="border-t pt-6 mt-8">
              <h3>Technical Details</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Session Storage:</strong> Encrypted PostgreSQL database</p>
                <p><strong>Security:</strong> HTTPOnly, Secure, SameSite=Strict flags</p>
                <p><strong>Compliance:</strong> GDPR, CCPA, and ePrivacy Directive compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}