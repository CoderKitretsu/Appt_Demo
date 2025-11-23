import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { StorageProvider } from './contexts/StorageContext.jsx';
import storage, { ensureStorageReady } from './services/storageFactory.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <StorageProvider storage={storage}>
        {/* TODO: Add AuthProvider wrapper when auth is implemented */}
        <App />
        {/* TODO: Add other providers (Theme, etc.) as needed */}
      </StorageProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
