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
      try {
        // Check both isSignedIn flag and presence of access token
        const storedState = await AsyncStorage.getItem('isSignedIn');
        const accessToken = await AsyncStorage.getItem('accessToken');
        
        // User is signed in if either the flag is set OR they have a valid access token
        if (storedState === 'true' || accessToken) {
          console.log('🔐 Auth state loaded: User is signed in');
          setIsSignedIn(true);
          
          // Sync the isSignedIn flag if it's missing but we have a token
          if (accessToken && storedState !== 'true') {
            await AsyncStorage.setItem('isSignedIn', 'true');
          }
        } else {
          console.log('🔐 Auth state loaded: User is not signed in');
          setIsSignedIn(false);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        setIsSignedIn(false);
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
    // Clear all authentication-related data
    await AsyncStorage.removeItem('isSignedIn');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('avatar');
    await AsyncStorage.removeItem('location');
    await AsyncStorage.removeItem('tempUserData');
    console.log('🔐 User signed out and all auth data cleared');
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
