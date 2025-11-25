import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Simple version of App to test routing
function SimpleApp() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>🏥 Appointment Demo App</h1>
      <nav style={{ margin: '2rem 0' }}>
        <button style={{ margin: '0 1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Dashboard
        </button>
        <button style={{ margin: '0 1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Team
        </button>
        <button style={{ margin: '0 1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Services
        </button>
        <button style={{ margin: '0 1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Appointments
        </button>
        <button style={{ margin: '0 1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Calendar
        </button>
      </nav>
      <div style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '8px' }}>
        <p>✅ React is working</p>
        <p>✅ Basic App structure loaded</p>
        <p>🔍 Now testing imports...</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>
);