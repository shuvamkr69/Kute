import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, ScrollView, RefreshControl, Animated, LayoutAnimation, UIManager, Platform
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = NativeStackScreenProps<any, "Home">;

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
}

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [dotAnimation] = useState(new Animated.Value(0));
  const [distance, setDistance] = useState<number | null>(null);



  const fetchProfiles = async () => {
    try {
      const response = await api.get("/api/v1/users/");
      const formattedProfiles = response.data.map((profile: any) => ({
        _id: profile._id,
        fullName: profile.name,
        age: profile.age,
        relationshipType: profile.relationshipType,
        bio: profile.bio || "No bio available.",
        images: profile.images && profile.images.length > 0 
          ? profile.images.slice(0, 6) 
          : ["https://via.placeholder.com/400x600/AAAAAA/FFFFFF?text=No+Image"],
        gender: profile.gender,
        location: profile.location,
        interests: 
            Array.isArray(profile.interests) ? 
            profile.interests.join(", ") : 
            (profile.interests || "No interests listed"),
            
        distance: profile.location?.coordinates 
        ? haversineDistance(
            37.7749, 
            -122.4194, 
            profile.location.coordinates[1], 
            profile.location.coordinates[0]
          ) 
        : null,
      }));

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

const userLiked = async (index: number) => {
  if (index >= profiles.length) return;

  const likedUserId = profiles[index]._id;
  console.log("Liked user ID before sending:", likedUserId);

  try {
    const response = await api.post(
      "/api/v1/users/userLiked",
      { likedUserId },
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.data?.data?.length > 0 && response.data.data[0]?.matched) {
      const matchedUser = profiles[index]; // Get matched user's details
      
      // Replace with actual logged-in user details
      const userString = await AsyncStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : {};
      const avatar = await AsyncStorage.getItem("avatar");
      const currentUser = { 
        fullName: user.fullName,  // Update this dynamically if possible
        image: avatar // Replace with actual user's profile image
      };
      navigation.navigate("MatchScreen", {
        user: currentUser, 
        matchedUser: {
          fullName: matchedUser.fullName,
          image: matchedUser.images.length > 0 ? matchedUser.images[0] : "https://via.placeholder.com/400x600/AAAAAA/FFFFFF?text=No+Image",
        },
      });
    }

    console.log("User liked response:", response.data);

    setProfiles((prevProfiles) => prevProfiles.filter((_, i) => i !== index));
  } catch (error) {
    console.error("Error liking user:", error.response?.data || error.message);
  }
};



const userPassed = (index: number) => {
  console.log("User passed:", profiles[index]?._id);
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371; // Earth's radius in KM
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  setDistance(R * c); // Distance in kilometers
};

useEffect(() => {
  haversineDistance
}, []);


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading ? (
        <ActivityIndicator size="large" color="#FFA62B" />
      ) : profiles.length > 0 ? (
        <View style={styles.swiperContainer}>
          <Swiper
            cards={profiles}
            renderCard={(profile) => (
              <View style={styles.card} key={profile._id}>
                <TouchableOpacity onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSelectedProfile(profile);
                  setCurrentImageIndex(0);
                }} activeOpacity={1}>
                  <Image source={{ uri: profile.images[0] }} style={styles.profileImage} />
                </TouchableOpacity>
                <View style={styles.detailsContainer}>
                  <Text style={styles.name}>
                    {profile.fullName.split(" ")[0]}, {profile.age}
                  </Text>
                  <Text style={styles.relationship}>{profile.relationshipType}</Text>
                </View>
              </View>
            )}
            onSwipedRight={(index) => userLiked(index)}
            onSwipedLeft={(index) =>userPassed(index)}
            cardIndex={0}
            backgroundColor="transparent"
            stackSize={3}
            stackAnimationTension={80} // Adjusted for smoother swipe animations
            stackAnimationFriction={10} 
            containerStyle={styles.swiper}
            cardStyle={{ backgroundColor: "transparent" }}
          />
        </View>
      ) : (
        <Text style={styles.noProfiles}>No profiles available</Text>
      )}

      {/* Profile Modal */}
      <Modal
        visible={!!selectedProfile}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedProfile(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedProfile && (
              <ScrollView contentContainerStyle={styles.modalScrollContainer}>
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
                  outputRange: [-10, 0, 10], // Adjust for sliding effect
                  extrapolate: "clamp",
                }),
              },
            ],
            backgroundColor:
              currentImageIndex === index ? "#FFA62B" : "#777",
            width: currentImageIndex === index ? 20 : 10,
          },
        ]}
      />
    );
  })}
</View>


                {/* Profile Details */}
                <View style={styles.modalDetails}>
                  <Text style={styles.modalName}>
                    {selectedProfile.fullName}, {selectedProfile.age}
                  </Text>
                  <Text style={styles.modalGender}>{selectedProfile.gender}</Text>
                  <Text style={styles.modalRelationship}>{selectedProfile.relationshipType}</Text>
                  <Text style={styles.myInterestsText}>My interests</Text>

                  <View style={styles.interestsContainer}>
                    {selectedProfile.interests.split(",").map((interest, index) => (
                      <View key={index} style={styles.interestItem}>
                        <Text style={styles.interestText}>{interest.trim()}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.aboutMe}>About me</Text>
                  <Text style={styles.modalBio}>{selectedProfile.bio}</Text>
                </View>

                 <Text style = {styles.distanceText}>Location</Text> 
                 <Text style = {styles.distance}>{distance}</Text>

                  

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedProfile(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
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
  marginHorizontal: 5,
  backgroundColor: "#777",
},

  activeDot: {
    width: 15, // Elongated when active
    height: 10,
    backgroundColor: "#FFA62B",
    borderRadius: 5,
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
    height: 500,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "110%",
    left: -12,
    height: 600,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#FFA62B",
    elevation: 8,
  },
  profileImage: {
    width: "100%",
    height: 500,
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  relationship: {
    fontSize: 18,
    color: "#FFA62B",
    marginTop: 5,
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
    width: "90%",
    height: "80%",
    backgroundColor: "#121212",
    borderRadius: 15,
    overflow: "hidden",
  },
  modalScrollContainer: {
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
    padding: 20,
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
  },
  closeButton: {
    alignSelf: "center",
    marginTop: 20,
    backgroundColor: "#FFA62B",
    padding: 10,
    borderRadius: 20,
  },
  closeButtonText: {
    color: "#121212",
    fontSize: 16,
    fontWeight: "bold",
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
    backgroundColor: "#FFA62B",
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
  aboutMe:{
    marginTop: 20,
    fontSize: 20,
    color: "#FFA62B",
    paddingBottom: 3,
    borderRadius: 20,
  },
  myInterestsText:{
    marginTop: 20,
    fontSize: 20,
    color: "#FFA62B",
    paddingBottom: 3,
    borderRadius: 20,
  },
  distanceText: {
    color: "#FFA62B",
    fontSize: 18,
    left: 20,
  },
  distance: {
    color: "#FFA62B",
    fontSize: 10,
    left: 20,
  },
  
});

export default HomeScreen;
