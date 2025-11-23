import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { StorageProvider } from './contexts/StorageContext.jsx';
import './index.css';

// TODO: Import storageFactory and ensureStorageReady when implemented
// import storageFactory, { ensureStorageReady } from './services/storageFactory.js';

// Placeholder storage object for now
const placeholderStorage = {
  // TODO: Replace with actual storage adapter instance
  init: () => Promise.resolve(),
  // Add other adapter methods as needed
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <StorageProvider storage={placeholderStorage}>
        {/* TODO: Add AuthProvider wrapper when auth is implemented */}
        <App />
        {/* TODO: Add other providers (Theme, etc.) as needed */}
      </StorageProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
