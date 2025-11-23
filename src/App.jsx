import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useStorage } from './contexts/StorageContext.jsx';
import './App.css';

// Placeholder components - will be implemented in subsequent steps
const OnboardingPage = () => <div className="p-4"><h2 className="text-2xl font-bold mb-4">Onboarding</h2><p>Business setup and configuration will go here.</p></div>;
const DashboardPage = () => <div className="p-4"><h2 className="text-2xl font-bold mb-4">Dashboard</h2><p>Business overview and key metrics will go here.</p></div>;
const TeamManagementPage = () => <div className="p-4"><h2 className="text-2xl font-bold mb-4">Team Management</h2><p>Team member management will go here.</p></div>;
const ServicesPage = () => <div className="p-4"><h2 className="text-2xl font-bold mb-4">Services</h2><p>Services catalog management will go here.</p></div>;
const AppointmentsPage = () => <div className="p-4"><h2 className="text-2xl font-bold mb-4">Appointments</h2><p>Appointment booking and management will go here.</p></div>;
const SettingsPage = () => <div className="p-4"><h2 className="text-2xl font-bold mb-4">Settings</h2><p>Business settings and configuration will go here.</p></div>;

function App() {
  const { storage } = useStorage();

  // TODO: Handle seed data functionality when seedLocal.js is implemented
  const handleSeedData = async () => {
    try {
      // TODO: Call ensureStorageReady() and seedLocalData(storage)
      console.log('Seed data functionality will be implemented in Step 7');
      alert('Seed data functionality coming soon!');
    } catch (error) {
      console.error('Error seeding data:', error);
    }
  };

  // TODO: Handle sign in functionality when auth is implemented  
  const handleSignIn = () => {
    console.log('Sign in functionality will be implemented in Step 15');
    alert('Sign in functionality coming soon!');
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Top Header with Navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo/Brand */}
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Admin App</h1>
              </div>
              
              {/* Navigation Links */}
              <nav className="flex items-center space-x-8">
                <Link 
                  to="/onboarding" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Onboarding
                </Link>
                <Link 
                  to="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/team" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Team
                </Link>
                <Link 
                  to="/services" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Services
                </Link>
                <Link 
                  to="/appointments" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Appointments
                </Link>
                <Link 
                  to="/settings" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Settings
                </Link>
              </nav>

              {/* Right Side Buttons */}
              <div className="flex items-center space-x-3">
                {/* Development-only Seed Data button */}
                {import.meta.env.MODE !== 'production' && (
                  <button
                    onClick={handleSeedData}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    DEV: Seed Data
                  </button>
                )}
                <button
                  onClick={handleSignIn}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            {/* Default redirect to onboarding */}
            <Route path="/" element={<Navigate to="/onboarding" replace />} />
            
            {/* Admin Routes */}
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/team" element={<TeamManagementPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
