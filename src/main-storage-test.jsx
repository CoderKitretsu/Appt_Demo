import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Test StorageContext import
function StorageTestApp() {
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function testImports() {
      try {
        console.log('Testing StorageContext import...');
        const { StorageProvider } = await import('./contexts/StorageContext.jsx');
        console.log('✅ StorageContext imported successfully');
        
        console.log('Testing storageFactory import...');
        const storage = await import('./services/storageFactory.js');
        console.log('✅ StorageFactory imported successfully');
        
        console.log('Testing ErrorBoundary import...');
        const ErrorBoundary = await import('./components/ErrorBoundary.jsx');
        console.log('✅ ErrorBoundary imported successfully');
        
        setLoading(false);
        
      } catch (err) {
        console.error('Import failed:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    
    testImports();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>🧪 Testing Imports...</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>❌ Import Error</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <p>Check the browser console for details.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>✅ All Imports Successful!</h1>
      <p>StorageContext, StorageFactory, and ErrorBoundary imported successfully.</p>
      <p>The issue might be in the initialization logic.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StorageTestApp />
  </React.StrictMode>
);