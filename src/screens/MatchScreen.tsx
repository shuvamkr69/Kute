import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

const { width, height } = Dimensions.get("window");

type Props = NativeStackScreenProps<any, "MatchScreen">;

const MatchScreen: React.FC<Props> = ({ navigation, route }) => {
  const params = route.params || {};
  const { user, matchedUser } = params;

  if (!user || !matchedUser) {
    return (
      <LinearGradient colors={["#1f4d2c", "#195252"]} style={styles.container}>
        <Text style={styles.errorText}>Error: Missing match details</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.fallbackButton}>
          <LinearGradient colors={["#388c50", "#257d7d"]} style={styles.fullWidthGradient}>
            <Text style={styles.buttonText}>Go Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1f4d2c", "#195252"]} style={styles.container}>
      <View style={styles.overlay} />

      <SafeAreaView style={styles.contentWrapper}>
        {/* Tinder Match Text Image at Top */}
        <View style={styles.matchImageWrapper}>
          <Image
            source={require("../assets/images/TinderMatchText.png")}
            style={styles.matchText}
            resizeMode="contain"
          />
        </View>

        {/* Catchy Line */}
        <Text style={styles.catchyLine}>Two Hearts, One Vibe</Text>

        {/* Profile Images + Heart */}
        <View style={styles.imagesContainer}>
          <Image source={{ uri: user.image }} style={styles.profileImage} />

          <Image
            source={require("../assets/images/heart-attack.png")}
            style={styles.heartIcon}
          />

          <Image source={{ uri: matchedUser.image }} style={styles.profileImage} />
        </View>

        {/* Description */}
        <Text style={styles.description}>
          {matchedUser.fullName?.split(" ")[0] || "Someone"} has liked you back!
        </Text>
      </SafeAreaView>

      {/* Fixed Bottom Button */}
      <TouchableOpacity
        style={styles.bottomButtonWrapper}
        onPress={() => navigation.goBack()}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#1b5f49", "#004d4d"]}
          style={styles.fullWidthGradient}
        >
          <Text style={styles.buttonText}>Keep the momentum. Keep swiping</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  matchImageWrapper: {
    marginBottom: -30,
  },
  matchText: {
    width: width * 0.9,
    height: height * 0.39,
  },
  catchyLine: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: -50,
    marginBottom: 70,
  },
  imagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    gap: 40,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#fff",
    zIndex: 2,
  },
  heartIcon: {
    width: 200,
    height: 200,
    marginHorizontal: -40,
    zIndex: 1,
    position: "absolute",
  },
  description: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: 10,
    marginTop: 20,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  bottomButtonWrapper: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  fullWidthGradient: {
    width: "100%",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  fallbackButton: {
    position: "absolute",
    bottom: 40,
    width: "100%",
  },
});

export default MatchScreen;
