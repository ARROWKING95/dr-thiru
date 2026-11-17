import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/storage';

const AuthContext = createContext(null);

export const MRD_ADMIN_USERNAME = 'dr.thirumalai';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = storage.getCurrentUser();
    setUser(saved);
    setLoading(false);
  }, []);

  const isMrdAdmin = (user?.username || '').toLowerCase() === MRD_ADMIN_USERNAME;

  const signIn = async (usernameOrEmail, password) => {
    const users = storage.getUsers();
    const found = users.find(
      u => (u.username.toLowerCase() === usernameOrEmail.toLowerCase() || u.email.toLowerCase() === usernameOrEmail.toLowerCase())
    );

    if (!found) {
      throw new Error('User not found. Please check your username or register a new account.');
    }

    if (found.password && found.password !== password) {
      throw new Error('Incorrect password.');
    }

    storage.setCurrentUser(found);
    setUser(found);
    return found;
  };

  const signUp = async (userData) => {
    const users = storage.getUsers();
    if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      throw new Error('Username is already taken.');
    }
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('Email is already registered.');
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      ...userData
    };

    storage.saveUser(newUser);
    storage.setCurrentUser(newUser);
    setUser(newUser);
    return newUser;
  };

  const signOut = () => {
    storage.setCurrentUser(null);
    setUser(null);
  };

  const switchAccount = (username) => {
    const users = storage.getUsers();
    const target = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (target) {
      storage.setCurrentUser(target);
      setUser(target);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user,
        session: user ? { user } : null,
        loading,
        isMrdAdmin,
        signIn,
        signUp,
        signOut,
        switchAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
