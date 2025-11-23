/**
 * Storage Factory Module
 * 
 * Provides runtime adapter selection based on environment variables.
 * Supports switching between LocalStorageAdapter and future PostgresAdapter
 * via VITE_USE_LOCAL_STORAGE environment variable.
 * 
 * Usage:
 * - import storage from './storageFactory.js' - gets adapter instance
 * - import { ensureStorageReady } from './storageFactory.js' - init helper
 * - import { getAdapterName } from './storageFactory.js' - diagnostics
 */

import LocalStorageAdapter from './adapters/LocalStorageAdapter.js';

/**
 * Create and return appropriate storage adapter based on environment
 * @returns {Object} Storage adapter instance
 */
function createStorage() {
  const useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE;
  
  // Default to LocalStorage unless explicitly set to 'false'
  if (useLocalStorage === 'false') {
    // Future: PostgresAdapter integration
    console.warn('PostgresAdapter not implemented yet. Falling back to LocalStorageAdapter.');
    
    // Placeholder for PostgresAdapter
    // const PostgresAdapter = await import('./adapters/PostgresAdapter.js');
    // return PostgresAdapter.default;
    
    // For now, return LocalStorageAdapter even when postgres is requested
    return LocalStorageAdapter;
  }
  
  // Default case: use LocalStorageAdapter
  return LocalStorageAdapter;
}

/**
 * Get the name of the currently selected adapter for diagnostics
 * @returns {string} 'local' or 'postgres'
 */
export function getAdapterName() {
  const useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE;
  
  if (useLocalStorage === 'false') {
    // Future: return 'postgres' when PostgresAdapter is implemented
    return 'postgres-fallback'; // Indicates postgres was requested but fell back to local
  }
  
  return 'local';
}

/**
 * Ensure storage adapter is ready for use
 * Call this before using storage methods to guarantee initialization
 * @returns {Promise<Object>} Promise that resolves to the storage adapter
 */
export async function ensureStorageReady() {
  try {
    await storage.init();
    console.log(`Storage adapter (${getAdapterName()}) initialized successfully`);
    return storage;
  } catch (error) {
    console.error('Failed to initialize storage adapter:', error);
    throw error;
  }
}

// Create the storage instance immediately
// Note: init() is not called here - it will be called by ensureStorageReady() or manually by the app
const storage = createStorage();

// Export the storage instance as default export
export default storage;

// Also export as named export for convenience
export { storage };

// Development helper: log current adapter selection
if (import.meta.env.MODE === 'development') {
  console.log(`🔧 Storage Factory: Using ${getAdapterName()} adapter`);
  
  if (import.meta.env.VITE_USE_LOCAL_STORAGE === 'false') {
    console.warn('📝 Note: PostgresAdapter requested but not implemented. Using LocalStorageAdapter as fallback.');
  }
}