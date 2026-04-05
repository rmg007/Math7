// CRITICAL: Questerix Storage Protection for Flutter Web
// This script provides storage protection without interfering with Flutter initialization

(function() {
  'use strict';
  
  console.log('🛡️ Initializing Questerix storage protection...');
  
  // Test storage availability immediately
  let isStorageAvailable = false;
  let fallbackStorage = new Map();
  
  try {
    const test = '__questerix_storage_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    isStorageAvailable = true;
    console.log('✅ Browser storage available');
  } catch (e) {
    console.warn('⚠️ Browser storage blocked, activating fallback:', e.message);
    isStorageAvailable = false;
  }

  // Create storage polyfill IMMEDIATELY if needed
  if (!isStorageAvailable) {
    console.log('🔄 Installing storage polyfill for restricted context');
    
    const createStoragePolyfill = () => ({
      getItem: function(key) {
        try {
          return fallbackStorage.get(key) || null;
        } catch (e) {
          console.warn('Storage getItem fallback error:', e);
          return null;
        }
      },
      setItem: function(key, value) {
        try {
          fallbackStorage.set(key, String(value));
        } catch (e) {
          console.warn('Storage setItem fallback error:', e);
        }
      },
      removeItem: function(key) {
        try {
          fallbackStorage.delete(key);
        } catch (e) {
          console.warn('Storage removeItem fallback error:', e);
        }
      },
      clear: function() {
        try {
          fallbackStorage.clear();
        } catch (e) {
          console.warn('Storage clear fallback error:', e);
        }
      },
      get length() {
        try {
          return fallbackStorage.size;
        } catch (e) {
          console.warn('Storage length fallback error:', e);
          return 0;
        }
      },
      key: function(index) {
        try {
          return Array.from(fallbackStorage.keys())[index] || null;
        } catch (e) {
          console.warn('Storage key fallback error:', e);
          return null;
        }
      }
    });

    // Override both localStorage and sessionStorage
    try {
      Object.defineProperty(window, 'localStorage', {
        value: createStoragePolyfill(),
        writable: false,
        configurable: false
      });
      
      Object.defineProperty(window, 'sessionStorage', {
        value: createStoragePolyfill(),
        writable: false,
        configurable: false
      });
      
      console.log('✅ Storage polyfill installed successfully');
    } catch (defineError) {
      console.warn('⚠️ Could not override storage objects:', defineError);
      // Fallback: just assign to window
      window.localStorage = createStoragePolyfill();
      window.sessionStorage = createStoragePolyfill();
    }
  }

  // Configure Flutter with storage info
  window.flutterConfiguration = {
    canvasKitBaseUrl: "/canvaskit/",
    storageAvailable: isStorageAvailable,
    storageType: isStorageAvailable ? 'native' : 'polyfill',
    fallbackStorage: fallbackStorage
  };

  console.log('🛡️ Questerix storage protection active:', {
    storageAvailable: isStorageAvailable,
    storageType: window.flutterConfiguration.storageType,
    fallbackSize: fallbackStorage.size
  });

  // CRITICAL: Global error handlers for storage access issues
  // Handle synchronous storage access errors
  window.addEventListener('error', function(event) {
    if (event.error && event.error.message) {
      const message = event.error.message.toLowerCase();
      if (message.includes('access to storage is not allowed') ||
          message.includes('storage') ||
          message.includes('localstorage') ||
          message.includes('sessionstorage')) {
        console.warn('🛡️ Blocked storage access error:', event.error.message);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }
  });

  // Handle asynchronous storage access errors (Promises)
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason) {
      const message = String(event.reason).toLowerCase();
      if (message.includes('access to storage is not allowed') ||
          message.includes('storage') ||
          message.includes('localstorage') ||
          message.includes('sessionstorage')) {
        console.warn('🛡️ Blocked storage promise rejection:', event.reason);
        event.preventDefault();
        return false;
      }
    }
  });

  // Override console.error to catch and handle storage errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ').toLowerCase();
    if (message.includes('access to storage is not allowed') ||
        message.includes('storage is not allowed')) {
      console.warn('🛡️ Intercepted storage error:', ...args);
      return; // Don't show the error
    }
    originalConsoleError.apply(console, args);
  };

  console.log('🛡️ Global storage error handlers installed');

})();