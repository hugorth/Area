import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * PrivateRoute component that protects routes from unauthorized access.
 * 
 * This component checks for an authentication token in the local storage or URL parameters.
 * If a token is found, the user is considered authenticated and the protected route is rendered.
 * Otherwise, the user is redirected to the login page.
 * 
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {React.ReactNode} props.children - The child components to render if the user is authenticated.
 * 
 * @returns {React.ReactNode} The protected route if authenticated, otherwise a redirect to the login page.
 */
const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const tokenInStorage = localStorage.getItem('token');
    
    const urlParams = new URLSearchParams(location.search);
    const tokenInUrl = urlParams.get('token');

    if (tokenInUrl) {
      localStorage.setItem('token', tokenInUrl);
      setIsAuthenticated(true);
    } else if (tokenInStorage) {
      setIsAuthenticated(true);
    }

    const userID = urlParams.get('userId');
    if (userID) {
      localStorage.setItem('userId', userID);
    }

    setLoading(false);
  }, [location]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
