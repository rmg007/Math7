import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const TermsPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-extrabold mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-12">Last updated: February 1, 2026</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using Questerix, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Use of Service</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You may use Questerix only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Use the service in any way that violates applicable laws or regulations</li>
                <li>Attempt to gain unauthorized access to any portion of the service</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Share your account credentials with others</li>
                <li>Use automated systems to access the service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
              <p className="text-gray-600 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account and password. 
                You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                All content, features, and functionality of Questerix are owned by Questerix Inc. and are protected 
                by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. User Content</h2>
              <p className="text-gray-600 leading-relaxed">
                You retain ownership of any content you submit to Questerix. By submitting content, you grant us 
                a worldwide, non-exclusive license to use, reproduce, and display your content in connection with 
                operating the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Termination</h2>
              <p className="text-gray-600 leading-relaxed">
                We may terminate or suspend your account and access to the service immediately, without prior notice, 
                for any reason, including breach of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                Questerix shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                resulting from your use of or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material changes 
                via email or through the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                Questions about these Terms should be sent to:{' '}
                <a href="mailto:legal@questerix.com" className="text-blue-600 hover:text-blue-700">
                  legal@questerix.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
