import React, { createContext, useContext, useEffect, useState } from 'react';

// Storage Context for providing adapter instance throughout the app
const StorageContext = createContext(null);

export const StorageProvider = ({ children, storage }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize storage adapter when provider mounts
    // TODO: Call ensureStorageReady() when storageFactory is implemented
    if (storage) {
      // Placeholder for storage initialization
      setIsReady(true);
    }
  }, [storage]);

  const value = {
    storage,
    isReady,
    error
  };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};