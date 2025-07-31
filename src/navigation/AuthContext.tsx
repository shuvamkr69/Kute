import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

type AuthContextType = {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
  user: any;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        setLoading(true);
        // Check both isSignedIn flag and presence of access token
        const storedState = await AsyncStorage.getItem('isSignedIn');
        const accessToken = await AsyncStorage.getItem('accessToken');
        const storedUser = await AsyncStorage.getItem('user');
        
        // User is signed in if either the flag is set OR they have a valid access token
        if (storedState === 'true' || accessToken) {
          console.log('🔐 Auth state loaded: User is signed in');
          setIsSignedIn(true);
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          
          // Sync the isSignedIn flag if it's missing but we have a token
          if (accessToken && storedState !== 'true') {
            await AsyncStorage.setItem('isSignedIn', 'true');
          }
        } else {
          console.log('🔐 Auth state loaded: User is not signed in');
          setIsSignedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        setIsSignedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadAuthState();
  }, []);

  const signIn = async () => {
    setIsSignedIn(true);
    await AsyncStorage.setItem('isSignedIn', 'true');
  };

  const signOut = async () => {
    try {
      // Clear push token from backend before signing out
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) {
        try {
          console.log('🔄 Clearing push token from backend...');
          await api.patch('/api/v1/users/clearPushToken');
          console.log('✅ Push token cleared from backend');
        } catch (error) {
          console.error('❌ Error clearing push token from backend:', error);
          // Continue with logout even if backend call fails
        }
      }

      setIsSignedIn(false);
      setUser(null);
      
      // Clear all authentication-related data including push token
      await AsyncStorage.removeItem('isSignedIn');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('avatar');
      await AsyncStorage.removeItem('location');
      await AsyncStorage.removeItem('tempUserData');
      await AsyncStorage.removeItem('pushToken'); // Clear stored push token
      
      console.log('🔐 User signed out and all auth data cleared');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isSignedIn, signIn, signOut, user, loading }}>
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
