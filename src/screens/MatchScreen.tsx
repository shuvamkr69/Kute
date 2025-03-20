import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any, "MatchScreen">;

const MatchScreen: React.FC<Props> = ({ navigation, route }) => {
  const params = route.params || {}; // Ensure params exist
  const { user, matchedUser } = params;

  if (!user || !matchedUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: Missing match details</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.overlay} />

      <Text style={styles.matchText}>It's a Match!</Text>

      {/* Updated Layout: User Images on both sides, Heart in the Center */}
      <View style={styles.imagesContainer}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: user.image }} style={styles.profileImage} />
        </View>
        
        <Image source={require("../assets/images/heart.png")} style={styles.heartIcon} />
        
        <View style={styles.imageWrapper}>
          <Image source={{ uri: matchedUser.image }} style={styles.profileImage} />
        </View>
      </View>

      <Text style={styles.description}>
        You and {matchedUser.fullName?.split(" ")[0] || "Someone"} have liked each other!
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Continue Swiping</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  matchText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFA62B",
    marginBottom: 20,
  },
  imagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFA62B",
  },
  heartIcon: {
    width: 60,
    height: 60,
    marginHorizontal: 15, // Adds space between images and heart
  },
  description: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#FFA62B",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: "#121212",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
});

export default MatchScreen;
