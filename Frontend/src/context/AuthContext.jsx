import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { apiClient } from '../api/client';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  // Setup axios default headers and interceptors
  useEffect(() => {
    // Set the authorization header
    if (token) {
      const current = axios.defaults.headers.common['Authorization'];
      const want = `Bearer ${token}`;
      if (current !== want) {
        // Set axios default Authorization header. Do NOT log the full token for security.
        console.log('Setting axios Authorization header');
        axios.defaults.headers.common['Authorization'] = want;
      }
    } else {
      if (axios.defaults.headers.common['Authorization']) {
        console.log('Clearing axios Authorization header');
        delete axios.defaults.headers.common['Authorization'];
      }
    }
  }, [token]);

  // Add response interceptor to handle token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && error.response?.data?.error === 'Token expired') {
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post('/api/auth/refresh-token', { refresh_token: refreshToken });
              const newToken = response.data.access_token;
              localStorage.setItem('access_token', newToken);
              setToken(newToken);
              axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              return axios(error.config);
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setToken(null);
            setUser(null);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Load user from token
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Fetch user profile from /api/auth/me endpoint
          const response = await apiClient.get('/api/auth/me');
          setUser(response.data.user || response.data);
        } catch (error) {
          console.error('Failed to load user:', error.response?.data || error.message);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    setToken(response.data.access_token);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (data) => {
    try {
      console.log('Registering user');
      const response = await axios.post('/api/auth/register', data);
      // Do not log sensitive token details
      const { access_token, refresh_token } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      setToken(access_token);
      setUser(response.data.user);
      console.log('Token saved to localStorage');
      return response.data;
    } catch (error) {
      console.error('Register error details:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
