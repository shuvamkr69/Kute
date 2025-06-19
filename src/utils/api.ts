import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";



// Create an Axios instance
const api = axios.create({
  baseURL: "http://192.168.18.150:3000", // Replace with your backend URL
  timeout: 600000, // 60 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.error("Unauthorized: Redirecting to login...");
      AsyncStorage.removeItem("accessToken"); // Clear expired token
      // Handle navigation to login screen in React Native
    }

    return Promise.reject(error);
  }
);

export default api;