/**
 * Local Authentication Service (DEV ONLY)
 * 
 * WARNING: This is a placeholder authentication system for MVP development only.
 * It uses localStorage with basic encoding (btoa) which is NOT secure for production.
 * In production, use proper JWT tokens, secure password hashing, and server-side auth.
 * 
 * Features:
 * - Simple password-based authentication
 * - Session persistence via sessionStorage
 * - Basic password hashing with btoa() (DEV ONLY)
 * - Admin password management
 */

// Storage keys
const STORAGE_KEYS = {
  ADMIN_PASSWORD_HASH: 'admin_password_hash',
  SESSION_TOKEN: 'admin_signed_in',
  SESSION_TIMESTAMP: 'admin_session_timestamp'
};

// Default admin password for development (can be changed via setPassword)
const DEFAULT_ADMIN_PASSWORD = 'admin123';

// Session timeout (24 hours in milliseconds)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

/**
 * Simple hash function using btoa (BASE64 encoding)
 * WARNING: This is NOT secure and only for development!
 * In production, use bcrypt, scrypt, or similar secure hashing.
 */
function hashPassword(password) {
  try {
    // Add some salt for basic obfuscation (still not secure!)
    const salted = `${password}_appt_admin_salt_2025`;
    return btoa(salted);
  } catch (error) {
    console.error('Error hashing password:', error);
    return btoa(password); // Fallback to simple encoding
  }
}

/**
 * Initialize the auth system
 * Sets up default admin password if none exists
 */
function initializeAuth() {
  const existingHash = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD_HASH);
  if (!existingHash) {
    // Set default admin password
    const defaultHash = hashPassword(DEFAULT_ADMIN_PASSWORD);
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD_HASH, defaultHash);
    console.log('🔐 Auth initialized with default password:', DEFAULT_ADMIN_PASSWORD);
  }
}

/**
 * Check if user is currently signed in
 * Validates session token and timestamp
 */
export function isSignedIn() {
  try {
    const sessionToken = sessionStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    const sessionTimestamp = sessionStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP);
    
    if (!sessionToken || sessionToken !== 'true') {
      return false;
    }
    
    if (!sessionTimestamp) {
      return false;
    }
    
    // Check if session has expired
    const sessionTime = parseInt(sessionTimestamp, 10);
    const currentTime = Date.now();
    if (currentTime - sessionTime > SESSION_TIMEOUT) {
      // Session expired, clear it
      signOut();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking sign-in status:', error);
    return false;
  }
}

/**
 * Sign in with password
 * @param {Object} credentials - Sign-in credentials
 * @param {string} credentials.password - Admin password
 * @returns {Object} - Success status and message
 */
export function signIn({ password }) {
  try {
    // Initialize auth if needed
    initializeAuth();
    
    if (!password || typeof password !== 'string') {
      return {
        success: false,
        message: 'Password is required'
      };
    }
    
    // Get stored password hash
    const storedHash = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD_HASH);
    if (!storedHash) {
      return {
        success: false,
        message: 'Authentication system not initialized'
      };
    }
    
    // Hash the provided password and compare
    const providedHash = hashPassword(password);
    if (providedHash !== storedHash) {
      return {
        success: false,
        message: 'Invalid password'
      };
    }
    
    // Set session
    const currentTime = Date.now();
    sessionStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, 'true');
    sessionStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, currentTime.toString());
    
    return {
      success: true,
      message: 'Successfully signed in'
    };
    
  } catch (error) {
    console.error('Error during sign-in:', error);
    return {
      success: false,
      message: 'Sign-in failed due to system error'
    };
  }
}

/**
 * Sign out the current user
 * Clears session data
 */
export function signOut() {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_TIMESTAMP);
    return {
      success: true,
      message: 'Successfully signed out'
    };
  } catch (error) {
    console.error('Error during sign-out:', error);
    return {
      success: false,
      message: 'Sign-out failed'
    };
  }
}

/**
 * Set or change the admin password
 * @param {string} newPassword - New admin password
 * @returns {Object} - Success status and message
 */
export function setPassword(newPassword) {
  try {
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 3) {
      return {
        success: false,
        message: 'Password must be at least 3 characters long'
      };
    }
    
    const newHash = hashPassword(newPassword);
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD_HASH, newHash);
    
    return {
      success: true,
      message: 'Password updated successfully'
    };
    
  } catch (error) {
    console.error('Error setting password:', error);
    return {
      success: false,
      message: 'Failed to update password'
    };
  }
}

/**
 * Get current session info (for debugging)
 * @returns {Object} - Session information
 */
export function getSessionInfo() {
  const sessionToken = sessionStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
  const sessionTimestamp = sessionStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP);
  const hasPasswordSet = !!localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD_HASH);
  
  return {
    isSignedIn: isSignedIn(),
    hasSession: !!sessionToken,
    sessionTimestamp: sessionTimestamp ? new Date(parseInt(sessionTimestamp, 10)) : null,
    hasPasswordSet,
    sessionAge: sessionTimestamp ? Date.now() - parseInt(sessionTimestamp, 10) : null
  };
}

/**
 * Reset authentication system (DEV ONLY)
 * Clears all auth data and reinitializes with default password
 */
export function resetAuth() {
  try {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_PASSWORD_HASH);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_TIMESTAMP);
    
    initializeAuth();
    
    return {
      success: true,
      message: `Authentication reset. Default password: ${DEFAULT_ADMIN_PASSWORD}`
    };
  } catch (error) {
    console.error('Error resetting auth:', error);
    return {
      success: false,
      message: 'Failed to reset authentication'
    };
  }
}

// Initialize auth system on module load
initializeAuth();

// Export for debugging in development
if (import.meta.env.MODE !== 'production') {
  window.authDebug = {
    isSignedIn,
    signIn,
    signOut,
    setPassword,
    getSessionInfo,
    resetAuth,
    defaultPassword: DEFAULT_ADMIN_PASSWORD
  };
  console.log('🔐 Auth Debug: Use window.authDebug to test authentication');
}

export default {
  isSignedIn,
  signIn,
  signOut,
  setPassword,
  getSessionInfo,
  resetAuth
};