import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
            <p className="text-center text-muted-foreground">Last updated: June 4, 2025</p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h2>1. Information We Collect</h2>
            <h3>Personal Information</h3>
            <ul>
              <li>Email address and account credentials</li>
              <li>Name and profile information</li>
              <li>Purchase information (processed securely through app store billing)</li>
            </ul>
            
            <h3>Usage Data</h3>
            <ul>
              <li>Voice recordings for translation purposes (processed and immediately deleted)</li>
              <li>Translation requests and conversation history</li>
              <li>App usage analytics and performance metrics</li>
              <li>Device information and technical logs</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <ul>
              <li>Provide voice-to-voice translation services</li>
              <li>Process purchases and manage access</li>
              <li>Improve translation accuracy and app performance</li>
              <li>Send important service notifications</li>
              <li>Ensure platform security and prevent abuse</li>
            </ul>

            <h2>3. Data Protection</h2>
            <h3>Encryption</h3>
            <p>All conversation data is encrypted using AES-256 encryption both in transit and at rest.</p>
            
            <h3>Voice Data</h3>
            <p>Voice recordings are processed for translation and immediately deleted. We do not store or retain voice recordings.</p>
            
            <h3>Access Controls</h3>
            <p>Strict access controls ensure only authorized personnel can access user data, and only when necessary for service operation.</p>

            <h2>4. Data Sharing</h2>
            <p>We do not sell or share your personal data with third parties except:</p>
            <ul>
              <li>OpenAI (for translation processing - data not retained by OpenAI)</li>
              <li>App store platforms (for purchase processing and validation)</li>
              <li>Law enforcement when legally required</li>
            </ul>

            <h2>5. Your Rights</h2>
            <h3>GDPR Rights (EU Users)</h3>
            <ul>
              <li>Right to access your personal data</li>
              <li>Right to rectify inaccurate data</li>
              <li>Right to delete your data</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>
            
            <h3>CCPA Rights (California Users)</h3>
            <ul>
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of data selling (we don't sell data)</li>
              <li>Right to non-discrimination</li>
            </ul>

            <h2>6. Data Retention</h2>
            <ul>
              <li>Conversation data: 2 years from last access</li>
              <li>Account data: Until account deletion</li>
              <li>Analytics data: 25 months (anonymized after 12 months)</li>
              <li>Payment data: As required by law and app store policies</li>
            </ul>

            <h2>7. Cookies and Tracking</h2>
            <p>We use cookies for:</p>
            <ul>
              <li>Essential site functionality (always active)</li>
              <li>Analytics and performance monitoring (with your consent)</li>
              <li>User preferences and settings (with your consent)</li>
            </ul>
            <p>You can manage cookie preferences in your account settings or through our cookie consent banner.</p>

            <h2>8. International Transfers</h2>
            <p>Your data may be processed in countries outside your residence. We ensure adequate protection through:</p>
            <ul>
              <li>Standard Contractual Clauses (SCCs)</li>
              <li>Adequacy decisions by relevant authorities</li>
              <li>Appropriate safeguards and security measures</li>
            </ul>

            <h2>9. Children's Privacy</h2>
            <p>ParrotSpeak is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>

            <h2>10. Updates to This Policy</h2>
            <p>We may update this privacy policy to reflect changes in our practices or legal requirements. Users will be notified of material changes.</p>

            <h2>11. Contact Us</h2>
            <p>For privacy-related questions or to exercise your rights:</p>
            <ul>
              <li>Email: privacy@parrotspeak.app</li>
              <li>Data Protection Officer: dpo@parrotspeak.app</li>
              <li>Use the feedback form in the app</li>
            </ul>

            <div className="border-t pt-6 mt-8">
              <h3>Compliance Certifications</h3>
              <p className="text-sm text-muted-foreground">
                ParrotSpeak is compliant with GDPR, CCPA, and SOC 2 Type II standards. 
                Security score: A+ | Last security audit: June 2025
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}