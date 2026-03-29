/**
 * Shared Storage Utilities for All Questerix Applications
 * 
 * This module provides robust storage access with automatic fallback mechanisms
 * for web applications that may run in restricted contexts (iframes, embedded views, etc.)
 * 
 * Usage:
 * ```typescript
 * import { createStorageAdapter } from '@questerix/core/utils/storage';
 * 
 * const storage = createStorageAdapter();
 * storage.setItem('key', 'value');
 * const value = storage.getItem('key');
 * ```
 */

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  getStorageType(): 'localStorage' | 'sessionStorage' | 'memory';
  getDebugInfo(): Record<string, unknown>;
}

export class BrowserStorageAdapter implements StorageAdapter {
  private memoryFallback = new Map<string, string>();
  private storageAvailable: boolean | null = null;
  private preferredStorage: Storage;

  constructor(preferredStorage: Storage = localStorage) {
    this.preferredStorage = preferredStorage;
  }

  private checkStorageAvailable(): boolean {
    if (this.storageAvailable !== null) {
      return this.storageAvailable;
    }

    try {
      const testKey = '__questerix_storage_test__';
      this.preferredStorage.setItem(testKey, 'test');
      this.preferredStorage.removeItem(testKey);
      this.storageAvailable = true;
      return true;
    } catch (e) {
      console.warn('Browser storage not available, using memory fallback:', e);
      this.storageAvailable = false;
      return false;
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.checkStorageAvailable()) {
        return this.preferredStorage.getItem(key);
      } else {
        return this.memoryFallback.get(key) || null;
      }
    } catch (e) {
      console.warn(`Failed to retrieve ${key}, using memory fallback:`, e);
      return this.memoryFallback.get(key) || null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (this.checkStorageAvailable()) {
        this.preferredStorage.setItem(key, value);
      } else {
        this.memoryFallback.set(key, value);
      }
    } catch (e) {
      console.warn(`Failed to store ${key}, using memory fallback:`, e);
      this.memoryFallback.set(key, value);
    }
  }

  removeItem(key: string): void {
    try {
      if (this.checkStorageAvailable()) {
        this.preferredStorage.removeItem(key);
      } else {
        this.memoryFallback.delete(key);
      }
    } catch (e) {
      console.warn(`Failed to remove ${key}, using memory fallback:`, e);
      this.memoryFallback.delete(key);
    }
  }

  clear(): void {
    try {
      if (this.checkStorageAvailable()) {
        this.preferredStorage.clear();
      } else {
        this.memoryFallback.clear();
      }
    } catch (e) {
      console.warn('Failed to clear storage, using memory fallback:', e);
      this.memoryFallback.clear();
    }
  }

  getStorageType(): 'localStorage' | 'sessionStorage' | 'memory' {
    if (!this.checkStorageAvailable()) {
      return 'memory';
    }
    return this.preferredStorage === localStorage ? 'localStorage' : 'sessionStorage';
  }

  getDebugInfo(): Record<string, unknown> {
    return {
      storageType: this.getStorageType(),
      isStorageAvailable: this.storageAvailable,
      memoryFallbackSize: this.memoryFallback.size,
      preferredStorage: this.preferredStorage === localStorage ? 'localStorage' : 'sessionStorage',
    };
  }
}

/**
 * Memory-only storage adapter for environments where browser storage is completely unavailable
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  getStorageType(): 'memory' {
    return 'memory';
  }

  getDebugInfo(): Record<string, unknown> {
    return {
      storageType: 'memory',
      size: this.storage.size,
      keys: Array.from(this.storage.keys()),
    };
  }
}

/**
 * Create a storage adapter with automatic fallback handling
 */
export function createStorageAdapter(preferredStorage?: Storage): StorageAdapter {
  // In non-browser environments (Node.js, React Native, etc.)
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return new MemoryStorageAdapter();
  }

  return new BrowserStorageAdapter(preferredStorage);
}

/**
 * Create a Supabase-compatible storage interface
 */
export function createSupabaseStorageAdapter(preferredStorage?: Storage) {
  const adapter = createStorageAdapter(preferredStorage);
  
  return {
    getItem: (key: string) => adapter.getItem(key),
    setItem: (key: string, value: string) => {
      try {
        adapter.setItem(key, value);
      } catch (e) {
        // Supabase expects silent failures for storage
        console.warn(`Supabase storage failed for key ${key}:`, e);
      }
    },
    removeItem: (key: string) => {
      try {
        adapter.removeItem(key);
      } catch (e) {
        // Supabase expects silent failures for storage
        console.warn(`Supabase storage removal failed for key ${key}:`, e);
      }
    },
  };
}

/**
 * Utility to detect storage capabilities
 */
export function detectStorageCapabilities(): {
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
} {
  const capabilities = {
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
  };

  // Test localStorage
  try {
    const testKey = '__storage_capability_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    capabilities.localStorage = true;
  } catch (e) {
    // localStorage not available
  }

  // Test sessionStorage
  try {
    const testKey = '__session_capability_test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    capabilities.sessionStorage = true;
  } catch (e) {
    // sessionStorage not available
  }

  // Test IndexedDB
  try {
    capabilities.indexedDB = 'indexedDB' in window && window.indexedDB !== null;
  } catch (e) {
    // IndexedDB not available
  }

  return capabilities;
}