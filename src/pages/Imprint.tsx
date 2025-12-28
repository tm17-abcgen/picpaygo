import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/seo/SEO";
import { legalInfo } from "@/config/legalInfo";

export default function Imprint() {

  return (
    <Layout>
      <SEO title="Imprint" description="Legal information and contact details" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8">Imprint</h1>
        
        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Information according to § 5 TMG (German Telemedia Act)</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="mb-2"><strong>Company Name:</strong> {legalInfo.company.name}</p>
              {legalInfo.company.legalForm && (
                <p className="mb-2"><strong>Legal Form:</strong> {legalInfo.company.legalForm}</p>
              )}
              <p className="mb-2"><strong>Registered Office:</strong> {legalInfo.company.registeredOffice.street}</p>
              <p className="mb-2"><strong>Postal Code & City:</strong> {legalInfo.company.registeredOffice.postalCode} {legalInfo.company.registeredOffice.city}</p>
              <p className="mb-2"><strong>Country:</strong> {legalInfo.company.registeredOffice.country}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Contact Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="mb-2"><strong>Email:</strong> <a href={`mailto:${legalInfo.contact.email}`} className="text-blue-600 hover:underline">{legalInfo.contact.email}</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Responsible for Content</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="mb-2"><strong>Name:</strong> {legalInfo.responsiblePerson.name}</p>
              <p className="mb-2"><strong>Address:</strong> {legalInfo.responsiblePerson.address}</p>
              <p className="mb-2"><strong>Contact:</strong> {legalInfo.responsiblePerson.contact}</p>
            </div>
          </section>

          {legalInfo.tax.vatId && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">VAT Identification Number</h2>
              <p className="mb-4">
                <strong>VAT ID:</strong> {legalInfo.tax.vatId}
              </p>
            </section>
          )}

          {legalInfo.regulatory.supervisoryAuthority && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Supervisory Authority</h2>
              <p className="mb-4">
                {legalInfo.regulatory.supervisoryAuthority}
              </p>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">EU Dispute Resolution</h2>
            <p className="mb-4">
              The European Commission provides a platform for online dispute resolution (ODR) which can be accessed at:
            </p>
            <p className="mb-4">
              <a 
                href={legalInfo.disputeResolution.odrUrl}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline"
              >
                {legalInfo.disputeResolution.odrUrl}
              </a>
            </p>
            <p className="mb-4">
              {legalInfo.disputeResolution.participateInODR 
                ? "We are willing to participate in dispute resolution proceedings before a consumer arbitration board."
                : "We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Disclaimer of Liability</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">Liability for Contents</h3>
            <p className="mb-4">
              As service providers, we are liable for our own content on these pages in accordance with general law. 
              However, we are not under obligation to monitor third party information provided or stored on our website. 
              Once we have become aware of a specific infringement of law, we will immediately remove the content in question. 
              Any liability concerning this matter can only be assumed from the point in time at which the infringement becomes 
              known to us.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">Liability for Links</h3>
            <p className="mb-4">
              Our offer contains links to external websites of third parties, on whose contents we have no influence. 
              Therefore, we cannot assume any liability for these external contents. The respective provider or operator of 
              the pages is always responsible for the contents of the linked pages. The linked pages were checked for possible 
              legal violations at the time of linking. Illegal contents were not identified at the time of linking. However, 
              a permanent content control of the linked pages is not reasonable without concrete evidence of a violation of law. 
              Upon notification of violations, we will remove such links immediately.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-4 text-gray-800">Copyright</h3>
            <p className="mb-4">
              The content and works created by the site operators on these pages are subject to copyright law. Duplication, 
              processing, distribution and any form of commercialization of such material beyond the scope of the copyright law 
              shall require the prior written consent of its respective author or creator. Downloads and copies of this site 
              are only permitted for private, non-commercial use. Insofar as the content on this site was not created by the 
              operator, the copyrights of third parties are respected. In particular, third-party content is identified as such. 
              Should you become aware of a copyright infringement, please inform us accordingly. Upon notification of violations, 
              we will remove such content immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Data Protection</h2>
            <p className="mb-4">
              The use of our website is usually possible without providing personal information. As far as personal data 
              (such as name, address or email addresses) is collected on our pages, this is always done on a voluntary basis, 
              as far as possible. This data will not be passed on to third parties without your explicit consent.
            </p>
            <p className="mb-4">
              We point out that data transmission over the Internet (e.g., when communicating via email) may have security gaps. 
              Complete protection of data against access by third parties is not possible.
            </p>
            <p className="mb-4">
              For detailed information about how we handle your personal data, please refer to our{" "}
              <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
