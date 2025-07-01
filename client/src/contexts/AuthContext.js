import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUser = () => {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          setUser(JSON.parse(userInfo));
        } catch (error) {
          console.error('Error parsing user info from localStorage:', error);
          localStorage.removeItem('userInfo');
          localStorage.removeItem('userToken');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Register a new user
  const register = async (formData) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      
      return { 
        success: true, 
        message: res.data.message
      };
    } catch (err) {
      console.error('Registration error:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Registration failed' 
      };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      
      // Save to localStorage
      localStorage.setItem('userToken', res.data.token);
      localStorage.setItem('userInfo', JSON.stringify({
        id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        patientKey: res.data.patientKey,
        linkedPatientId: res.data.linkedPatientId
      }));
      
      setUser({
        id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        patientKey: res.data.patientKey,
        linkedPatientId: res.data.linkedPatientId
      });
      
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

