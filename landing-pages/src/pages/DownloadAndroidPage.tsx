import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Smartphone, Globe, Zap, Download } from 'lucide-react';

export const DownloadAndroidPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 mb-20 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-green-600/30">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
              <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.5 11.5 0 00-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C2.92 11.03 1 14.22 1 17.8h22c0-3.58-1.92-6.77-5.4-8.32zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
            </svg>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Questerix for <span className="text-gradient">Android</span>
          </h1>
          
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8">
            Experience seamless learning on your Android device. Optimized for phones and tablets, 
            with offline support and real-time sync across all platforms.
          </p>

          {/* Download Button */}
          <a 
            href="https://play.google.com/store/apps/details?id=com.questerix.app" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:-translate-y-1"
          >
            <Download size={24} />
            Get it on Google Play
          </a>
          
          <p className="text-sm text-gray-500 mt-4">Requires Android 8.0 or later</p>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose the Android App?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                <Smartphone size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Material Design</h3>
              <p className="text-gray-600">
                Beautiful, intuitive interface following Google's Material Design guidelines.
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                <Globe size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Offline Mode</h3>
              <p className="text-gray-600">
                Practice anywhere, even without internet. Your progress syncs automatically when connected.
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Battery Optimized</h3>
              <p className="text-gray-600">
                Efficient performance that won't drain your battery, even during long study sessions.
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
            <a href="/download/ios" className="text-blue-600 hover:text-blue-700 font-semibold">
              iOS
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
