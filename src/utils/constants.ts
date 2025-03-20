import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';

interface DecodedToken {
  _id: string;
  exp?: number; // Optional: If JWT has an expiry field
}

/**
 * Retrieves the logged-in user's ID from JWT stored in AsyncStorage.
 */
export const getUserId = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('accessToken'); // Retrieve JWT from storage
    if (!token) return null;

    const decodedToken: DecodedToken = jwtDecode<DecodedToken>(token); // Decode JWT
    return decodedToken._id ?? null; // Extract userId or return null
  } catch (error) {
    console.error('Error retrieving user ID:', error);
    return null;
  }
};
