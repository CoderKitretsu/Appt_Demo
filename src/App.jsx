import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useStorage } from './contexts/StorageContext.jsx';
import { ensureStorageReady } from './services/storageFactory.js';
import { seedLocalData } from './mock/seedLocal.js';
import './App.css';

// Import the actual pages
import OnboardingPage from './pages/Onboarding.jsx';
import TeamManagement from './pages/TeamManagement.jsx';
import Services from './pages/Services.jsx';
import Appointments from './pages/Appointments.jsx';
import Calendar from './pages/Calendar.jsx';

const DashboardPage = () => (
  <div className="card">
    <div className="card-header">
      <h1 className="card-title">
        📊 Dashboard
      </h1>
      <p className="card-subtitle">Business overview and analytics</p>
    </div>
    <div className="card-content">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-content">
            <h3 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--primary-600)' }}>📅 Today's Appointments</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: 'var(--gray-900)' }}>12</p>
            <p style={{ margin: 'var(--space-1) 0 0 0', color: 'var(--gray-600)', fontSize: '0.9rem' }}>+3 from yesterday</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <h3 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--success-600)' }}>💰 Revenue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: 'var(--gray-900)' }}>$2,450</p>
            <p style={{ margin: 'var(--space-1) 0 0 0', color: 'var(--gray-600)', fontSize: '0.9rem' }}>This week</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <h3 style={{ margin: '0 0 var(--space-2) 0', color: 'var(--warning-600)' }}>👥 Active Staff</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: 'var(--gray-900)' }}>8</p>
            <p style={{ margin: 'var(--space-1) 0 0 0', color: 'var(--gray-600)', fontSize: '0.9rem' }}>Currently working</p>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: 'var(--space-8)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)', color: 'var(--gray-900)' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary">
            📅 New Appointment
          </button>
          <button className="btn btn-secondary">
            👥 Add Team Member  
          </button>
          <button className="btn btn-secondary">
            💼 Add Service
          </button>
        </div>
      </div>
    </div>
  </div>
);
const SettingsPage = () => (
  <div className="card">
    <div className="card-header">
      <h1 className="card-title">
        ⚙️ Settings
      </h1>
      <p className="card-subtitle">Configure your business settings</p>
    </div>
    <div className="card-content">
      <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
        <div>
          <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--gray-900)' }}>Business Configuration</h3>
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input type="text" className="form-input" placeholder="Your Business Name" />
            </div>
            <div className="form-group">
              <label className="form-label">Time Zone</label>
              <select className="form-select">
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
                <option>Europe/London</option>
              </select>
            </div>
          </div>
        </div>
        
        <div>
          <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--gray-900)' }}>Notification Settings</h3>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <input type="checkbox" defaultChecked />
              <span>Email notifications for new appointments</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <input type="checkbox" defaultChecked />
              <span>SMS reminders to customers</span>
            </label>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-primary">Save Settings</button>
          <button className="btn btn-secondary">Reset to Defaults</button>
        </div>
      </div>
    </div>
  </div>
);

// Import the test page
import TestPage from './pages/TestPage.jsx';

function App() {
  const { storage, isReady, error } = useStorage();
  const [isSeeding, setIsSeeding] = React.useState(false);
  
  // Show loading state while storage initializes
  if (!isReady && !error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <h2>🏥 Appointment Demo</h2>
        <p>Initializing storage...</p>
        <div style={{ marginTop: '1rem' }}>⏳ Please wait...</div>
      </div>
    );
  }
  
  // Show error state if storage failed to initialize
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        color: 'red'
      }}>
        <h2>❌ Storage Error</h2>
        <p>Failed to initialize storage: {error.message}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  // Handle seed data functionality
  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      console.log('🌱 Starting data seeding process...');
      
      // Ensure storage is ready
      await ensureStorageReady();
      
      // Seed the data
      const businessId = await seedLocalData(storage);
      
      // Success feedback
      console.log(`✅ Seeding completed! Business ID: ${businessId}`);
      alert(`✅ Sample data created successfully!\n\nBusiness: Elite Hair & Beauty Salon\nCheck the browser console for details.`);
      
    } catch (error) {
      console.error('❌ Error seeding data:', error);
      alert(`❌ Seeding failed: ${error.message}\n\nCheck the browser console for details.`);
    } finally {
      setIsSeeding(false);
    }
  };

  // TODO: Handle sign in functionality when auth is implemented  
  const handleSignIn = () => {
    console.log('Sign in functionality will be implemented in Step 15');
    alert('Sign in functionality coming soon!');
  };

  return (
    <Router>
      <div className="app-layout">
        {/* Modern Header with Navigation */}
        <header className="app-header">
          <div className="app-header-content">
            {/* Modern Brand */}
            <Link to="/dashboard" className="app-brand">
              <div className="brand-icon">🏥</div>
              <span>AppointmentPro</span>
            </Link>
            
            {/* Navigation */}
            <nav className="main-nav">
              <Link to="/onboarding" className="nav-link">
                📋 Setup
              </Link>
              <Link to="/dashboard" className="nav-link">
                📊 Dashboard
              </Link>
              <Link to="/team" className="nav-link">
                👥 Team
              </Link>
              <Link to="/services" className="nav-link">
                💼 Services
              </Link>
              <Link to="/appointments" className="nav-link">
                📅 Appointments
              </Link>
              <Link to="/calendar" className="nav-link">
                🗓️ Calendar
              </Link>
              <Link to="/settings" className="nav-link">
                ⚙️ Settings
              </Link>
              
              {/* Development Actions */}
              {import.meta.env.MODE !== 'production' && (
                <>
                  <Link to="/test" className="nav-link dev-link">
                    🧪 Test
                  </Link>
                  <button
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="seed-button"
                  >
                    {isSeeding ? (
                      <>
                        <div className="loading-spinner"></div>
                        <span>Seeding...</span>
                      </>
                    ) : (
                      <>
                        <span>🌱</span>
                        <span>Demo Data</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/services" element={<Services />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {import.meta.env.MODE !== 'production' && (
              <Route path="/test" element={<TestPage />} />
            )}
            
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
