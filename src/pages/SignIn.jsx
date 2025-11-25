/**
 * SignIn Page Component
 * 
 * Provides authentication interface for admin users.
 * Features password input, form validation, and error handling.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn } from '../services/auth/localAuth.js';

const SignIn = () => {
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = signIn({ password: password.trim() });
      
      if (result.success) {
        // Successfully signed in, navigate to intended page
        navigate(from, { replace: true });
      } else {
        setError(result.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)',
      padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-header" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>🔐</div>
          <h1 className="card-title">Admin Sign In</h1>
          <p className="card-subtitle">Enter your admin password to continue</p>
        </div>
        
        <div className="card-content">
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
            
            {/* Password Input */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  className={`form-input ${error ? 'error' : ''}`}
                  placeholder="Enter admin password"
                  disabled={isLoading}
                  autoFocus
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  style={{
                    position: 'absolute',
                    right: 'var(--space-3)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: 'var(--gray-500)',
                    padding: 'var(--space-1)'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: 'var(--space-3)',
                background: 'var(--error-50)',
                color: 'var(--error-700)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--error-200)',
                fontSize: '0.9rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span>❌</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>🔓</span>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Development Info */}
        {import.meta.env.MODE !== 'production' && (
          <div style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3)',
            background: 'var(--warning-50)',
            color: 'var(--warning-700)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--warning-200)',
            fontSize: '0.8rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <span>💡</span>
              <div>
                <strong>Development Mode:</strong><br />
                Default admin password: <code style={{ 
                  background: 'var(--warning-100)', 
                  padding: '2px 4px', 
                  borderRadius: '3px',
                  fontWeight: 'bold'
                }}>admin123</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignIn;