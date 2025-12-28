import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/seo/SEO";
import { legalInfo } from "@/config/legalInfo";

export default function TermsConditions() {
  return (
    <Layout>
      <SEO title="Terms & Conditions" description="Terms and conditions of use" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8">Terms & Conditions</h1>
        
        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <p className="text-sm text-gray-500 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="mb-4">
              Welcome to {legalInfo.company.name}. These Terms and Conditions ("Terms") govern your access to and use of our AI-powered 
              photo enhancement service. By accessing or using our service, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By creating an account, accessing, or using {legalInfo.company.name}'s services, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must not 
              use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Description of Service</h2>
            <p className="mb-3">
              {legalInfo.company.name} is an AI-powered photo enhancement platform that allows users to:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Upload photos for AI-powered enhancement and transformation</li>
              <li>Choose from various enhancement categories and styles</li>
              <li>Receive AI-generated enhanced versions of their photos</li>
              <li>Purchase credits to generate enhanced images</li>
              <li>Access generation history (for registered users)</li>
            </ul>
            <p className="mb-4">
              The service uses third-party AI technology (OpenRouter/Google Gemini) to process your images. We reserve the 
              right to modify, suspend, or discontinue any aspect of the service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">3.1 Account Creation</h3>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>You must provide a valid email address and create a secure password</li>
              <li>You must verify your email address before full account access is granted</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must be at least 13 years old (16 in the EEA) to create an account</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">3.2 Account Responsibilities</h3>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>You may not share your account credentials with others</li>
              <li>You may not create multiple accounts to circumvent credit limits or restrictions</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">3.3 Guest Sessions</h3>
            <p className="mb-4">
              You may use our service as a guest without creating an account. Guest sessions have limited functionality 
              and are subject to IP-based free credit limits. Guest session data may be retained for up to 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Credits and Payment</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">4.1 Credit System</h3>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Each image generation consumes one (1) credit</li>
              <li>Free credits may be provided to new users or IP addresses (limited quantity)</li>
              <li>Free credits are consumed before purchased credits</li>
              <li>Credits are non-transferable and non-refundable except as required by law</li>
              <li>Credits do not expire, but may be forfeited upon account deletion</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">4.2 Purchasing Credits</h3>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Credit purchases are processed through Stripe, our payment processor</li>
              <li>All prices are displayed in your local currency (as supported by Stripe)</li>
              <li>Payment must be completed before credits are added to your account</li>
              <li>We reserve the right to change credit pack prices at any time</li>
              <li>Purchased credits are added to your account balance immediately upon successful payment</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">4.3 Refunds</h3>
            <p className="mb-4">
              Refunds for credit purchases may be available in accordance with applicable consumer protection laws. 
              If a generation fails due to a technical error on our part, we may refund the consumed credit at our discretion. 
              Refund requests must be submitted within 30 days of purchase. Contact us at <a href={`mailto:${legalInfo.contact.email}`} className="text-blue-600 hover:underline">{legalInfo.contact.email}</a> for refund inquiries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Upload images containing illegal, harmful, or offensive content</li>
              <li>Upload images that infringe on intellectual property rights of others</li>
              <li>Use the service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to reverse engineer, decompile, or extract the AI models or algorithms</li>
              <li>Use automated systems (bots, scripts) to access the service without authorization</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Upload images of minors without proper authorization</li>
              <li>Use the service to generate content for commercial purposes without appropriate licensing</li>
            </ul>
            <p className="mb-4">
              Violation of these rules may result in immediate termination of your account and forfeiture of credits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">6.1 Your Content</h3>
            <p className="mb-4">
              <strong>Logged-in Users:</strong> You retain all ownership rights to images you upload. By uploading images, you grant us a limited, 
              non-exclusive license to process, store, and display your images solely for the purpose of providing 
              the enhancement service.
            </p>
            <p className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <strong>Guest Users (No Account):</strong> If you do not create an account, all processed images uploaded to this site 
              will not be transferred to you but will become the property of the site. This is necessary because without an account 
              (which requires a name, email address, or other identifying information), we cannot verify ownership or transfer images 
              to a specific user. By uploading images as a guest user, you acknowledge and agree that the images become the property 
              of the site.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">6.2 Generated Content</h3>
            <p className="mb-4">
              <strong>Logged-in Users:</strong> AI-generated enhanced images are created using third-party AI technology. You receive a license to use 
              the generated images for personal or commercial purposes, subject to these Terms. However, the underlying 
              AI technology and algorithms remain the property of their respective owners (OpenRouter, Google).
            </p>
            <p className="mb-4">
              <strong>Guest Users:</strong> For users without an account, all generated images become the property of the site and will not be 
              transferred to you. Generated images are automatically deleted after 3 days.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">6.3 Service Content</h3>
            <p className="mb-4">
              All content, features, and functionality of the PicPayGo service, including but not limited to text, graphics, 
              logos, and software, are owned by PicPayGo or its licensors and are protected by copyright, trademark, and 
              other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. AI-Generated Content Disclaimer</h2>
            <p className="mb-4">
              Our service uses artificial intelligence to enhance and transform images. While we strive for high-quality results, 
              AI-generated content may:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Produce unexpected or imperfect results</li>
              <li>Not always meet your expectations</li>
              <li>Occasionally fail to process certain images</li>
              <li>Be subject to limitations of the underlying AI technology</li>
            </ul>
            <p className="mb-4">
              We do not guarantee the quality, accuracy, or suitability of AI-generated content for any specific purpose. 
              You use generated content at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Service Availability and Modifications</h2>
            <p className="mb-4">
              We strive to maintain service availability but do not guarantee uninterrupted or error-free operation. 
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside ml-4 mb-4 space-y-2">
              <li>Modify, suspend, or discontinue any aspect of the service at any time</li>
              <li>Perform maintenance that may temporarily interrupt service</li>
              <li>Limit access to the service during periods of high demand</li>
              <li>Change features, functionality, or pricing with reasonable notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PICPAYGO AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, 
              OR USE, ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.
            </p>
            <p className="mb-4">
              Our total liability for any claims arising from your use of the service shall not exceed the amount you paid 
              to us in the 12 months preceding the claim, or $100, whichever is greater.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify, defend, and hold harmless PicPayGo and its officers, directors, employees, and agents 
              from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or relating 
              to your use of the service, violation of these Terms, or infringement of any rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Termination</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">11.1 Termination by You</h3>
            <p className="mb-4">
              You may terminate your account at any time by contacting us or using the account deletion feature. 
              Upon termination, your account data and images will be deleted in accordance with our Privacy Policy.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">11.2 Termination by Us</h3>
            <p className="mb-4">
              We may suspend or terminate your account immediately if you violate these Terms, engage in fraudulent activity, 
              or for any other reason we deem necessary to protect the service or other users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. Dispute Resolution</h2>
            <p className="mb-4">
              For users in the European Union, the European Commission provides an online dispute resolution platform at 
              <a href={legalInfo.disputeResolution.odrUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                {legalInfo.disputeResolution.odrUrl}
              </a>.
            </p>
            <p className="mb-4">
              Any disputes arising from these Terms or your use of the service shall be resolved through good faith negotiation. 
              If negotiation fails, disputes shall be resolved through binding arbitration or in the courts of {legalInfo.jurisdiction.country}{legalInfo.jurisdiction.region ? `, ${legalInfo.jurisdiction.region}` : ''}, 
              as applicable under local law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">13. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. Material changes will be notified by email or through 
              a prominent notice on our website. Your continued use of the service after such changes constitutes acceptance 
              of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">14. Governing Law</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of {legalInfo.jurisdiction.country}{legalInfo.jurisdiction.region ? `, ${legalInfo.jurisdiction.region}` : ''}, without regard 
              to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be brought 
              exclusively in the courts of {legalInfo.jurisdiction.country}{legalInfo.jurisdiction.region ? `, ${legalInfo.jurisdiction.region}` : ''}.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">15. Contact Information</h2>
            <p className="mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-2"><strong>Email:</strong> <a href={`mailto:${legalInfo.contact.email}`} className="text-blue-600 hover:underline">{legalInfo.contact.email}</a></p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
