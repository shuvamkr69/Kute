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
  Alert,
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

const VerificationImage = require("../assets/icons/verified-logo.png");

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

const DAILY_FREE_LIKES = 1;
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
      const myLocation = await AsyncStorage.getItem("location");
      const locationArray = myLocation ? JSON.parse(myLocation) : null;
      const response = await api.get("/api/v1/users/");
      const formattedProfiles = response.data.map((profile: any) => ({
        _id: profile._id,
        fullName: profile.name,
        age: profile.age,
        relationshipType: profile.relationshipType,
        bio: profile.bio || "No bio available.",
        images:
          profile.images && profile.images.length > 0
            ? profile.images.slice(0, 6)
            : [
                "https://via.placeholder.com/400x600/AAAAAA/FFFFFF?text=No+Image",
              ],
        gender: profile.gender,
        location: profile.location,
        interests: Array.isArray(profile.interests)
          ? profile.interests.join(", ")
          : profile.interests || "No interests listed",

        distance: profile.location
          ? haversineDistance(
              locationArray[0],
              locationArray[1],
              profile.location[0],
              profile.location[1]
            )
          : null,

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
      }));
      // console.log(formattedProfiles);

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
    Alert.alert(
      "Out of Likes!",
      "You've reached your daily free likes. Get unlimited likes with Premium!"
    );
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
      Alert.alert(
        "User Blocked",
        "This user has been blocked and removed from suggestions."
      );
    } catch (error) {
      console.error("Error blocking user:", error);
      Alert.alert("Error", "Failed to block user.");
    }
  };

  const userLiked = async (index: number) => {
    if (index >= profiles.length) return;
    if (dailyLikes >= likeLimit) {
      showPremiumModal();
      // Do NOT modify profiles array, just force Swiper to reset
      setSwiperKey((k) => k + 1); // Force Swiper to reset
      return;
    }
    await incrementLikes();
    const likedUserId = profiles[index]._id;
    // console.log("Liked user ID before sending:", likedUserId);

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

        navigation.navigate("MatchScreen", {
          user: currentUser,
          matchedUser: {
            fullName: matchedUser.fullName,
            image: matchedUser.image,
          },
        });
      }

      // console.log("User liked response:", response.data);

      // Changed from filter to splice to maintain array references
      setProfiles((prevProfiles) => {
        const newProfiles = [...prevProfiles];
        newProfiles.splice(index, 1);
        return newProfiles;
      });

      // Update current card index
      // setCurrentCardIndex(Math.min(index, profiles.length - 2));
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
        "/api/v1/users/userSuperLiked", // Your backend endpoint
        { likedUserId: superLikedUserId },
        { headers: { "Content-Type": "application/json" } }
      );

      // console.log("Super Like response:", response.data);

      // Show Super Like feedback
      setSwipeFeedback({
        visible: true,
        type: "superLike", // New feedback type
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
        }, 1000); // Keep feedback visible for 1 second
      });

      // Remove the card from the stack
      setProfiles((prevProfiles) => {
        const newProfiles = [...prevProfiles];
        newProfiles.splice(index, 1);
        return newProfiles;
      });

      // Handle matching (if applicable)
      if (response.data?.data?.matched === true) {
        const matchedUser = response.data.data.matchedUser;

        const userString = await AsyncStorage.getItem("user");
        const user = userString ? JSON.parse(userString) : {};
        const avatar = await AsyncStorage.getItem("avatar");
        const currentUser = {
          fullName: user.fullName,
          image: avatar,
        };

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
        Alert.alert(
          "You're out of Super Likes",
          "Come back later or get more!"
        );
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
      Alert.alert("Error", error.message || "Failed to share profile.");
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
              // Update current card index when swiped

              Animated.spring(feedbackAnim, {
                toValue: 0,
                useNativeDriver: true,
              }).start(() => {
                setSwipeFeedback({ visible: false, type: null });
              });
            }}
            cards={profiles}
            renderCard={(profile, index) => {
              const isTopCard = index === currentCardIndex;

              return (
                <View style={styles.card} key={profile._id}>
                  <TouchableOpacity
                    onPress={() => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                      setSelectedProfile(profile);
                      setCurrentImageIndex(0);
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
                              profile.images[0] ||
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
                    </View>
                    <Text style={styles.relationship}>
                      {profile.relationshipType || ""}
                    </Text>
                    <Text style={styles.modalLocation}>
                      <Text style={styles.distance}>
                        {Math.round(profile.distance) + " km away"}
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
        <Text style={styles.noProfiles}>No profiles available</Text>
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
              <ScrollView contentContainerStyle={styles.modalScrollContainer}>
                {/* Top bar with close and 3-dots menu icons */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <TouchableOpacity activeOpacity={0.8}
                  onPress={() => setSelectedProfile(null)} style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
                    <Image
                      source={require("../assets/icons/red-cross.png")}
                      style={styles.closeIconSmall}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
                    <Ionicons name="ellipsis-vertical" size={28} color="#de822c" />
                  </TouchableOpacity>
                </View>
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
                        <Text style={styles.menuText}>Block User</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setReportModalVisible(true); }}>
                        <Text style={styles.menuText}>Report User</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); handleShareProfile(); }}>
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
                            Alert.alert("Error", "Please enter a reason.");
                            return;
                          }
                          try {
                            await api.post("/api/v1/users/report-user", {
                              reportedUserId: selectedProfile?._id,
                              reason: reportReason,
                            });
                            Alert.alert("Success", "User reported successfully.");
                            setReportModalVisible(false);
                            setReportReason("");
                          } catch (err) {
                            Alert.alert("Error", "Failed to report user. Please try again.");
                          }
                        }}
                      >
                        <Text style={styles.reportButtonText}>Submit Report</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>
                {/* Image Navigation with Smooth Animation */}
                <View style={styles.imageContainer}>
                  <TouchableOpacity
                    style={styles.imageTouchableLeft}
                    onPress={() => handlePrevImage()}
                  />
                  <Animated.Image
                    source={{ uri: selectedProfile.images[currentImageIndex] }}
                    style={[styles.modalImage, { opacity: fadeAnim }]}
                  />
                  <TouchableOpacity
                    style={styles.imageTouchableRight}
                    onPress={() => handleNextImage()}
                  />
                </View>

                {/* Dotted Navigation */}
                <View style={styles.dotsContainer}>
                  {selectedProfile?.images.map((_, index) => {
                    return (
                      <Animated.View
                        key={index}
                        style={[
                          styles.dot,
                          {
                            transform: [
                              {
                                translateX: dotAnimation.interpolate({
                                  inputRange: [index - 1, index, index + 1],
                                  outputRange: [-1, 0, 1], // Adjust for sliding effect
                                  extrapolate: "clamp",
                                }),
                              },
                            ],
                            backgroundColor:
                              currentImageIndex === index ? "#de822c" : "#777",
                            width: currentImageIndex === index ? 30 : 30,
                          },
                        ]}
                      />
                    );
                  })}
                </View>

                {/* Profile Details */}
                <View style={styles.modalDetails}>
                  <Text style={styles.modalName}>
                    {selectedProfile.fullName} {selectedProfile.age}{" "}
                    {selectedProfile.verifiedUser && (
                      <Image
                        source={require("../assets/icons/verified-logo.png")}
                        style={styles.verificationImage}
                      />
                    )}
                  </Text>
                  <Text style={styles.modalGender}>
                    {selectedProfile.gender}
                  </Text>
                  <Text style={styles.modalRelationship}>
                    {selectedProfile.relationshipType}
                  </Text>
                  <Text style={styles.modalLocation}>
                    <Text style={styles.distance}>
                      {Math.round(selectedProfile.distance) + " km away"}
                    </Text>
                  </Text>

                  <View style={styles.divider} />

                  <Text style={styles.myInterestsText}>My interests</Text>

                  <View style={styles.interestsContainer}>
                    {selectedProfile.interests
                      .split(",")
                      .map((interest, index) => (
                        <View key={index} style={styles.interestItem}>
                          <Text style={styles.interestText}>
                            {interest.trim()}
                          </Text>
                        </View>
                      ))}
                  </View>
                  <View style={styles.divider} />

                  <View style={styles.modalInfoContainer}>
                    <Image
                      source={require("../assets/icons/dumble.png")}
                      style={styles.modalIcons}
                    />
                    <Text style={styles.modalBio}>
                      {selectedProfile.workout}
                    </Text>
                  </View>
                  <View style={styles.divider} />

                  <View style={styles.modalInfoContainer}>
                    <Image
                      source={require("../assets/icons/cigarette.png")}
                      style={styles.modalIcons}
                    />
                    <Text style={styles.modalBio}>
                      {selectedProfile.smoking}
                    </Text>
                  </View>
                  <View style={styles.divider} />

                  <View style={styles.modalInfoContainer}>
                    <Image
                      source={require("../assets/icons/wine.png")}
                      style={styles.modalIcons}
                    />
                    <Text style={styles.modalBio}>
                      {selectedProfile.drinking}
                    </Text>
                  </View>
                  <View style={styles.divider} />

                  <View style={styles.modalInfoContainer}>
                    <Image
                      source={require("../assets/icons/constellation.png")}
                      style={styles.modalIcons}
                    />
                    <Text style={styles.modalBio}>
                      {selectedProfile.zodiac}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                </View>

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalContent: {
    width: "100%", // Changed from '90%' to '100%'
    height: "100%", // Changed from '80%' to '100%'
    backgroundColor: "#121212",
    borderRadius: 15, // You might want to remove this if you want full screen
    overflow: "hidden",
  },
  modalScrollContainer: {
    marginTop: 30, //adding distance between the top of the screen and profile images on the profile modal
    paddingBottom: 20,
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
});

export default HomeScreen;
