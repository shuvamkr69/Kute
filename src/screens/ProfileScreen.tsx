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
import LoadingScreen from "./LoadingScreen";
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Animated as RNAnimated } from 'react-native';
const AnimatedLinearGradient = RNAnimated.createAnimatedComponent(LinearGradient);
const VerificationImage = require("../assets/icons/verified-logo.png");
const PremiumImage = require("../assets/icons/premium.png");

type Props = NativeStackScreenProps<any, "MyProfile">;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [profileProgress, setProfileProgress] = useState(0);
  const animatedProgress = useState(new Animated.Value(0))[0];
  const screenWidth = Dimensions.get("window").width;
  const progressBarWidth = screenWidth * 0.7; // Adjust width as needed
  const [superLikes, setSuperLikes] = useState(0);
  const [boosts, setBoosts] = useState(0);

  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(
    "https://www.shutterstock.com/image-photo/very-random-pose-asian-men-260nw-2423213779.jpg"
  );
  const [age, setAge] = useState<number | null>(null);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [ActivePremiumPlan, setActivePremium] = useState(null);
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
  const [personality, setPersonality] = useState<string>("Any");
  const [interests, setInterests] = useState<string[]>([]);

  const [boostActiveUntil, setBoostActiveUntil] = useState<Date | null>(null);
  const [boostTimer, setBoostTimer] = useState<string | null>(null);
  const [showFullLoveLanguage, setShowFullLoveLanguage] = useState(false);

  // Animated value for fog effect
  const fogAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fogAnim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: false,
        }),
        Animated.timing(fogAnim, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Interpolate colors for animated gradient
  const fogColors = fogAnim.interpolate ? [
    fogAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["#ff172e", "#de822c"]
    }),
    fogAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["#de822c", "#ffb347"]
    })
  ] : ["#ff172e", "#de822c"];

  // Animated value for fog overlay drift
  const fogDriftAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fogDriftAnim, {
          toValue: 1,
          duration: 12000,
          useNativeDriver: false,
        }),
        Animated.timing(fogDriftAnim, {
          toValue: 0,
          duration: 12000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Move fetchUser to before useEffect and useFocusEffect
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
      setActivePremium(user.ActivePremiumPlan || null);
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
      setPersonality(user.personality || "Any");
      setInterests(user.interests || []);
      setBoostActiveUntil(
        user.boostActiveUntil ? new Date(user.boostActiveUntil) : null
      );
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

  //boosts count
  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const response = await api.get("/api/v1/users/powerUps");
        setSuperLikes(response.data.superLike);
        setBoosts(response.data.boost);
      } catch (error) {
        console.error("Error fetching counters:", error);
      }
    };
    fetchCounters();
  }, []);

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
      setActivePremium(user.ActivePremiumPlan || null);
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
      setPersonality(user.personality || "Any");
      setInterests(
        user.interests?.flatMap((interest) =>
          typeof interest === "string"
            ? interest.split(",").map((i) => i.trim())
            : interest
        ) || []
      );
      setSuperLikes(response.data.superLike);
      setBoosts(response.data.boost);
      ToastAndroid.show("Profile Refreshed!", ToastAndroid.SHORT);
    } catch (error) {
      console.log("Refresh Error:", error);
      ToastAndroid.show("Failed to refresh profile", ToastAndroid.SHORT);
    } finally {
      setRefreshing(false);
    }
  };


  //getting profile of user's self profile
  useEffect(() => {
    fetchUser();
  }, []);

  // Dynamically reload profile when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUser();
    }, [])
  );

  //progress for the progrss bar



  //fetching profile progress information
  useEffect(() => {
    let progress = 0;
    if (
      profilePhoto !==
      "https://www.shutterstock.com/image-photo/very-random-pose-asian-men-260nw-2423213779.jpg"
    )
      progress += 7;
    if (name) progress += 7;
    if (bio) progress += 7;
    if (age) progress += 7;
    if (isVerified) progress += 6;
    if (workingAt) progress += 6;
    if (bodyType) progress += 6;
    if (height) progress += 6;
    if (zodiac) progress += 6;
    if (loveLanguage) progress += 6;
    if (genderOrientation) progress += 6;
    if (languages) progress += 6;
    if (occupation) progress += 6;
    if (pronouns) progress += 6;
    if (religion) progress += 6;
    if (familyPlanning) progress += 6;

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
    religion,
    familyPlanning,
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

  useEffect(() => {
    if (!boostActiveUntil) {
      setBoostTimer(null);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = boostActiveUntil.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(interval);
        setBoostTimer(null);
        setBoostActiveUntil(null);
        return;
      }

      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setBoostTimer(`${minutes}m ${seconds}s remaining`);
    }, 1000);

    return () => clearInterval(interval);
  }, [boostActiveUntil]);

  const handleActivateBoost = async () => {
    try {
      const response = await api.post("/api/v1/users/activateBoost");
      const boostUntil = new Date(response.data.data.boostActiveUntil);
      setBoostActiveUntil(boostUntil);
      ToastAndroid.show("Boost Activated for 30 minutes!", ToastAndroid.SHORT);
    } catch (error) {
      Alert.alert("Boost Error", error.response.data.message || "Something went wrong");
      console.error("Activate Boost Error:", error);
    }
  };

  const InfoSection = ({
    title,
    data,
    renderValue,
  }: {
    title: string;
    data: { label: string; value: string }[];
    renderValue?: (label: string, value: string) => React.ReactNode;
  }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length > 0 ? (
        data.map((item, index) => {
          // Map label to Ionicon name (only valid names)
          let iconName = '';
          switch (item.label) {
            case 'Height in cm:':
              iconName = 'resize-outline';
              break;
            case 'Occupation:':
              iconName = 'briefcase-outline';
              break;
            case 'Working At:':
              iconName = 'briefcase-outline'; // No business-outline, use briefcase
              break;
            case 'Religion:':
              iconName = 'leaf-outline';
              break;
            case 'Pronouns:':
              iconName = 'person-outline';
              break;
            case 'Gender Orientation:':
              iconName = 'male-female-outline';
              break;
            case 'Languages:':
              iconName = 'globe-outline'; // Use globe-outline for languages
              break;
            case 'Love Langauge:':
              iconName = 'heart-outline';
              break;
            case 'Zodiac:':
              iconName = 'star-outline';
              break;
            case 'Family Planning:':
              iconName = 'people-outline'; // Use people-outline for family planning
              break;
            case 'Body Type:':
              iconName = 'people-outline'; // Use people-outline for body type
              break;
            case 'Personality':
              iconName = 'happy-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }
          return (
            <View key={index} style={styles.infoRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={iconName as any} size={18} color="#de822c" />
                <Text style={[styles.infoLabel, { marginLeft: 7, paddingLeft: 0 }]}>{item.label}</Text>
              </View>
              {renderValue ? renderValue(item.label, item.value) : <Text style={styles.infoValue}>{item.value}</Text>}
            </View>
          );
        })
      ) : (
        <Text style={styles.noInfo}>No information added</Text>
      )}
    </View>
  );

  if (loading) {
    // use your custom container *or* the dedicated LoadingScreen
    return <LoadingScreen description="Fetching your Profile" />;
    // (If you prefer the plain container, keep the same JSX you deleted.)
  }

  // 1. Add mock offers for preview (replace with API if needed)
  const superLikeOffers = [
    { id: 'sl1', name: '5 Super Likes', price: '$2.99' },
    { id: 'sl2', name: '15 Super Likes', price: '$6.99' },
    { id: 'sl3', name: '30 Super Likes', price: '$12.99' },
  ];
  const boostOffers = [
    { id: 'b1', name: '1 Boost', price: '$1.99' },
    { id: 'b2', name: '5 Boosts', price: '$7.99' },
    { id: 'b3', name: '10 Boosts', price: '$14.99' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#de822c"]}
        />
      }
    >
      {/* Profile Section */}
      <View style={styles.profileContainer}>
        <View style={styles.profileImageContainer}>
          {/* Gradient Border Wrapper */}
          <LinearGradient
            colors={["#de822c", "#ff172e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            {/* Profile Image with inner container to create border effect */}
            <View style={styles.profileImageInner}>
              <Image
                source={{ uri: profilePhoto }}
                style={styles.profileImage}
              />
            </View>
          </LinearGradient>

          {/* Edit Icon (keep your existing one) */}
          {/* Gradient Edit Icon */}
          <LinearGradient
            colors={["#de822c", "#ff172e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.editIconGradient}
          >
            <TouchableOpacity
              style={styles.editIconButton}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <Icon name="pencil" size={14} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <Text style={styles.username}>
          {name} {age}
          {/* Verification Image - Replaces the Verification Icon */}
          <Image
            source={VerificationImage}
            style={[
              styles.verificationImage,
              {
                tintColor: isVerified ? null : "#B0B0B0",
                opacity: isVerified ? 1 : 0.5,
              },
            ]}
          />
        </Text>

        <Text style={styles.bio}>{bio}</Text>
      </View>

      {/* Premium Image - Replaces the Premium Icon */}
      <Image
        source={PremiumImage}
        style={[
          styles.premiumImage,
          {
            tintColor: ActivePremiumPlan && ActivePremiumPlan !== 'null' && ActivePremiumPlan !== '' ? null : '#B0B0B0',
            opacity: ActivePremiumPlan && ActivePremiumPlan !== 'null' && ActivePremiumPlan !== '' ? 1 : 0.5,
          },
        ]}
      />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground, { width: progressBarWidth }]}>
          <Animated.View
            style={[styles.progressFill, { width: animatedProgress }]}
          >
            <LinearGradient
              colors={["#de822c", "#ff172e"]}
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
          { label: "Religion:", value: religion },
          { label: "Pronouns:", value: pronouns },
          { label: "Gender Orientation:", value: genderOrientation },
          { label: "Languages:", value: languages },
          { label: "Love Langauge:", value: loveLanguage },
        ]}
        renderValue={(label, value) => <Text style={styles.infoValue}>{value}</Text>}
      />

      {/* The Basics Section */}
      <InfoSection
        title="Basics"
        data={[
          { label: "Zodiac:", value: zodiac },
          { label: "Family Planning:", value: familyPlanning },
          { label: "Body Type:", value: bodyType },
          { label: "Personality", value: personality },
        ]}
      />

      {/* Interests Section - Special Handling */}

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Interests</Text>
        {interests.length > 0 ? (
          <View style={styles.interestsContainer}>
            {interests.map((interest, index) => (
              <LinearGradient
                key={index}
                colors={["#FFA500", "#FF4500"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.interestBox}
              >
                <Text style={styles.interestText}>{interest}</Text>
              </LinearGradient>
            ))}
          </View>
        ) : (
          <Text style={styles.noInfo}>No interests added</Text>
        )}
      </View>

      {/* Kute App Goal Card */}
      <View style={styles.goalCardContainer}>
        <View style={styles.goalCardGradient}>
          <LinearGradient
            colors={["#ff172e", "#de822c", "#ffb347"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Animated fog overlay */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: fogDriftAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.18, 0.32, 0.18]
                }),
                transform: [
                  {
                    translateX: fogDriftAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 60] // drift right
                    })
                  }
                ],
                backgroundColor: 'rgba(255,255,255,0.22)',
                borderRadius: 22,
              }
            ]}
          />
          <View style={{ alignItems: 'center', marginBottom: 10, zIndex: 1 }}>
            <Ionicons name="heart-circle" size={44} color="#fff" style={{ marginBottom: 6 }} />
            <Text style={styles.goalCardTitle}>Our Mission</Text>
          </View>
          <Text style={[styles.goalCardText, { zIndex: 1 }]}>
            Welcome to Kute! Here, dating is about real connections, good vibes, and a little bit of magic. Whether you're searching for your soulmate, a new best friend, or just someone to share memes with, Kute is your safe, friendly space to be yourself and meet awesome people. Let's make every swipe a story worth telling.
          </Text>
        </View>
      </View>

      {/* Boosts Counter */}

      {/* Boost & Roses Section */}
      <View style={styles.cardsContainer}>
        {/* Boost Card */}
        <LinearGradient
          colors={["#232526", "#414345"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featureCard}
        >
          <View style={styles.featureCardHeader}>
            <Image
              source={require("../assets/icons/popularity.png")}
              style={styles.featureIcon}
            />
            <Text style={styles.featureTitle}>Boost</Text>
          </View>
          <Text style={styles.featureDescription}>Increase your visibility by 3x and get more matches.</Text>
          <View style={styles.featureFooter}>
            <View style={styles.featureCounterBox}><Text style={styles.featureCounterText}>x{boosts}</Text></View>
            <TouchableOpacity onPress={handleActivateBoost} style={[styles.featureButton, { minWidth: 80 }]}>
              <LinearGradient
                colors={["#de822c", "#ff172e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.featureButtonGradient, { paddingVertical: 6, paddingHorizontal: 16 }]}
              >
                <Text style={[styles.featureButtonText, { fontSize: 13 }]}>Activate Now</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('BuyFeatures', { initialTab: 'boosts' })} style={[styles.featureButton, { minWidth: 80 }]}>
              <LinearGradient
                colors={["#de822c", "#ff172e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.featureButtonGradient, { paddingVertical: 6, paddingHorizontal: 16 }]}
              >
                <Text style={[styles.featureButtonText, { fontSize: 13 }]}>Buy Boosts</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {boostTimer && (
            <Text style={styles.featureTimer}>{boostTimer}</Text>
          )}
        </LinearGradient>

        {/* Super Likes Card */}
        <LinearGradient
          colors={["#232526", "#414345"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featureCard}
        >
          <View style={styles.featureCardHeader}>
            <Image
              source={require("../assets/icons/super-like.png")}
              style={styles.featureIcon}
            />
            <Text style={styles.featureTitle}>Super Likes</Text>
          </View>
          <Text style={styles.featureDescription}>Send special likes to your crush and stand out!</Text>
          <View style={styles.featureFooter}>
            <View style={styles.featureCounterBox}><Text style={styles.featureCounterText}>x{superLikes}</Text></View>
            <TouchableOpacity onPress={() => navigation.navigate('BuyFeatures', { initialTab: 'superlikes' })} style={[styles.featureButton, { minWidth: 80 }]}>
              <LinearGradient
                colors={["#de822c", "#ff172e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.featureButtonGradient, { paddingVertical: 6, paddingHorizontal: 16 }]}
              >
                <Text style={[styles.featureButtonText, { fontSize: 13 }]}>Buy Super Likes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Unlock All Features Card (Premium) at the end */}
      <LinearGradient
        colors={["#fffbe6", "#ffe0b2", "#ffd700"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.featureCard, styles.premiumFeatureCard, { marginBottom: 22, marginTop: 0 }]}
      >
        <View style={styles.featureCardHeader}>
          <Icon name="unlock" size={32} color="#de822c" style={{ marginRight: 12 }} />
          <Text style={[styles.featureTitle, styles.premiumFeatureTitle]}>Unlock All Features</Text>
        </View>
        <Text style={[styles.featureDescription, styles.premiumFeatureDescription]}>Unlock all premium features and maximize your Kute experience.</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Premium")}
          style={styles.featureButton}
        >
          <LinearGradient
            colors={["#de822c", "#ff172e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureButtonGradient}
          >
            <Text style={styles.featureButtonText}>Become Premium</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 20,
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  profileImageContainer: {
    position: "relative",
    width: 210, // Slightly larger to accommodate border
    height: 210,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientBorder: {
    width: "100%",
    height: "100%",
    borderRadius: 105, // Half of width/height to make it circular
    padding: 5, // This creates the border thickness
  },
  profileImageInner: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
    overflow: "hidden", // Ensures the image stays within the rounded bounds
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  // Keep your existing editIcon style

  editIconGradient: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 15,
    padding: 2, // This creates the border effect
  },
  editIconButton: {
    backgroundColor: "black", // Inner color
    borderRadius: 13, // Slightly smaller than the gradient container
    padding: 7,
    justifyContent: "center",
    alignItems: "center",
  },

  verificationImage: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    marginLeft: 10,
  },
  premiumImage: {
    alignSelf: "center",
    width: 38,
    height: 38,
    marginTop: 30,
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
    backgroundColor: "black",
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
    color: "white",
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
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    justifyContent: "center",
  },
  interestBox: {
    backgroundColor: "#de822c",
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
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
    borderBottomColor: "#de822c",
    transform: [{ rotate: "180deg" }],
  },
  progressText: {
    color: "#B0B0B0",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
  },
  label: {
    color: "#de822c",
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
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: 'center',
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
    borderColor: "#de822c",
  },
  promptQuestion: {
    color: "#de822c",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  promptAnswer: {
    color: "#FFF",
    fontSize: 14,
  },
  counterIcon: {
    width: 18,
    height: 18,
  },

  counterContainer: {
    flexDirection: "row",
    borderRadius: 15,
  },
  counterText: {
    color: "white",
    marginLeft: 2,
    fontWeight: "bold",
    fontSize: 20,
    paddingHorizontal: 1,
    paddingTop: 15,
    paddingBottom: 10,
  },
  activateNowButton: {
    backgroundColor: "#de822c",
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  activateNowButtonText: {
    color: "white",
  },
  featureCard: {
    borderRadius: 18,
    marginBottom: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: 'transparent',
  },
  featureCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    width: 38,
    height: 38,
    marginRight: 14,
    backgroundColor: 'transparent',
    padding: 4,
    resizeMode: 'contain',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  featureDescription: {
    color: '#B0B0B0',
    fontSize: 15,
    marginBottom: 16,
    marginLeft: 2,
    marginRight: 2,
  },
  featureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  featureCounterBox: {
    backgroundColor: '#23262F',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginRight: 10,
  },
  featureCounterText: {
    color: '#de822c',
    fontWeight: 'bold',
    fontSize: 18,
  },
  featureButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  featureButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  featureTimer: {
    color: '#de822c',
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  premiumFeatureCard: {
    borderWidth: 2,
    borderColor: '#ffd700',
    backgroundColor: 'rgba(255, 223, 0, 0.08)',
  },
  premiumFeatureTitle: {
    color: '#de822c',
  },
  premiumFeatureDescription: {
    color: '#b8860b',
    fontWeight: '500',
  },
  featureList: {
    marginTop: 18,
    marginBottom: 6,
  },
  featureListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.10)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  featureListText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  goalCardContainer: {
    marginBottom: 28,
    marginTop: 0,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  goalCardGradient: {
    padding: 28,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCardTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  goalCardText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
});

export default ProfileScreen;
