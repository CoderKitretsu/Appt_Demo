import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Simple test component
function TestApp() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🧪 React App Test</h1>
      <p>If you can see this, React is working!</p>
      <p>Time: {new Date().toLocaleString()}</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);