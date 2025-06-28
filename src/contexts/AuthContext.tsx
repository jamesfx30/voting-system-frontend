// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};

export const AuthContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Explicitly manage this state
  const [loading, setLoading] = useState(true);

  console.log('AuthContextProvider Rendered. Initial authToken state (from localStorage):', authToken);

  const validateAndSetUser = (token) => {
    console.log('AuthContext: validateAndSetUser CALLED with token:', token); // Logs the FULL token
    
    if (!token) {
      console.log('AuthContext: Token is NULL or UNDEFINED, cannot decode. Setting user to null and isAuthenticated to false.');
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
    try {
      const decoded = jwtDecode(token);
      console.log('AuthContext: JWT Decoded Payload:', decoded); // Logs the FULL decoded payload

      const currentTime = Date.now() / 1000;

      console.log('AuthContext: JWT Decoded Expiration (exp):', decoded.exp);
      console.log('AuthContext: Client Current Time (seconds):', currentTime);
      const timeDifference = decoded.exp - currentTime;
      console.log('AuthContext: Time difference (exp - currentTime):', timeDifference, 'seconds');

      if (decoded.exp < currentTime) {
        console.warn('AuthContext: JWT expired client-side. Logging out.');
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
        return false;
      } else {
        console.log(`AuthContext: JWT is valid for ${timeDifference.toFixed(2)} more seconds.`);
        setUser({ 
            id: decoded.id, 
            username: decoded.username || decoded.email, // Use username if present, else email
            email: decoded.email, 
            role: decoded.role 
        });
        setIsAuthenticated(true); // Set to true if valid
        return true;
      }
    } catch (error) {
      console.error('AuthContext: Error decoding or validating token:', error); // Use console.error for visibility
      localStorage.removeItem('authToken');
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  };

  const login = (token) => {
    console.log('AuthContext: Login function called. Saving token to localStorage.');
    localStorage.setItem('authToken', token);
    setAuthToken(token); // This will trigger the useEffect for authToken changes
    validateAndSetUser(token); // Validate and set user immediately
    console.log('AuthContext: User logged in, new token processed.');
  };

  const logout = () => {
    console.log('AuthContext: Logout function called. Removing token.');
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/'); 
  };

  useEffect(() => {
    console.log('AuthContext: Initial mount useEffect triggered.');
    setLoading(true);
    const storedToken = localStorage.getItem('authToken');
    console.log('AuthContext: Initial mount useEffect. Stored token retrieved:', storedToken);
    if (storedToken) {
      validateAndSetUser(storedToken);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []); // Run once on mount

  // Watch for changes in authToken state to re-validate
  useEffect(() => {
    console.log('AuthContext: authToken state change useEffect triggered. Current authToken:', authToken);
    if (authToken !== null) { 
      validateAndSetUser(authToken);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [authToken]);

  const contextValue = {
    user,
    authToken,
    isAuthenticated, // Now directly uses the state variable
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};