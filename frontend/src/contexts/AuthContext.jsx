import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/index.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check URL for token first (from Google OAuth redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      
      let token = localStorage.getItem('token');
      
      if (urlToken) {
        console.log('Token found in URL, saving to localStorage');
        token = urlToken;
        localStorage.setItem('token', urlToken);
        // Clear the token from URL without refreshing the page
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      console.log('Checking auth status with token:', token ? 'exists' : 'none');
      
      if (token) {
        try {
          // Validate token by calling the /me endpoint
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser({ token, ...response.data.data });
            console.log('User authenticated:', response.data.data.email);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Error validating token:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData) => {
    console.log('Login called with:', userData); // Debug log
    setUser(userData);
    if (userData.token) {
      localStorage.setItem('token', userData.token);
      console.log('Token stored in localStorage:', userData.token); // Debug log
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};