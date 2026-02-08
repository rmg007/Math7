import { Target } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-20 border-t border-gray-800" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity" aria-label="Questerix Home">
              <div 
                className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-400/20"
                role="img"
                aria-label="Questerix logo"
              >
                <Target size={18} strokeWidth={3} aria-hidden="true" />
              </div>
              <h4 className="font-bold text-2xl tracking-tight">Questerix</h4>
            </a>
            <p className="text-gray-400 max-w-sm leading-relaxed text-lg mb-6">
              Empowering students worldwide with accessible, high-quality education technology. Personalized learning for every student.
            </p>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Questerix Inc. All rights reserved.
            </p>
          </div>

          {/* Curriculum Directory */}
          <nav aria-label="Curriculum Directory">
            <h5 className="font-bold mb-6 text-gray-200">Curriculum</h5>
            <ul className="space-y-4 text-gray-400">
              <li>
                <a href="/#subjects" className="hover:text-white transition-colors">All Subjects</a>
              </li>
              <li>
                <a 
                  href={typeof window !== 'undefined' && window.location.hostname.includes('localhost') ? '/?subdomain=math' : 'https://Farida.Questerix.com'}
                  className="hover:text-white transition-colors"
                >
                  Mathematics
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">English Language Arts</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Science</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Social Studies</a>
              </li>
            </ul>
          </nav>
          
          {/* Platform Links */}
          <nav aria-label="Platform">
            <h5 className="font-bold mb-6 text-gray-200">Platform</h5>
            <ul className="space-y-4 text-gray-400">
              <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="/blog" className="hover:text-white transition-colors">Blog & Resources</a></li>
              <li><a href="#" className="hover:text-white transition-colors">For Schools</a></li>
              <li><a href="#" className="hover:text-white transition-colors">For Parents</a></li>
            </ul>
          </nav>
          
          {/* Get the App */}
          <nav aria-label="Download Apps">
            <h5 className="font-bold mb-6 text-gray-200">Get the App</h5>
            <ul className="space-y-4 text-gray-400">
              <li>
                <a href="/download/ios" className="hover:text-white transition-colors flex items-center gap-2">
                  Download for iOS
                </a>
              </li>
              <li>
                <a href="/download/android" className="hover:text-white transition-colors flex items-center gap-2">
                  Download for Android
                </a>
              </li>
              <li>
                <a href="http://localhost:3000" className="hover:text-white transition-colors flex items-center gap-2">
                  Web App
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Legal Links */}
            <nav className="flex flex-wrap gap-6 text-gray-500 text-sm" aria-label="Legal">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="/cookies" className="hover:text-white transition-colors">Cookie Policy</a>
              <a href="#" className="hover:text-white transition-colors">Accessibility</a>
            </nav>
            
            {/* Social Links */}
            <div className="flex gap-4">
              <a 
                href="#" 
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                aria-label="Follow Questerix on Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                aria-label="Follow Questerix on LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
                aria-label="Follow Questerix on YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
