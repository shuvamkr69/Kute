import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ToastAndroid,
  Button,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/FontAwesome";
import CustomButton from "../components/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/api";
import { Dimensions, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RefreshControl } from "react-native";
import { set } from "mongoose";
const VerificationImage = require("../assets/icons/verified-logo.png");


type Props = NativeStackScreenProps<any, "MyProfile">;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [profileProgress, setProfileProgress] = useState(0);
  const animatedProgress = useState(new Animated.Value(0))[0];
  const screenWidth = Dimensions.get("window").width;
  const progressBarWidth = screenWidth * 0.7; // Adjust width as needed

  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(
    "https://www.shutterstock.com/image-photo/very-random-pose-asian-men-260nw-2423213779.jpg"
  );
  const [age, setAge] = useState<number | null>(null);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isPremiumActive, setIsPremiumActive] = useState(false);

  const [occupation, setOccupation] = useState("");
  const [workingAt, setWorkingAt] = useState("");
  const [religion, setReligion] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [genderOrientation, setGenderOrientation] = useState("");
  const [languages, setLanguages] = useState("");
  const [loveLanguage, setloveLanguage] = useState("");
  const [zodiac, setzodiac] = useState("");
  const [familyPlanning, setFamilyPlanning] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [height, setHeight] = useState<string>("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "feet">("cm");

  const onRefresh = async () => {
    //for refreshing the screen
    setRefreshing(true);

    try {
      const response = await api.get("/api/v1/users/me");
      const user = response.data;

      setName(user.fullName || "");
      setAge(user.age || null);
      setProfilePhoto(user.avatar1 || profilePhoto);
      setBio(user.bio || "");
      setIsVerified(user.isVerified || false);
      setIsPremiumActive(user.isPremiumActive || false);
      setOccupation(user.occupation || "");
      setWorkingAt(user.workingAt || "");
      setReligion(user.religion || "");
      setPronouns(user.pronouns || "");
      setGenderOrientation(user.genderOrientation || "");
      setLanguages(user.languages || "");
      setloveLanguage(user.loveLanguage || "");
      setzodiac(user.zodiac || "");
      setFamilyPlanning(user.familyPlanning || "");
      setBodyType(user.bodyType || "");
      setHeight(user.height || "");
      setHeightUnit(user.heightUnit || "cm");
      ToastAndroid.show("Profile Refreshed!", ToastAndroid.SHORT);
    } catch (error) {
      console.log("Refresh Error:", error);
      ToastAndroid.show("Failed to refresh profile", ToastAndroid.SHORT);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        await AsyncStorage.removeItem("user"); // ✅ Ensure no stale data is loaded

        // ✅ Always fetch fresh user data from API first
        const response = await api.get("/api/v1/users/me");
        const user = response.data;

        setName(user.fullName || "");
        setAge(user.age || null);
        setProfilePhoto(user.avatar1 || profilePhoto);
        setBio(user.bio || "");
        setIsVerified(user.isVerified || false);
        setIsPremiumActive(user.isPremiumActive || false);
        setOccupation(user.occupation || "");
        setWorkingAt(user.workingAt || "");
        setReligion(user.religion || "");
        setPronouns(user.pronouns || "");
        setGenderOrientation(user.genderOrientation || "");
        setLanguages(user.languages || "");
        setloveLanguage(user.loveLanguage || "");
        setzodiac(user.zodiac || "");
        setFamilyPlanning(user.familyPlanning || "");
        setBodyType(user.bodyType || "");
        setHeight(user.height || "");
        setHeightUnit(user.heightUnit || "cm");

        // ✅ Save API response for offline access
        await AsyncStorage.setItem("user", JSON.stringify(user));
      } catch (error) {
        console.log("API error, loading from AsyncStorage", error);

        // 🔄 Load offline data only if API fails
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          setName(user.fullName || "");
          setAge(user.age || null);
          setProfilePhoto(user.avatar1 || profilePhoto);
          setBio(user.bio || "");
        } else {
          ToastAndroid.show("No data found/ server error", ToastAndroid.SHORT);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  //progress for the progrss bar

  useEffect(() => {
    let progress = 0;
    if (
      profilePhoto !==
      "https://www.shutterstock.com/image-photo/very-random-pose-asian-men-260nw-2423213779.jpg"
    )
      progress += 5;
    if (name) progress += 5;
    if (bio) progress += 5;
    if (age) progress += 5;
    if (isVerified) progress += 8;
    if (workingAt) progress += 8;
    if (bodyType) progress += 8;
    if (height) progress += 8;
    if (zodiac) progress += 8;
    if (loveLanguage) progress += 8;
    if (genderOrientation) progress += 8;
    if (languages) progress += 8;
    if (occupation) progress += 8;
    if (pronouns) progress += 8;

    setProfileProgress(progress);
  }, [
    name,
    bio,
    age,
    profilePhoto,
    isVerified,
    workingAt,
    bodyType,
    height,
    zodiac,
    loveLanguage,
    genderOrientation,
    languages,
    occupation,
    pronouns,
  ]);

  useEffect(() => {
    Animated.spring(animatedProgress, {
      toValue: (profileProgress / 100) * progressBarWidth,
      useNativeDriver: false,
      bounciness: 15,
    }).start();
  }, [profileProgress]);

  const handleUpgrade = () => {
    navigation.navigate("Premium");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#FFF" }}>Loading...</Text>
      </View>
    );
  }

  const InfoSection = ({
    title,
    data,
  }: {
    title: string;
    data: { label: string; value: string }[];
  }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length > 0 ? (
        data.map((item, index) => (
          <View key={index} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue}>{item.value}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noInfo}>No information added</Text>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#5de383"]}
        />
      }
    >
      {/* Profile Section */}
      <View style={styles.profileContainer}>
      <View style={styles.profileImageContainer}>
  {/* Profile Image */}
  <Image source={{ uri: profilePhoto }} style={styles.profileImage} />

  {/* Edit Icon */}
  <TouchableOpacity
    style={styles.editIcon}
    onPress={() => navigation.navigate("EditProfile")}
  >
    <Icon name="pencil" size={14} color="#121212" />
  </TouchableOpacity>

  {/* Verification Image - Replaces the Verification Icon */}
  <Image
    source={VerificationImage}
    style={[
      styles.verificationImage,
      { tintColor: isVerified ? null : "#B0B0B0", opacity: isVerified ? 1 : 0.5 }
    ]}
  />
</View>


        <Text style={styles.username}>
          {name} {age}
        </Text>
        
        <Text style={styles.bio}>{bio}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground, { width: progressBarWidth }]}>
          <Animated.View
            style={[styles.progressFill, { width: animatedProgress }]}
          >
            <LinearGradient
              colors={["#5de383", "#4b9e6a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            />
            <View style={styles.arrowHead} />
          </Animated.View>
        </View>
        <Text style={styles.progressText}>
          {profileProgress}% Profile Complete
        </Text>
      </View>

      {/* Essentials Section */}
      <InfoSection
        title="Essentials"
        data={[
          { label: "Height in cm:", value: `${height}` },
          { label: "Occupation:", value: occupation },
          { label: "Working At:", value: workingAt },
          {label : "Religion:", value: religion},
          { label: "Pronouns:", value: pronouns },
          { label: "Gender Orientation:", value: genderOrientation },
          { label: "Languages:", value: languages },
          { label: "Love Langauge:", value: loveLanguage },
        ]}
      />

      {/* The Basics Section */}
      <InfoSection
        title="Basics"
        data={[
          { label: "Zodiac:", value: zodiac },
          { label: "Family Planning:", value: familyPlanning },
          { label: "Body Type:", value: bodyType },
        ]}
      />

      {/* Upgrade Section */}
      <View style={styles.upgradeContainer}>
        <LinearGradient
          colors={["#5de383", "#00FFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.upgradeGradient}
        >
          <Text style={styles.upgradeTitle}>Kute-T</Text>
          <Text style={styles.upgradeDescription}>
            Unlock premium features, get 3x more matches, and boost your
            visibility!
          </Text>

          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            activeOpacity={0.95}
          >
            <Text style={styles.upgradeButtonText}>Become a Member</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Boost & Roses Section */}
      <View style={styles.cardsContainer}>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.card}
          onPress={() => navigation.navigate("BoostsAndLikes")}
        >
          <Image
            source={require("../assets/icons/popularity.png")}
            style={{ width: 29, height: 29 }}
          />
          <Text style={styles.cardTitle}>Boost</Text>
          <Text style={styles.cardText}>Increase your visibility by 11%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.card}
          onPress={() => navigation.navigate("BoostsAndLikes")}
        >
          <Image
            source={require("../assets/icons/super-like.png")}
            style={{ width: 29, height: 29 }}
          />
          <Text style={styles.cardTitle}>Super Likes</Text>
          <Text style={styles.cardText}>Send special likes to your crush!</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.card}
          onPress={() => navigation.navigate("Premium")}
        >
          <Icon name="unlock" size={24} color="pink" />
          <Text style={styles.cardTitle}>Unlock all features</Text>
          <Text style={styles.cardText}>Unlock all the premium features</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  profileImageContainer: {
    position: "relative",
    width: 150,
    height: 150,
    
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "white",
  },

  editIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#5de383",
    borderRadius: 15,
    padding: 7,
    elevation: 5,
  },

  verificationImage: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 38,
    height: 38,
  },
  

  username: {
    marginTop: 15,
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  bio: {
    fontSize: 14,
    color: "#B0B0B0",
    textAlign: "center",
    marginTop: 5,
  },
  upgradeContainer: {
    marginTop: 30,
    marginBottom: 30,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  upgradeGradient: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  upgradeTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
  },

  upgradeDescription: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
  },

  upgradeButton: {
    backgroundColor: "#121212",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  upgradeButtonText: {
    color: "#5de383",
    fontSize: 18,
    fontWeight: "bold",
  },

  cardsContainer: {
    marginTop: 30,
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    color: "white",
  },
  cardText: {
    fontSize: 14,
    color: "#B0B0B0",
    textAlign: "center",
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },

  progressContainer: {
    alignItems: "center",
    marginTop: 35,
    marginBottom: 35,
  },
  progressBackground: {
    height: 20,
    backgroundColor: "#1E1E1E",
    borderRadius: 15,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "white",
  },
  progressFill: {
    height: "100%",
    position: "relative",
    overflow: "visible",
  },
  gradient: {
    flex: 1,
  },
  arrowHead: {
    position: "absolute",
    right: -10,
    top: -2,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#5de383",
    transform: [{ rotate: "180deg" }],
  },
  progressText: {
    color: "#B0B0B0",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
  },
  label: {
    color: "#5de383",
    fontSize: 16,
    marginTop: 5,
  },

  sectionContainer: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#5de383",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 25,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  infoLabel: {
    color: "#B0B0B0",
    fontSize: 14,
  },
  infoValue: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  noInfo: {
    color: "#B0B0B0",
    fontStyle: "italic",
  },
  promptContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#1E1E1E",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#5de383",
  },
  promptQuestion: {
    color: "#5de383",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  promptAnswer: {
    color: "#FFF",
    fontSize: 14,
  },
});

export default ProfileScreen;
