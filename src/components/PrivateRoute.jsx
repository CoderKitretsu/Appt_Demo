/**
 * PrivateRoute Component
 * 
 * Wrapper component that protects routes requiring authentication.
 * Redirects unauthenticated users to the sign-in page.
 * Preserves the intended destination for post-login navigation.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isSignedIn } from '../services/auth/localAuth.js';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const authenticated = isSignedIn();

  if (!authenticated) {
    // Redirect to sign-in page with return location
    return (
      <Navigate 
        to="/sign-in" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // User is authenticated, render the protected content
  return children;
};

export default PrivateRoute;