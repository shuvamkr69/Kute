import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);

  useEffect(() => {
    const loadAuthState = async () => {
      const storedState = await AsyncStorage.getItem('isSignedIn');
      if (storedState === 'true') {
        setIsSignedIn(true);
      }
    };
    loadAuthState();
  }, []);

  const signIn = async () => {
    setIsSignedIn(true);
    await AsyncStorage.setItem('isSignedIn', 'true');
  };

  const signOut = async () => {
    setIsSignedIn(false);
    await AsyncStorage.removeItem('isSignedIn');
  };

  return (
    <AuthContext.Provider value={{ isSignedIn, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
