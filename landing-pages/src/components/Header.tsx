import { useState } from 'react';
import { Target, Menu, X } from 'lucide-react';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Target size={20} className="stroke-[3]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Questerix</span>
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="/how-it-works" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">How It Works</a>
          <a href="/#subjects" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Subjects</a>
          <div className="h-6 w-px bg-gray-200 mx-2"></div>
          <a href="http://localhost:3000" className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">Log in</a>
          <a href="http://localhost:3000" className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 text-center">
            Get Started
          </a>
        </nav>

        {/* Mobile Actions */}
        <div className="flex items-center gap-4 md:hidden">
          <a href="http://localhost:3000" className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-95 text-nowrap">
            Get Started
          </a>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

        {/* Mobile Menu Drawer */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-xl animate-fade-in-down h-[calc(100vh-80px)] overflow-y-auto">
            <div className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <a href="/how-it-works" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">How It Works</a>
                <a 
                  href="/#subjects" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  Subjects
                </a>
              </div>
              
              <hr className="border-gray-100" />
              
              <div className="flex flex-col gap-3">
                 <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Get the App</span>
                 <a href="/download/ios" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium">
                   Download for iOS
                 </a>
                 <a href="/download/android" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium">
                   Download for Android
                 </a>
              </div>

              <hr className="border-gray-100" />

              <div className="mt-auto flex flex-col gap-3">
                <a 
                  href="http://localhost:3000" 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3 text-lg font-medium text-gray-900 hover:bg-gray-50 rounded-xl text-center border border-gray-200"
                >
                  Log in
                </a>
                <a 
                  href="http://localhost:3000" 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] text-center"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        )}
    </header>
  );
};
