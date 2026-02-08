import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const CookiesPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-extrabold mb-4">Cookie Policy</h1>
          <p className="text-gray-600 mb-12">Last updated: February 1, 2026</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
              <p className="text-gray-600 leading-relaxed">
                Cookies are small text files that are placed on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences and 
                understanding how you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">How We Use Cookies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly (e.g., authentication, security)</li>
                <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our website</li>
                <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Collect information about how you use our service to improve it</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="font-bold mb-2">Session Cookies</h3>
                  <p className="text-gray-600">Temporary cookies that expire when you close your browser.</p>
                </div>

                <div className="border-l-4 border-purple-600 pl-4">
                  <h3 className="font-bold mb-2">Persistent Cookies</h3>
                  <p className="text-gray-600">Remain on your device for a set period or until you delete them.</p>
                </div>

                <div className="border-l-4 border-green-600 pl-4">
                  <h3 className="font-bold mb-2">Third-Party Cookies</h3>
                  <p className="text-gray-600">Set by third-party services we use (e.g., analytics providers).</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Managing Cookies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You can control and manage cookies in various ways:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Most browsers allow you to refuse or accept cookies</li>
                <li>You can delete cookies already stored on your device</li>
                <li>You can set your browser to notify you when cookies are sent</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Please note that disabling cookies may affect the functionality of our website and your user experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
              <p className="text-gray-600 leading-relaxed">
                We use the following third-party services that may set cookies:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Google Analytics (for usage analytics)</li>
                <li>Supabase (for authentication and data storage)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Updates to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Cookie Policy from time to time. We will notify you of any changes by 
                posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about our use of cookies, please contact us at:{' '}
                <a href="mailto:privacy@questerix.com" className="text-blue-600 hover:text-blue-700">
                  privacy@questerix.com
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
