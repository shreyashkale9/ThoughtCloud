import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { api } from '../utils/api';

interface User {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  profilePicture?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);

  const setAndStoreToken = (token: string | null) => {
    setToken(token);
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  // Fetch user profile when token changes
  useEffect(() => {
    if (token) {
      api.get('/profile', token)
        .then((userData: User) => setUser(userData))
        .catch(() => {
          // If token is invalid, logout
          logout();
        });
    } else {
      setUser(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      setToken: setAndStoreToken, 
      updateUser, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};