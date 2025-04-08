import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import { Image } from "react-native";
import { Video, ResizeMode } from 'expo-av';




interface LoadingScreenProps {
  description?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ description = "Loading..." }) => {
  return (
    <View style={styles.container}>
      {/* Lottie Animation */}
      <LottieView
        source={require("../assets/animations/redBeatingHeartLoadingScreen.json")} // Replace with your animation file
        autoPlay
        />
      {/* Custom Description */}
      <Text style={styles.text}>{description}</Text>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
  },
  animation: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  text: {
    color: "white",
    fontSize: 18,
    marginBottom: 20,
    fontWeight: "600",
    fontStyle: "italic",
    top: "70%"
  },
});
