/**
 * Storage utilities with fallback mechanisms for Questerix Admin Panel
 *
 * Provides robust storage access with automatic fallback to in-memory storage
 * when localStorage/sessionStorage are restricted or unavailable.
 */

export class StorageManager {
  private static instance: StorageManager;
  private memoryStorage = new Map<string, string>();
  private storageAvailable: boolean | null = null;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Check if browser storage is available
   */
  private checkStorageAvailable(): boolean {
    if (this.storageAvailable !== null) {
      return this.storageAvailable;
    }

    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.storageAvailable = true;
      return true;
    } catch (e) {
      console.warn('Browser storage not available, using fallback:', e);
      this.storageAvailable = false;
      return false;
    }
  }

  /**
   * Set item in storage with fallback
   */
  setItem(key: string, value: string): void {
    try {
      if (this.checkStorageAvailable()) {
        localStorage.setItem(key, value);
      } else {
        this.memoryStorage.set(key, value);
      }
    } catch (e) {
      console.warn(`Failed to store ${key}, using memory fallback:`, e);
      this.memoryStorage.set(key, value);
    }
  }

  /**
   * Get item from storage with fallback
   */
  getItem(key: string): string | null {
    try {
      if (this.checkStorageAvailable()) {
        return localStorage.getItem(key);
      } else {
        return this.memoryStorage.get(key) || null;
      }
    } catch (e) {
      console.warn(`Failed to retrieve ${key}, checking memory fallback:`, e);
      return this.memoryStorage.get(key) || null;
    }
  }

  /**
   * Remove item from storage with fallback
   */
  removeItem(key: string): void {
    try {
      if (this.checkStorageAvailable()) {
        localStorage.removeItem(key);
      } else {
        this.memoryStorage.delete(key);
      }
    } catch (e) {
      console.warn(`Failed to remove ${key}, using memory fallback:`, e);
      this.memoryStorage.delete(key);
    }
  }

  /**
   * Clear all storage with fallback
   */
  clear(): void {
    try {
      if (this.checkStorageAvailable()) {
        localStorage.clear();
      } else {
        this.memoryStorage.clear();
      }
    } catch (e) {
      console.warn('Failed to clear storage, using memory fallback:', e);
      this.memoryStorage.clear();
    }
  }

  /**
   * Get storage type for debugging
   */
  getStorageType(): 'localStorage' | 'memory' {
    return this.checkStorageAvailable() ? 'localStorage' : 'memory';
  }

  /**
   * Get debug information
   */
  getDebugInfo(): Record<string, unknown> {
    return {
      storageType: this.getStorageType(),
      isStorageAvailable: this.storageAvailable,
      memoryStorageSize: this.memoryStorage.size,
    };
  }
}

// Export singleton instance
export const storageManager = StorageManager.getInstance();
