import React, { useEffect } from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import LottieView from "lottie-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack"; // Import for TypeScript types

// Define your navigation prop type
type Props = NativeStackScreenProps<any, 'SplashScreen'>;

const SplashScreenComponent: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    // Ensure navigation is defined before trying to navigate
    if (navigation) {
      setTimeout(() => {
        navigation.navigate("Home"); // Navigate to "Home" after 5 seconds
      }, 2000); // Adjust delay according to animation duration
    } 
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Heart Animation */}
      <LottieView
        source={require("../assets/animations/heart-animation.json")} // Ensure this path is correct
        autoPlay
        loop
        style={styles.animation}
      />

      <Text style={styles.logoText}>Kute</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  animation: {
    width: 200,  // Customize the size
    height: 200, // Customize the size
  },
  logoText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FF4081",
    marginTop: 20,
    textShadowColor: "#FF4081",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
});

export default SplashScreenComponent;
