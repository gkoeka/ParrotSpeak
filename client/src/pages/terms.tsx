import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
            <p className="text-center text-muted-foreground">Last updated: July 14, 2025</p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using ParrotSpeak ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>

            <h2>2. Description of Service</h2>
            <p>ParrotSpeak is an AI-powered voice translation application that enables real-time communication across 70+ languages. The Service includes:</p>
            <ul>
              <li>Voice-to-voice translation</li>
              <li>Text translation capabilities</li>
              <li>Conversation history and management</li>
              <li>Visual translation features</li>
              <li>Premium subscription features</li>
            </ul>

            <h2>3. Account Registration</h2>
            <ul>
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 13 years old to use the Service</li>
              <li>One account per person; sharing accounts is prohibited</li>
            </ul>

            <h2>4. Subscription Terms</h2>
            <h3>4.1 Subscription Plans</h3>
            <p>ParrotSpeak offers various subscription plans:</p>
            <ul>
              <li>Weekly: $4.99 (7 days)</li>
              <li>Monthly: $9.99 (30 days)</li>
              <li>3-Month: $39.99 (90 days)</li>
              <li>6-Month: $69.99 (180 days)</li>
              <li>Annual: $99.00 (365 days)</li>
            </ul>

            <h3>4.2 Billing and Payment</h3>
            <ul>
              <li>All purchases are processed through app store billing (Google Play Store or Apple App Store)</li>
              <li>Prices are subject to change with 30 days notice</li>
              <li>Recurring subscriptions automatically renew unless cancelled</li>
              <li>One-time purchases provide access for the specified duration</li>
            </ul>

            <h3>4.3 Cancellation and Refunds</h3>
            <ul>
              <li>Cancel subscriptions through your device's app store settings</li>
              <li>Cancellation takes effect at the end of the current billing period</li>
              <li>Refund requests must be submitted through the app store</li>
              <li>No partial refunds for unused portions of subscription periods</li>
            </ul>

            <h2>5. Acceptable Use</h2>
            <h3>5.1 Permitted Uses</h3>
            <ul>
              <li>Personal and business communication</li>
              <li>Language learning and education</li>
              <li>Travel and international communication</li>
              <li>Accessibility assistance</li>
            </ul>

            <h3>5.2 Prohibited Uses</h3>
            <ul>
              <li>Illegal activities or content</li>
              <li>Harassment, threats, or abuse</li>
              <li>Spam or unsolicited communications</li>
              <li>Reverse engineering or hacking attempts</li>
              <li>Commercial use without permission (business plans available)</li>
            </ul>

            <h2>6. Content and Intellectual Property</h2>
            <h3>6.1 Your Content</h3>
            <ul>
              <li>You retain ownership of your conversations and data</li>
              <li>You grant us limited rights to process your content for service provision</li>
              <li>Voice recordings are processed and immediately deleted</li>
            </ul>

            <h3>6.2 Our Content</h3>
            <ul>
              <li>ParrotSpeak technology and interface are our intellectual property</li>
              <li>You may not copy, distribute, or create derivative works</li>
              <li>Trademarks and logos are protected</li>
            </ul>

            <h2>7. Privacy and Data Protection</h2>
            <ul>
              <li>Your privacy is governed by our Privacy Policy</li>
              <li>We collect minimal data necessary for service operation</li>
              <li>All data is encrypted and securely stored</li>
              <li>You control your data and can request deletion</li>
            </ul>

            <h2>8. Service Availability and Modifications</h2>
            <ul>
              <li>We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
              <li>We may modify features with reasonable notice</li>
              <li>Maintenance windows will be announced in advance</li>
              <li>We reserve the right to discontinue features that are no longer viable</li>
            </ul>

            <h2>9. Limitation of Liability</h2>
            <ul>
              <li>Translation accuracy is not guaranteed; human verification recommended for critical communications</li>
              <li>We are not liable for translation errors or misunderstandings</li>
              <li>Service interruptions may occur due to technical issues</li>
              <li>Maximum liability limited to subscription fees paid</li>
            </ul>

            <h2>10. Disclaimers</h2>
            <ul>
              <li>Service provided "as is" without warranties</li>
              <li>Translation quality depends on various factors including accent, background noise, and language complexity</li>
              <li>We do not guarantee compatibility with all devices or operating systems</li>
            </ul>

            <h2>11. Termination</h2>
            <ul>
              <li>Either party may terminate at any time</li>
              <li>We may suspend accounts for terms violations</li>
              <li>Upon termination, you lose access to premium features</li>
              <li>Data retention follows our Privacy Policy</li>
            </ul>

            <h2>12. International Use</h2>
            <ul>
              <li>Service available globally subject to local laws</li>
              <li>Users responsible for compliance with local regulations</li>
              <li>Some features may be restricted in certain jurisdictions</li>
            </ul>

            <h2>13. Dispute Resolution</h2>
            <ul>
              <li>Disputes resolved through binding arbitration</li>
              <li>Class action lawsuits are waived</li>
              <li>Governing law: [Jurisdiction to be specified]</li>
              <li>Small claims court exceptions apply</li>
            </ul>

            <h2>14. Updates to Terms</h2>
            <ul>
              <li>We may update these terms with 30 days notice</li>
              <li>Continued use constitutes acceptance of new terms</li>
              <li>Material changes will be highlighted</li>
              <li>Previous versions available upon request</li>
            </ul>

            <h2>15. Contact Information</h2>
            <p>For questions about these Terms of Service:</p>
            <ul>
              <li>Email: legal@parrotspeak.app</li>
              <li>Support: support@parrotspeak.app</li>
              <li>Use the feedback form in the app</li>
            </ul>

            <h2>16. App Store Terms</h2>
            <ul>
              <li>Additional terms from Google Play Store and Apple App Store apply</li>
              <li>In case of conflicts, platform terms take precedence for billing matters</li>
              <li>Platform-specific policies govern refunds and disputes</li>
            </ul>

            <div className="border-t pt-6 mt-8">
              <p className="text-center font-semibold">ParrotSpeak - Breaking language barriers with AI-powered translation</p>
              <p className="text-center text-sm text-muted-foreground mt-2">© 2025 ParrotSpeak. All rights reserved.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}