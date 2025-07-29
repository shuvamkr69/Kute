import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  Dimensions,
  Button,
  TextInput,
  Share,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { Easing } from 'react-native-reanimated';
import { getUserId } from "../utils/constants";
import { triggerMatchVibration } from "../utils/notifications";
import CustomAlert from "../components/CustomAlert";

const VerificationImage = require("../assets/icons/verified-logo.png");

import { formatDistance } from "../utils/locationUtils";

const screenHeight = Dimensions.get("window").height;
const topBarHeight = 55; // Your top bar height
const bottomTabHeight = Platform.OS === "ios" ? 70 : 55; // Your bottom tab height
const availableHeight = screenHeight - topBarHeight - bottomTabHeight;

type SwipeFeedbackType = "like" | "reject" | "superLike";

type Props = NativeStackScreenProps<any, "Home">;

interface SwipeFeedback {
  visible: boolean;
  type: SwipeFeedbackType | null;
}

interface Profile {
  _id: string;
  fullName: string;
  age: number;
  gender: string;
  location: string;
  interests: string;
  relationshipType: string;
  bio: string;
  images: string[];
  distance: number | null;
  isBoosted?: boolean; // Add boost status
  drinking: boolean;
  smoking: string;
  workout: string;
  familyPlanning: string;
  verifiedUser: string;
  zodiac: string;
}

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DAILY_FREE_LIKES = 15;
const PREMIUM_LIKE_LIMITS: Record<string, number> = {
  gold: 1000,
  platinum: 10000,
  plus: 100,
};

const getTodayKey = () => {
  const now = new Date();
  return `likes_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;
};

const getResetTime = () => {
  const now = new Date();
  const reset = new Date(now);
  reset.setHours(24, 0, 0, 0); // midnight
  return reset.getTime();
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [dotAnimation] = useState(new Animated.Value(0));
  const [distance, setDistance] = useState<number | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isSuperLikeSwipe, setIsSuperLikeSwipe] = useState(false);
  const [dailyLikes, setDailyLikes] = useState(0);
  const [likeLimit, setLikeLimit] = useState(DAILY_FREE_LIKES);
  const [premiumPlan, setPremiumPlan] = useState<string | null>(null);
  const [swiperKey, setSwiperKey] = useState(0);

  const swipeX = useRef(new Animated.Value(0)).current;
  const swipeY = useRef(new Animated.Value(0)).current; // Add this line
  const screenWidth = Dimensions.get("window").width;
  const SWIPE_THRESHOLD = screenWidth * 0.7;
  const SWIPE_VERTICAL_THRESHOLD = 150; // Adjust this value (higher = needs more extreme swipe)

  const [isModalAnimated, setIsModalAnimated] = useState(false);
  const modalAnimatedValue = new Animated.Value(0);

  const modalSlideOut = () => {
    Animated.timing(modalAnimatedValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsModalAnimated(false));
  };

  let borderColor: string | Animated.AnimatedInterpolation<any>;
  let borderWidth: number | Animated.AnimatedInterpolation<any>;
  if (isSuperLikeSwipe) {
    borderColor = "#00B4FF";
    borderWidth = 5;
  } else {
    borderColor = swipeX.interpolate({
      inputRange: [
        -SWIPE_THRESHOLD,
        -SWIPE_THRESHOLD * 0.2,
        0,
        SWIPE_THRESHOLD * 0.2,
        SWIPE_THRESHOLD
      ],
      outputRange: [
        "#FF0000",
        "transparent",
        "transparent",
        "transparent",
        "#00FF00"
      ],
      extrapolate: "clamp",
    });
    borderWidth = swipeX.interpolate({
      inputRange: [
        -SWIPE_THRESHOLD,
        -SWIPE_THRESHOLD * 0.2,
        0,
        SWIPE_THRESHOLD * 0.2,
        SWIPE_THRESHOLD
      ],
      outputRange: [5, 0, 0, 0, 5],
      extrapolate: "clamp",
    });
  }

  const [swipeFeedback, setSwipeFeedback] = useState<{
    visible: boolean;
    type: "like" | "reject" | "superLike" | null;
  }>({ visible: false, type: null });

  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const renderFeedbackSticker = () => {
    if (!swipeFeedback.visible || !swipeFeedback.type) return null;

    let stickerSource;
    switch (swipeFeedback.type) {
      case "like":
        stickerSource = require("../assets/icons/like-user.png");
        break;
      case "reject":
        stickerSource = require("../assets/icons/rejected-user.png");
        break;
      case "superLike":
        stickerSource = require("../assets/icons/super-like.png"); // Add your Super Like image
        break;
      default:
        return null;
    }

    return (
      <Animated.View
        style={[
          styles.feedbackContainer,
          {
            transform: [
              {
                translateY: feedbackAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
            opacity: feedbackAnim,
          },
        ]}
      >
        <Image source={stickerSource} style={styles.feedbackSticker} />
      </Animated.View>
    );
  };

  const fetchProfiles = async () => {
    try {
      const response = await api.get("/api/v1/users/");
      const formattedProfiles = response.data.map((profile: any) => {
        // Defensive: ensure images is always an array
        let images = Array.isArray(profile.images) && profile.images.length > 0
          ? profile.images.slice(0, 6)
          : [
              "https://via.placeholder.com/400x600/AAAAAA/FFFFFF?text=No+Image",
            ];
        return {
          _id: profile._id,
          fullName: profile.name,
          age: profile.age,
          relationshipType: profile.relationshipType,
          bio: profile.bio || "No bio available.",
          images,
          gender: profile.gender,
          location: profile.location,
          interests: Array.isArray(profile.interests)
            ? profile.interests.join(", ")
            : profile.interests || "No interests listed",
          distance: profile.distance, // Use backend-calculated distance
          isBoosted: profile.isBoosted, // Include boost status from backend
          occupation: profile.occupation,
          workingAt: profile.workingAt,
          pronouns: profile.pronouns,
          genderOrientation: profile.genderOrientation,
          languages: profile.languages,
          loveLanguage: profile.loveLanguage,
          zodiac: profile.zodiac,
          familyPlanning: profile.familyPlanning,
          bodyType: profile.bodyType,
          drinking: profile.drinking,
          smoking: profile.smoking,
          workout: profile.workout,
          verifiedUser: profile.isVerified,
          ActivePremiumPlan: profile.ActivePremiumPlan,
        };
      });
      // ✅ Profiles are already sorted by backend in ascending distance order:
      // 1. Boosted users within 500km (closest first)
      // 2. All other users sorted by distance (1km, 1.6km, 2km, etc.)
      console.log('Received profiles in distance order:', formattedProfiles.slice(0, 3).map(p => `${p.fullName}: ${p.distance?.toFixed(1) || 'unknown'} km`));
      setProfiles(formattedProfiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    const loadLikes = async () => {
      const userString = await AsyncStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : {};
      const plan = user.ActivePremiumPlan || null;
      setPremiumPlan(plan);
      let limit = DAILY_FREE_LIKES;
      if (plan && PREMIUM_LIKE_LIMITS[plan]) limit = PREMIUM_LIKE_LIMITS[plan];
      setLikeLimit(limit);
      const todayKey = getTodayKey();
      const storedLikes = await AsyncStorage.getItem(todayKey);
      setDailyLikes(storedLikes ? parseInt(storedLikes, 10) : 0);
      // Set/reset timer for midnight reset
      const resetTime = getResetTime();
      const now = Date.now();
      setTimeout(() => {
        AsyncStorage.setItem(todayKey, '0');
        setDailyLikes(0);
      }, resetTime - now);
    };
    loadLikes();
  }, []);

  const incrementLikes = async () => {
    const todayKey = getTodayKey();
    const newLikes = dailyLikes + 1;
    setDailyLikes(newLikes);
    await AsyncStorage.setItem(todayKey, newLikes.toString());
  };

  const showPremiumModal = () => {
    // Animate and navigate to Premium screen
    Animated.timing(modalAnimatedValue, {
      toValue: 1,
      duration: 500,
      easing: Easing.bounce,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate("Premium", { from: "likesLimit" });
      setTimeout(() => {
        modalAnimatedValue.setValue(0);
      }, 500);
    });
    setCustomAlert({ visible: true, title: "Out of Likes!", message: "You've reached your daily free likes. Get unlimited likes with Premium!" });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfiles();
    setRefreshing(false);
  }, []);

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % selectedProfile!.images.length;
      Animated.timing(dotAnimation, {
        toValue: nextIndex,
        duration: 300, // Adjust for smoothness
        useNativeDriver: false,
      }).start();
      return nextIndex;
    });
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => {
      const prevIndexUpdated =
        prevIndex === 0 ? selectedProfile!.images.length - 1 : prevIndex - 1;
      Animated.timing(dotAnimation, {
        toValue: prevIndexUpdated,
        duration: 300, // Adjust for smoothness
        useNativeDriver: false,
      }).start();
      return prevIndexUpdated;
    });
  };

  const handleBlockUser = async (blockedUserId: string) => {
    try {
      await api.post("/api/v1/users/block", { blockedUserId });
      setProfiles((prev) => prev.filter((p) => p._id !== blockedUserId));
      setCustomAlert({ visible: true, title: "User Blocked", message: "This user has been blocked and removed from suggestions." });
    } catch (error) {
      console.error("Error blocking user:", error);
      setCustomAlert({ visible: true, title: "Error", message: "Failed to block user." });
    }
  };

  const userLiked = async (index: number) => {
    if (index >= profiles.length) return;
    if (dailyLikes >= likeLimit) {
      showPremiumModal();
      setSwiperKey((k) => k + 1);
      return;
    }
    await incrementLikes();
    const likedUserId = profiles[index]._id;
    try {
      const response = await api.post(
        "/api/v1/users/userLiked",
        { likedUserId },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.data?.data?.matched === true) {
        const matchedUser = response.data.data.matchedUser;
        const userString = await AsyncStorage.getItem("user");
        const user = userString ? JSON.parse(userString) : {};
        const avatar = await AsyncStorage.getItem("avatar");
        const currentUser = {
          fullName: user.fullName,
          image: avatar,
        };
        
        // 🎉 Trigger vibration for successful match
        triggerMatchVibration();
        console.log("🎉 Match detected in userLiked - vibrating!");
        
        navigation.navigate("MatchScreen", {
          user: currentUser,
          matchedUser: {
            fullName: matchedUser.fullName,
            image: matchedUser.image,
          },
        });
      }
      // Do NOT remove the profile here
    } catch (error) {
      console.error(
        "Error liking user:",
        error.response?.data || error.message
      );
    }
  };

  const handleSuperLike = async (index: number) => {
    if (index >= profiles.length) return;
    if (dailyLikes >= likeLimit) {
      showPremiumModal();
      return;
    }
    const superLikedUserId = profiles[index]._id;
    try {
      const response = await api.post(
        "/api/v1/users/userSuperLiked",
        { likedUserId: superLikedUserId },
        { headers: { "Content-Type": "application/json" } }
      );
      setSwipeFeedback({
        visible: true,
        type: "superLike",
      });
      Animated.spring(feedbackAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.spring(feedbackAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start(() => {
            setSwipeFeedback({ visible: false, type: null });
          });
        }, 1000);
      });
      // Do NOT remove the profile here
      if (response.data?.data?.matched === true) {
        const matchedUser = response.data.data.matchedUser;
        const userString = await AsyncStorage.getItem("user");
        const user = userString ? JSON.parse(userString) : {};
        const avatar = await AsyncStorage.getItem("avatar");
        const currentUser = {
          fullName: user.fullName,
          image: avatar,
        };
        
        // 🎉 Trigger vibration for successful super like match
        triggerMatchVibration();
        console.log("🎉 Match detected in handleSuperLike - vibrating!");
        
        navigation.navigate("MatchScreen", {
          user: currentUser,
          matchedUser: {
            fullName: matchedUser.fullName,
            image: matchedUser.image,
          },
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      if (message === "No Super Likes remaining") {
        setCustomAlert({ visible: true, title: "You're out of Super Likes", message: "Come back later or get more!" });
      } else {
        console.error("Super Like error:", message);
      }
    }
  };

  const userPassed = (index: number) => {
    // console.log("User passed:", profiles[index]?._id);
  };

  const haversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    // console.log("Calculating distance between:", lat1, lon1, lat2, lon2);
    const toRad = (value: number) => (value * Math.PI) / 180;

    const R = 6371; // Earth's radius in KM
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // console.log("Haversine calculation:", R * c);
    return R * c; // Distance in kilometers
    setDistance(R * c); // Distance in kilometers
  };

  useEffect(() => {
    haversineDistance;
  }, []);

  const [menuVisible, setMenuVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });

  const handleShareProfile = async () => {
    if (!selectedProfile) return;
    try {
      const profileLink = `https://kuteapp.com/profile/${selectedProfile._id}`; // Replace with your actual profile URL pattern
      const message = `🌟 Hey! Check out this amazing Kute profile! 🌟\n\n` +
        `👤 Name: ${selectedProfile.fullName}\n` +
        `🎂 Age: ${selectedProfile.age}\n` +
        `⚧️ Gender: ${selectedProfile.gender}\n` +
        `💬 Bio: ${selectedProfile.bio}\n` +
        `🔥 Interests: ${selectedProfile.interests}\n\n` +
        `👉 View their profile here: ${profileLink}\n` +
        `\nJoin me on Kute and discover awesome people! 🚀`;
      await Share.share({
        message,
      });
    } catch (error) {
      setCustomAlert({ visible: true, title: "Error", message: error.message || "Failed to share profile." });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#de822c"]}
        />
      }
    >
      <View style={styles.container}>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: availableHeight }}>
          <ActivityIndicator size="large" color="#de822c" />
        </View>
      ) : profiles.length > 0 ? (
        <View style={styles.swiperContainer}>
          <Swiper
            key={swiperKey}
            verticalSwipe={true}
            verticalThreshold={150} // or your preferred threshold
            disableBottomSwipe={true}
            onSwiping={(x, y) => {
              swipeX.setValue(x);
              swipeY.setValue(y);
              setIsSuperLikeSwipe(y < -SWIPE_VERTICAL_THRESHOLD * 0.8);

              const isNowSuperLikeSwipe = y < -SWIPE_VERTICAL_THRESHOLD * 0.8;
              if (isNowSuperLikeSwipe !== isSuperLikeSwipe) {
                setIsSuperLikeSwipe(isNowSuperLikeSwipe);
              }

              // Detect upward swipe for Super Like (adjust -50 threshold as needed)
              if (y < -SWIPE_VERTICAL_THRESHOLD) {
                if (
                  !swipeFeedback.visible ||
                  swipeFeedback.type !== "superLike"
                ) {
                  setSwipeFeedback({ visible: true, type: "superLike" });
                  Animated.spring(feedbackAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                  }).start();
                }
              }
              // Right swipe (Like)
              else if (x > SWIPE_THRESHOLD * 0.8) {
                if (!swipeFeedback.visible || swipeFeedback.type !== "like") {
                  setSwipeFeedback({ visible: true, type: "like" });
                  Animated.spring(feedbackAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                  }).start();
                }
              }
              // Left swipe (Reject)
              else if (x < -SWIPE_THRESHOLD * 0.8) {
                if (!swipeFeedback.visible || swipeFeedback.type !== "reject") {
                  setSwipeFeedback({ visible: true, type: "reject" });
                  Animated.spring(feedbackAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                  }).start();
                }
              }
              // Hide feedback when card returns near center
              else {
                if (
                  swipeFeedback.visible &&
                  Math.abs(x) < SWIPE_THRESHOLD * 0.5 &&
                  y > -SWIPE_VERTICAL_THRESHOLD * 0.5
                ) {
                  // Added vertical check
                  Animated.spring(feedbackAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                  }).start(() => {
                    setSwipeFeedback({ visible: false, type: null });
                  });
                }
              }
            }}
            onSwiped={(index) => {
              // Always remove the first card and force Swiper to re-render
              setProfiles((prev) => prev.slice(1));
              setSwiperKey((k) => k + 1);
              Animated.spring(feedbackAnim, {
                toValue: 0,
                useNativeDriver: true,
              }).start(() => {
                setSwipeFeedback({ visible: false, type: null });
              });
            }}
            cards={profiles}
            renderCard={(profile, index) => {
              if (!profile) return null;
              const isTopCard = index === currentCardIndex;
              // Defensive: ensure images is always an array
              const images = Array.isArray(profile.images) && profile.images.length > 0
                ? profile.images
                : ["https://via.placeholder.com/400x600/AAAAAA/FFFFFF?text=No+Image"];
              return (
                <View style={styles.card} key={profile._id}>
                  <TouchableOpacity
                    onPress={async () => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                      setSelectedProfile(profile);
                      setCurrentImageIndex(0);
                      // Record profile view if not self
                      const myId = await getUserId();
                      if (profile._id !== myId) {
                        api.post('/api/v1/users/profileViewed', { userId: profile._id }).catch(() => {});
                      }
                    }}
                    activeOpacity={1}
                  >
                    <View>
                      <Animated.View
                        style={[
                          styles.profileImageWrapper,
                          isTopCard && {
                            borderColor: isSuperLikeSwipe
                              ? "#00B4FF"
                              : borderColor,
                            borderWidth: isSuperLikeSwipe ? 5 : borderWidth,
                          },
                        ]}
                      >
                        <Image
                          source={{
                            uri:
                              images[0] ||
                              "https://via.placeholder.com/400x600/AAAAAA/FFFFFF?text=No+Image",
                          }}
                          style={styles.profileImage}
                        />
                      </Animated.View>
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,1)"]}
                        style={styles.gradientOverlay}
                      />
                    </View>
                  </TouchableOpacity>
                  <View style={styles.detailsContainer}>
                    <View style={styles.nameContainer}>
                      <Text style={styles.name}>
                        {profile.fullName?.split(" ")[0] || "User"}{" "}
                        {profile.age}
                      </Text>
                      <View style={styles.badgeContainer}>
                        {profile.verifiedUser && (
                          <Image
                            source={VerificationImage}
                            style={[
                              styles.verificationImage,
                              {
                                tintColor: profile.verifiedUser
                                  ? null
                                  : "#B0B0B0",
                                opacity: profile.verifiedUser ? 1 : 0.5,
                              },
                            ]}
                          />
                        )}
                        {profile.isBoosted && (
                          <View style={styles.boostBadge}>
                            <Ionicons name="flash" size={14} color="#FFD700" />
                            <Text style={styles.boostBadgeText}>BOOST</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.relationship}>
                      {profile.relationshipType || ""}
                    </Text>
                    <Text style={styles.modalLocation}>
                      <Text style={styles.distance}>
                        {formatDistance(profile.distance)}
                      </Text>
                    </Text>
                    <Text style={styles.name}>{""}</Text>
                  </View>
                </View>
              );
            }}
            onSwipedTop={(index) => handleSuperLike(index)}
            onSwipedRight={(index) => userLiked(index)}
            onSwipedLeft={(index) => userPassed(index)}
            onSwipedBottom={() => setSwiperKey((k) => k + 1)}
            // cardIndex={currentCardIndex}
            backgroundColor="transparent"
            stackSize={3}
            stackAnimationTension={80}
            stackAnimationFriction={10}
            containerStyle={styles.swiper}
            cardStyle={{ backgroundColor: "transparent" }}
            overlayLabels={{
              left: {
                title: "NOPE",
                style: {
                  label: {
                    backgroundColor: "red",
                    borderColor: "red",
                    color: "white",
                    borderWidth: 1,
                  },
                  wrapper: {
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "flex-start",
                    marginTop: 30,
                    marginLeft: -30,
                  },
                },
              },
              right: {
                title: "LIKE",
                style: {
                  label: {
                    backgroundColor: "green",
                    borderColor: "green",
                    color: "white",
                    borderWidth: 1,
                  },
                  wrapper: {
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    marginTop: 30,
                    marginLeft: 30,
                  },
                },
              },
            }}
          />
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: availableHeight }}>
          <Image
            source={require('../assets/icons/surprised.png')}
            style={{ width: 150, height: 150, marginBottom: 20 }}
          />
          <Text style={styles.noProfilesCentered}>No more profiles.</Text>
          <Text style={styles.noProfilesCentered}>Try changing your preferences.</Text>
        </View>
      )}

      {renderFeedbackSticker()}

      {/* Profile Modal */}
      <Modal
        visible={!!selectedProfile}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          modalSlideOut();
          setSelectedProfile(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedProfile && (
              <>
                {/* Custom Header */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity 
                    style={styles.modalBackButton} 
                    onPress={() => setSelectedProfile(null)}
                  >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.modalHeaderTitle}>Profile</Text>
                  <TouchableOpacity 
                    style={styles.modalMenuButton}
                    onPress={() => setMenuVisible(true)}
                  >
                    <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.modalScrollContainer} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  {/* Image Carousel */}
                  <View style={styles.modalImageContainer}>
                    {Array.isArray(selectedProfile.images) && selectedProfile.images.length > 0 ? (
                      <>
                        <ScrollView
                          horizontal
                          pagingEnabled
                          showsHorizontalScrollIndicator={false}
                          onScroll={(event) => {
                            const scrollPosition = event.nativeEvent.contentOffset.x;
                            const index = Math.round(scrollPosition / screenWidth);
                            setCurrentImageIndex(index);
                          }}
                          scrollEventThrottle={16}
                        >
                          {selectedProfile.images.map((imageUrl, index) => (
                            <View key={index} style={styles.modalImageWrapper}>
                              <Animated.Image
                                source={{ uri: imageUrl }}
                                style={[styles.modalProfileImage, { opacity: fadeAnim }]}
                                resizeMode="cover"
                              />
                            </View>
                          ))}
                        </ScrollView>
                        
                        {/* Image Indicators */}
                        {selectedProfile.images.length > 1 && (
                          <View style={styles.modalImageIndicators}>
                            {selectedProfile.images.map((_, index) => (
                              <View
                                key={index}
                                style={[
                                  styles.modalIndicator,
                                  currentImageIndex === index && styles.modalActiveIndicator,
                                ]}
                              />
                            ))}
                          </View>
                        )}
                      </>
                    ) : (
                      <View style={styles.modalNoImageContainer}>
                        <Ionicons name="person-circle" size={120} color="#666" />
                        <Text style={styles.modalNoImageText}>No photos available</Text>
                      </View>
                    )}

                    {/* Gradient Overlay */}
                    <LinearGradient
                      colors={["transparent", "rgba(15,15,15,0.8)"]}
                      style={styles.modalGradientOverlay}
                    />
                  </View>

                  {/* Profile Content */}
                  <View style={styles.modalContentContainer}>
                    {/* Name and Age */}
                    <View style={styles.modalNameSection}>
                      <Text style={styles.modalNameText}>
                        {selectedProfile.fullName?.split(" ")[0] || "User"}
                      </Text>
                      <View style={styles.modalAgeContainer}>
                        <Text style={styles.modalAgeText}>{selectedProfile.age}</Text>
                      </View>
                    </View>

                    {/* Boost Indicator */}
                    {selectedProfile.isBoosted && (
                      <View style={styles.modalBoostIndicator}>
                        <Ionicons name="flash" size={16} color="#FFD700" />
                        <Text style={styles.modalBoostText}>This profile is boosted</Text>
                      </View>
                    )}

                    {/* Gender and Relationship */}
                    <View style={styles.modalInfoRow}>
                      {selectedProfile.gender && (
                        <View style={styles.modalInfoTag}>
                          <Ionicons name="person" size={16} color="#FF8A00" />
                          <Text style={styles.modalInfoTagText}>{selectedProfile.gender}</Text>
                        </View>
                      )}
                      {selectedProfile.relationshipType && (
                        <View style={styles.modalInfoTag}>
                          <Ionicons name="heart" size={16} color="#FF8A00" />
                          <Text style={styles.modalInfoTagText}>{selectedProfile.relationshipType}</Text>
                        </View>
                      )}
                    </View>

                    {/* Distance */}
                    <View style={styles.modalDistanceContainer}>
                      <Ionicons name="location" size={16} color="#FF8A00" />
                      <Text style={styles.modalDistanceText}>
                        {formatDistance(selectedProfile.distance)}
                      </Text>
                    </View>

                    {/* Interests */}
                    {selectedProfile.interests && (
                      <View style={styles.modalInterestsSection}>
                        <Text style={styles.modalSectionTitle}>Interests</Text>
                        <View style={styles.modalInterestsContainer}>
                          {selectedProfile.interests
                            .split(",")
                            .map((interest, index) => (
                              <View key={index} style={styles.modalInterestBadge}>
                                <Text style={styles.modalInterestText}>
                                  {interest.trim()}
                                </Text>
                              </View>
                            ))}
                        </View>
                      </View>
                    )}

                    {/* Profile Details */}
                    <View style={styles.modalDetailsSection}>
                      <Text style={styles.modalSectionTitle}>About</Text>
                      
                      <View style={styles.modalDetailsGrid}>
                        {/* Workout */}
                        {selectedProfile.workout && (
                          <View style={styles.modalDetailCard}>
                            <View style={styles.modalDetailIcon}>
                              <Ionicons name="fitness" size={20} color="#FF8A00" />
                            </View>
                            <View style={styles.modalDetailContent}>
                              <Text style={styles.modalDetailLabel}>Workout</Text>
                              <Text style={styles.modalDetailValue}>{selectedProfile.workout}</Text>
                            </View>
                          </View>
                        )}

                        {/* Smoking */}
                        {selectedProfile.smoking && (
                          <View style={styles.modalDetailCard}>
                            <View style={styles.modalDetailIcon}>
                              <Ionicons name="remove-circle-outline" size={20} color="#FF8A00" />
                            </View>
                            <View style={styles.modalDetailContent}>
                              <Text style={styles.modalDetailLabel}>Smoking</Text>
                              <Text style={styles.modalDetailValue}>{selectedProfile.smoking}</Text>
                            </View>
                          </View>
                        )}

                        {/* Drinking */}
                        {selectedProfile.drinking && (
                          <View style={styles.modalDetailCard}>
                            <View style={styles.modalDetailIcon}>
                              <Ionicons name="wine" size={20} color="#FF8A00" />
                            </View>
                            <View style={styles.modalDetailContent}>
                              <Text style={styles.modalDetailLabel}>Drinking</Text>
                              <Text style={styles.modalDetailValue}>{selectedProfile.drinking}</Text>
                            </View>
                          </View>
                        )}

                        {/* Zodiac */}
                        {selectedProfile.zodiac && (
                          <View style={styles.modalDetailCard}>
                            <View style={styles.modalDetailIcon}>
                              <Ionicons name="star" size={20} color="#FF8A00" />
                            </View>
                            <View style={styles.modalDetailContent}>
                              <Text style={styles.modalDetailLabel}>Zodiac</Text>
                              <Text style={styles.modalDetailValue}>{selectedProfile.zodiac}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </ScrollView>

                {/* Menu Modal */}
                <Modal
                  visible={menuVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setMenuVisible(false)}
                >
                  <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuContainer}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                          if (selectedProfile) {
                            handleBlockUser(selectedProfile._id);
                            setSelectedProfile(null);
                            setMenuVisible(false);
                          }
                        }}
                      >
                        <Ionicons name="remove-circle-outline" size={20} color="#FF4444" />
                        <Text style={styles.menuText}>Block User</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.menuItem} 
                        onPress={() => { 
                          setMenuVisible(false); 
                          setReportModalVisible(true); 
                        }}
                      >
                        <Ionicons name="flag" size={20} color="#FF8A00" />
                        <Text style={styles.menuText}>Report User</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.menuItem} 
                        onPress={() => { 
                          setMenuVisible(false); 
                          handleShareProfile(); 
                        }}
                      >
                        <Ionicons name="share-social" size={20} color="#00BFFF" />
                        <Text style={styles.menuText}>Share Profile</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>

                {/* Report User Modal */}
                <Modal
                  visible={reportModalVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setReportModalVisible(false)}
                >
                  <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setReportModalVisible(false)}>
                    <View style={styles.reportModalContainer}>
                      <Text style={styles.reportTitle}>Report User</Text>
                      <TextInput
                        style={styles.reportInput}
                        placeholder="Enter reason for reporting..."
                        placeholderTextColor="#888"
                        value={reportReason}
                        onChangeText={setReportReason}
                        multiline
                      />
                      <TouchableOpacity
                        style={styles.reportButton}
                        onPress={async () => {
                          if (!reportReason.trim()) {
                            setCustomAlert({ visible: true, title: "Error", message: "Please enter a reason." });
                            return;
                          }
                          try {
                            await api.post("/api/v1/users/report-user", {
                              reportedUserId: selectedProfile?._id,
                              reason: reportReason,
                            });
                            setCustomAlert({ visible: true, title: "Success", message: "User reported successfully." });
                            setReportModalVisible(false);
                            setReportReason("");
                          } catch (err) {
                            setCustomAlert({ visible: true, title: "Error", message: "Failed to report user. Please try again." });
                          }
                        }}
                      >
                        <Text style={styles.reportButtonText}>Submit Report</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </>
            )}
          </View>
        </View>
      </Modal>
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#777",
  },
  scrollContainer: {
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  swiperContainer: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    top: -50,
  },
  swiper: {
    width: "100%",
    height: 600,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "110%",
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "black",
    elevation: 8,
    alignSelf: "center",
  },
  profileImage: {
    width: "100%",
    height: availableHeight,
    resizeMode: "cover",
  },
  profileImageWrapper: {
    borderRadius: 15,
    overflow: "hidden",
  },

  detailsContainer: {
    position: "absolute",
    bottom: "0%", // Responsive bottom positioning
    left: "5%", // Adjust left margin for consistent alignment
    width: "90%", // Maintain responsiveness across screens
    padding: 10,
    backgroundColor: "transparent",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  verificationImage: {
    width: 27,
    height: 27,
    top: "0.5%",
    marginLeft: 5,
  },
  // Inside styles
  superLikeFeedback: {
    tintColor: "#00B4FF", // Blue color for Super Like
  },

  feedbackContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  feedbackSticker: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },

  name: {
    fontSize: Dimensions.get("window").width * 0.08, // Responsive font size
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  relationship: {
    fontSize: Dimensions.get("window").width * 0.055, // Responsive font size
    color: "white",
    marginTop: 5,
    fontWeight: "bold",
  },

  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "50%", // Adjust based on how much gradient you want
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },

  noProfiles: {
    color: "#FFFFFF",
    fontSize: 18,
    marginTop: 20,
  },
  noProfilesCentered: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 0,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  modalScrollContainer: {
    flex: 1,
  },
  modalImage: {
    width: 350,
    height: 500,
    resizeMode: "cover",
    borderRadius: 15,
    marginHorizontal: 10,
  },
  modalDetails: {
    padding: 10,
  },
  modalName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  modalGender: {
    fontSize: 20,
    color: "white",
    marginTop: 5,
  },
  modalRelationship: {
    fontSize: 20,
    color: "white",
    marginTop: 5,
    justifyContent: "space-between",
    flexDirection: "row",
  },
  modalLocation: {
    fontSize: 20,
    color: "white",
    marginTop: 5,
    justifyContent: "space-between",
    flexDirection: "row",
  },
  interests: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 15,
  },
  modalBio: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 15,
    marginRight: 10,
    fontWeight: "bold",
    marginBottom: 10,
  },

  imageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  imageTouchableLeft: {
    position: "absolute",
    zIndex: 1,
    left: 0,
    width: "30%",
    height: "100%",
  },
  imageTouchableRight: {
    position: "absolute",
    right: 0,
    width: "30%",
    height: "100%",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 15,
  },
  interestItem: {
    backgroundColor: "#de822c",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  aboutMe: {
    marginTop: 20,
    fontSize: 20,
    color: "#de822c",
    paddingBottom: 3,
    borderRadius: 20,
  },
  myInterestsText: {
    marginTop: 20,
    fontSize: 24,
    color: "white",
    paddingBottom: 3,
    borderRadius: 20,
  },
  distance: {
    color: "white",
    fontSize: 20,
    paddingLeft: 50,
    paddingTop: 10,
    fontWeight: "bold",
  },
  divider: {
    borderBottomColor: "#de822c",
    height: 1,
    backgroundColor: "rgb(103, 103, 103)", // Light gray
    marginVertical: 10,
  },
  closeIcon: {
    width: 30, // Adjust as per your need
    height: 30,
    alignSelf: "center",
    marginTop: 30,
    marginBottom: 30,
    tintColor: "#de822c",
  },
  modalInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 13,
    marginBottom: 13,
  },
  modalIcons: {
    tintColor: "#de822c",
    height: 28,
    width: 28,
    marginLeft: 10,
    marginTop: 10,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: 'black',
    borderRadius: 10,
    marginTop: 60,
    marginRight: 20,
    paddingVertical: 8,
    width: 180,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
  },
  reportModalContainer: {
    backgroundColor: 'black',
    borderRadius: 12,
    padding: 20,
    marginTop: 100,
    marginRight: 20,
    width: 300,
    alignSelf: 'flex-end',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    marginBottom: 15,
    color: '#fff',
    fontSize: 15,
    backgroundColor: '#222',
  },
  reportButton: {
    backgroundColor: '#de822c',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reportButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeIconSmall: {
    width: 28,
    height: 28,
    tintColor: '#de822c',
    marginLeft: 10,
  },
  // New Professional Modal Styles
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#0F0F0F",
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1F1F1F",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  modalMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1F1F1F",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalImageContainer: {
    position: "relative",
    height: 500,
  },
  modalImageWrapper: {
    width: Dimensions.get("window").width,
    height: 500,
  },
  modalProfileImage: {
    width: "100%",
    height: "100%",
  },
  modalImageIndicators: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  modalIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
  },
  modalActiveIndicator: {
    backgroundColor: "#FF8A00",
    width: 24,
  },
  modalNoImageContainer: {
    width: Dimensions.get("window").width,
    height: 500,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
  },
  modalNoImageText: {
    color: "#888888",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  modalGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  modalContentContainer: {
    backgroundColor: "#0F0F0F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalNameSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalNameText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  modalAgeContainer: {
    backgroundColor: "#FF8A00",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalAgeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  modalInfoTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  modalInfoTagText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  modalDistanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#1F1F1F",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  modalDistanceText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  modalInterestsSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF8A00",
    marginBottom: 12,
  },
  modalInterestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modalInterestBadge: {
    backgroundColor: "#1F1F1F",
    borderWidth: 1,
    borderColor: "#FF8A00",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalInterestText: {
    color: "#FF8A00",
    fontSize: 14,
    fontWeight: "500",
  },
  modalDetailsSection: {
    marginBottom: 24,
  },
  modalDetailsGrid: {
    gap: 12,
  },
  modalDetailCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF8A00",
  },
  modalDetailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 138, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  modalDetailContent: {
    flex: 1,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: "#888888",
    marginBottom: 4,
    fontWeight: "500",
  },
  modalDetailValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  boostBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderWidth: 1,
    borderColor: "#FFD700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  boostBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFD700",
  },
  modalBoostIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    borderWidth: 1,
    borderColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  modalBoostText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFD700",
  },
});

export default HomeScreen;
