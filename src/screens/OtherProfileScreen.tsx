//this screen displays the profile of the user when you click on their image on the chatscreen

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import api from "../utils/api";
import { useNavigation } from "@react-navigation/native";

const screenWidth = Dimensions.get("window").width;

type RootStackParamList = {
  OtherProfile: { userId: string };
};

type OtherProfileRouteProp = RouteProp<RootStackParamList, "OtherProfile">;

type UserProfile = {
  _id: string;
  name: string;
  age: number;
  bio: string;
  height: string;
  occupation: string;
  gender: string;
  genderOrientation: string;
  photos: string[];
  interests: string[];
  avatar1?: string;
  avatar2?: string;
  avatar3?: string;
  avatar4?: string;
  avatar5?: string;
  avatar6?: string;
};

const OtherProfileScreen = () => {
  const route = useRoute<OtherProfileRouteProp>();
  const navigation = useNavigation();
  const { userId } = route.params;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/v1/users/get/${userId}`);
        const data = res.data;
        console.log("User data:", data); // Debugging line
        
        // Filter out null/undefined images and ensure we have an array
        const photos = [
          data.images?.[0],
          data.images?.[1],
          data.images?.[2],
          data.images?.[3],
          data.images?.[4],
          data.images?.[5],
        ].filter(Boolean); // Remove undefined or null

        // Ensure we have at least one photo, or use a placeholder
        const validPhotos = photos.length > 0 ? photos : [];

        setUser({ 
          ...data, 
          photos: validPhotos,
          interests: data.interests || [],
          bio: data.bio || "",
          height: data.height || "",
          occupation: data.occupation || "",
          gender: data.gender || "",
          genderOrientation: data.genderOrientation || ""
        });

        // Record the profile view
        try {
          await api.post('/api/v1/users/profileViewed', { userId });
        } catch (viewError) {
          console.error("Error recording profile view:", viewError);
          // Don't block the UI for view recording errors
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF8A00" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
        <View style={styles.centered}>
          <Ionicons name="person-circle-outline" size={80} color="#666" />
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleImageScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setCurrentImageIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          {user.photos.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleImageScroll}
                scrollEventThrottle={16}
              >
                {user.photos.map((photoUrl, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
              
              {/* Image Indicators */}
              {user.photos.length > 1 && (
                <View style={styles.imageIndicators}>
                  {user.photos.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        currentImageIndex === index && styles.activeIndicator,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="person-circle" size={120} color="#666" />
              <Text style={styles.noImageText}>No photos available</Text>
            </View>
          )}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={["transparent", "rgba(15,15,15,0.8)"]}
            style={styles.gradientOverlay}
          />
        </View>

        {/* Profile Content */}
        <View style={styles.contentContainer}>
          {/* Name and Age */}
          <View style={styles.nameSection}>
            <Text style={styles.nameText}>{user.name}</Text>
            <View style={styles.ageContainer}>
              <Text style={styles.ageText}>{user.age}</Text>
            </View>
          </View>

          {/* Occupation */}
          {user.occupation && (
            <View style={styles.occupationContainer}>
              <Ionicons name="briefcase" size={16} color="#FF8A00" />
              <Text style={styles.occupationText}>{user.occupation}</Text>
            </View>
          )}

          {/* Bio */}
          {user.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )}

          {/* Profile Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.detailsGrid}>
              {/* Height */}
              {user.height && (
                <View style={styles.detailCard}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="resize" size={20} color="#FF8A00" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Height</Text>
                    <Text style={styles.detailValue}>{user.height}</Text>
                  </View>
                </View>
              )}

              {/* Gender */}
              {user.gender && (
                <View style={styles.detailCard}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="person" size={20} color="#FF8A00" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Gender</Text>
                    <Text style={styles.detailValue}>{user.gender}</Text>
                  </View>
                </View>
              )}

              {/* Orientation */}
              {user.genderOrientation && (
                <View style={styles.detailCard}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="heart" size={20} color="#FF8A00" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Looking for</Text>
                    <Text style={styles.detailValue}>{user.genderOrientation}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <View style={styles.interestsSection}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestsContainer}>
                {user.interests.map((interest, index) => (
                  <View key={index} style={styles.interestBadge}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F0F",
    paddingHorizontal: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  errorText: {
    color: "#FF4444",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#FF8A00",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#0F0F0F",
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1F1F1F",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    height: 500,
  },
  imageWrapper: {
    width: screenWidth,
    height: 500,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#FF8A00",
    width: 24,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  noImageContainer: {
    width: screenWidth,
    height: 500,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
  },
  noImageText: {
    color: "#888888",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  contentContainer: {
    backgroundColor: "#0F0F0F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  nameText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  ageContainer: {
    backgroundColor: "#FF8A00",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ageText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  occupationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#1F1F1F",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  occupationText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  bioSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF8A00",
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: "#CCCCCC",
    lineHeight: 24,
    backgroundColor: "#1F1F1F",
    padding: 16,
    borderRadius: 12,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsGrid: {
    gap: 12,
  },
  detailCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF8A00",
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 138, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: "#888888",
    marginBottom: 4,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  interestsSection: {
    marginBottom: 24,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestBadge: {
    backgroundColor: "#1F1F1F",
    borderWidth: 1,
    borderColor: "#FF8A00",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestText: {
    color: "#FF8A00",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default OtherProfileScreen;
