import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/seo/SEO";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <SEO title="Privacy Policy" description="Our privacy policy and data protection information" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <p className="text-sm text-gray-500 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="mb-4">
              At PicPayGo, we are committed to protecting your privacy and personal data. This Privacy Policy explains 
              how we collect, use, store, and protect your information when you use our AI-powered photo enhancement service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">1.1 Account Information</h3>
            <p className="mb-3">
              When you create an account, we collect:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Email address (required for account creation and communication)</li>
              <li>Password (stored as a cryptographically hashed value, never in plain text)</li>
              <li>Account creation timestamp and last login information</li>
              <li>Email verification status</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">1.2 Usage Data</h3>
            <p className="mb-3">
              We automatically collect certain information when you use our service:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>IP addresses (used for free credit allocation and security purposes)</li>
              <li>Session information (for logged-in users and guest sessions)</li>
              <li>Generation history (input and output images, processing status, timestamps)</li>
              <li>Credit balance and transaction history</li>
              <li>Browser and device information (for technical support and optimization)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">1.3 Image Data</h3>
            <p className="mb-3">
              When you upload photos for enhancement:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Input images are stored securely in our object storage system</li>
              <li>Generated output images are stored and associated with your account or guest session</li>
              <li>Image metadata (file size, content type, timestamps) is recorded</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">1.4 Payment Information</h3>
            <p className="mb-3">
              When you purchase credits:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Payment processing is handled entirely by Stripe, our payment processor</li>
              <li>We store transaction records (Stripe session IDs, payment amounts, credit quantities)</li>
              <li>We do not store credit card numbers or full payment details (these are handled by Stripe)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. How We Use Your Information</h2>
            <p className="mb-3">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li><strong>Service Delivery:</strong> To process your photo enhancement requests using AI technology</li>
              <li><strong>Account Management:</strong> To create and manage your account, verify your email, and maintain your session</li>
              <li><strong>Credit System:</strong> To track and manage your credit balance, including free credits and purchased credits</li>
              <li><strong>Payment Processing:</strong> To process credit purchases through Stripe</li>
              <li><strong>Security:</strong> To prevent fraud, abuse, and unauthorized access</li>
              <li><strong>Service Improvement:</strong> To analyze usage patterns and improve our service quality</li>
              <li><strong>Communication:</strong> To send you account-related notifications and support responses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. Third-Party Services</h2>
            <p className="mb-4">
              We use the following third-party services to operate our platform. These services have their own privacy policies:
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">3.1 AI Processing - OpenRouter (Google Gemini)</h3>
            <p className="mb-3">
              Your uploaded images are processed through OpenRouter API, which uses Google's Gemini AI model. 
              Images are transmitted securely to OpenRouter for processing and are subject to their privacy policies.
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Service: OpenRouter API (openrouter.ai)</li>
              <li>Purpose: AI-powered image enhancement</li>
              <li>Data Shared: Uploaded images and processing requests</li>
              <li>Privacy Policy: <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenRouter Privacy Policy</a></li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">3.2 Payment Processing - Stripe</h3>
            <p className="mb-3">
              All payment transactions are processed by Stripe. We do not have access to your full payment card information.
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Service: Stripe (stripe.com)</li>
              <li>Purpose: Secure payment processing for credit purchases</li>
              <li>Data Shared: Transaction amounts, user email, credit pack information</li>
              <li>Privacy Policy: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Stripe Privacy Policy</a></li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">3.3 Data Storage</h3>
            <p className="mb-3">
              We use the following infrastructure services for data storage:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li><strong>PostgreSQL Database:</strong> Stores account information, sessions, credits, and generation metadata</li>
              <li><strong>MinIO Object Storage:</strong> Stores uploaded and generated images securely</li>
            </ul>

            <p className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <strong>Important:</strong> We do not sell, rent, or share your personal information or images with any third parties 
              for marketing or advertising purposes. Third-party services are used solely for the technical operation of our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Cookies and Tracking</h2>
            <p className="mb-3">
              We use cookies and similar technologies for the following purposes:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li><strong>Session Cookies:</strong> To maintain your logged-in session (HttpOnly, Secure, SameSite=Lax)</li>
              <li><strong>Guest Session Cookies:</strong> To track guest sessions for free credit allocation and generation history</li>
              <li><strong>Functional Cookies:</strong> To remember your preferences and improve user experience</li>
            </ul>
            <p className="mb-4">
              You can control cookies through your browser settings, though disabling cookies may affect service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Data Retention</h2>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li><strong>Account Data:</strong> Retained for as long as your account is active. You can request account deletion at any time.</li>
              <li><strong>Generation History:</strong> Retained for logged-in users indefinitely, or until account deletion. Guest session data is retained for 30 days.</li>
              <li><strong>Images:</strong> Stored images are retained until you delete them or your account is deleted.</li>
              <li><strong>Payment Records:</strong> Retained as required by law for accounting and tax purposes (typically 7 years).</li>
              <li><strong>IP Addresses:</strong> Retained for free credit tracking and security purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Your Rights (GDPR & Data Protection)</h2>
            <p className="mb-3">
              If you are located in the European Economic Area (EEA) or other jurisdictions with data protection laws, you have the following rights:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li><strong>Right to Access:</strong> Request a copy of all personal data we hold about you</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation of how we process your data</li>
              <li><strong>Right to Data Portability:</strong> Request your data in a structured, machine-readable format</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, please contact us at <a href="mailto:support@picpaygo.com" className="text-blue-600 hover:underline">support@picpaygo.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Data Security</h2>
            <p className="mb-3">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Passwords are hashed using secure cryptographic algorithms (never stored in plain text)</li>
              <li>All data transmission is encrypted using HTTPS/TLS</li>
              <li>Session tokens are securely generated and stored with expiration times</li>
              <li>Database access is restricted and monitored</li>
              <li>Regular security audits and updates</li>
              <li>Rate limiting to prevent abuse and unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Children's Privacy</h2>
            <p className="mb-4">
              Our service is not intended for users under the age of 13 (or 16 in the EEA). We do not knowingly collect 
              personal information from children. If you believe we have inadvertently collected information from a child, 
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. International Data Transfers</h2>
            <p className="mb-4">
              Your data may be processed and stored in servers located outside your country of residence. When we transfer 
              data internationally, we ensure appropriate safeguards are in place to protect your privacy rights in accordance 
              with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the service 
              after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy or wish to exercise your data protection rights, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-2"><strong>Email:</strong> <a href="mailto:support@picpaygo.com" className="text-blue-600 hover:underline">support@picpaygo.com</a></p>
              <p className="mb-2"><strong>Phone:</strong> +1 (415) 555-0133</p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
