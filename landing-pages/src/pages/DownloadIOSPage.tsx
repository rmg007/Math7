import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Apple, Smartphone, Globe, Zap } from 'lucide-react';

export const DownloadIOSPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 mb-20 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-blue-600/30">
            <Apple size={40} />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Questerix for <span className="text-gradient">iOS</span>
          </h1>
          
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8">
            Take your learning anywhere with our native iOS app. Optimized for iPhone and iPad, 
            with offline support and seamless sync across all your devices.
          </p>

          {/* Download Button */}
          <a 
            href="https://apps.apple.com/app/questerix" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:-translate-y-1"
          >
            <Apple size={24} />
            Download on the App Store
          </a>
          
          <p className="text-sm text-gray-500 mt-4">Requires iOS 14.0 or later</p>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose the iOS App?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                <Smartphone size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Native Performance</h3>
              <p className="text-gray-600">
                Buttery-smooth animations and instant response times, built specifically for iOS.
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                <Globe size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Offline Mode</h3>
              <p className="text-gray-600">
                Practice anywhere, even without Wi-Fi. Your progress syncs automatically when you're back online.
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Push Notifications</h3>
              <p className="text-gray-600">
                Stay on track with gentle reminders and celebrate your learning streaks.
              </p>
            </div>
          </div>
        </section>

        {/* Screenshots Placeholder */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">See It in Action</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[9/19] bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl shadow-2xl flex items-center justify-center">
                <Smartphone className="text-gray-400" size={48} />
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-6 text-sm">Screenshots coming soon</p>
        </section>

        {/* Also Available */}
        <section className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-600 mb-4">Also available on:</p>
          <div className="flex justify-center gap-4">
            <a href="/download/android" className="text-blue-600 hover:text-blue-700 font-semibold">
              Android
            </a>
            <span className="text-gray-300">|</span>
            <a href="http://localhost:3000" className="text-blue-600 hover:text-blue-700 font-semibold">
              Web App
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
