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
const SettingsPage = () => {
  const { storage, isReady } = useStorage();
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importMode, setImportMode] = React.useState('replace'); // 'replace' or 'merge'
  const [message, setMessage] = React.useState({ text: '', type: '' });
  const [stats, setStats] = React.useState(null);
  const fileInputRef = React.useRef(null);

  // Load storage statistics
  React.useEffect(() => {
    async function loadStats() {
      if (!isReady) return;
      
      try {
        const { getStorageStats } = await import('./services/exportImport.js');
        const storageStats = await getStorageStats(storage);
        setStats(storageStats);
      } catch (error) {
        console.error('Failed to load storage stats:', error);
      }
    }
    
    loadStats();
  }, [storage, isReady]);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const { exportStore } = await import('./services/exportImport.js');
      
      await exportStore(storage);
      showMessage('✅ Data exported successfully! Check your downloads folder.', 'success');
      
    } catch (error) {
      console.error('Export failed:', error);
      showMessage(`❌ Export failed: ${error.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const { importStore } = await import('./services/exportImport.js');
      
      const result = await importStore(file, storage, { 
        merge: importMode === 'merge',
        validate: true 
      });
      
      if (result.success) {
        showMessage(`✅ ${result.message}`, 'success');
        
        // Reload stats
        const { getStorageStats } = await import('./services/exportImport.js');
        const newStats = await getStorageStats(storage);
        setStats(newStats);
        
        // Log warnings if any
        if (result.warnings?.length > 0) {
          console.warn('Import warnings:', result.warnings);
        }
        
      } else {
        showMessage(`❌ ${result.message}`, 'error');
      }
      
    } catch (error) {
      console.error('Import failed:', error);
      showMessage(`❌ Import failed: ${error.message}`, 'error');
    } finally {
      setIsImporting(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      {/* Message Display */}
      {message.text && (
        <div className={`card ${message.type === 'error' ? 'error-message' : message.type === 'success' ? 'success-message' : 'info-message'}`} 
             style={{ 
               background: message.type === 'error' ? 'var(--error-50)' : 
                          message.type === 'success' ? 'var(--success-50)' : 'var(--primary-50)',
               borderColor: message.type === 'error' ? 'var(--error-200)' : 
                           message.type === 'success' ? 'var(--success-200)' : 'var(--primary-200)',
               color: message.type === 'error' ? 'var(--error-700)' : 
                      message.type === 'success' ? 'var(--success-700)' : 'var(--primary-700)'
             }}>
          <div className="card-content" style={{ padding: 'var(--space-4)' }}>
            {message.text}
          </div>
        </div>
      )}

      {/* Business Configuration */}
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">
            ⚙️ Settings
          </h1>
          <p className="card-subtitle">Configure your business settings and manage data</p>
        </div>
        <div className="card-content">
          <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
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
                    <option>UTC</option>
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

      {/* Data Management */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            💾 Data Management
          </h2>
          <p className="card-subtitle">Export and import your appointment data</p>
        </div>
        <div className="card-content">
          <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
            
            {/* Storage Statistics */}
            {stats && (
              <div>
                <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--gray-900)' }}>📊 Current Data</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-3)' }}>
                  <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-600)' }}>{stats.businesses}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Businesses</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-600)' }}>{stats.teamMembers}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Team Members</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning-600)' }}>{stats.services}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Services</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--error-600)' }}>{stats.appointments}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Appointments</div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Section */}
            <div>
              <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--gray-900)' }}>📤 Export Data</h3>
              <p style={{ marginBottom: 'var(--space-4)', color: 'var(--gray-600)' }}>
                Download all your data as a JSON file for backup or migration purposes.
              </p>
              <button 
                onClick={handleExport}
                disabled={isExporting || !isReady}
                className="btn btn-primary"
              >
                {isExporting ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    <span>Export Data</span>
                  </>
                )}
              </button>
            </div>

            {/* Import Section */}
            <div>
              <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--gray-900)' }}>📥 Import Data</h3>
              <p style={{ marginBottom: 'var(--space-4)', color: 'var(--gray-600)' }}>
                Import data from a previously exported JSON file. Choose merge mode to add to existing data or replace mode to overwrite all data.
              </p>
              
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">Import Mode</label>
                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={(e) => setImportMode(e.target.value)}
                    />
                    <span>Replace All Data</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={(e) => setImportMode(e.target.value)}
                    />
                    <span>Merge with Existing</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={isImporting || !isReady}
                  style={{ display: 'none' }}
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting || !isReady}
                  className="btn btn-secondary"
                >
                  {isImporting ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <span>📥</span>
                      <span>Select JSON File</span>
                    </>
                  )}
                </button>
                
                <span style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                  Mode: {importMode === 'replace' ? '🔄 Replace All' : '🔀 Merge'}
                </span>
              </div>
            </div>
            
            {/* Warning */}
            <div style={{ 
              background: 'var(--warning-50)', 
              border: '1px solid var(--warning-200)', 
              borderRadius: 'var(--radius-md)', 
              padding: 'var(--space-4)',
              color: 'var(--warning-700)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <div>
                  <strong>Important:</strong> Always backup your data before importing. 
                  Replace mode will permanently delete all existing data. 
                  Merge mode may create duplicate entries if IDs conflict.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
