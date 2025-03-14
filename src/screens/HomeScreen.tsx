import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator, Alert } from "react-native";
import Swiper from "react-native-deck-swiper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../utils/api";

type Props = NativeStackScreenProps<any, "Home">;

interface Profile {
  _id: string; // MongoDB ID
  fullName: string;
  age: number;
  relationshipType: string;
  image?: string; // Optional field
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await api.get("/api/v1/users"); 
        const formattedProfiles = response.data.map((profile: any) => ({
          _id: profile._id,
          fullName: profile.name,
          age: profile.age,
          relationshipType: profile.relationshipType,
          image: profile.image || "https://www.aandmedu.in/wp-content/uploads/2021/11/9-16-Aspect-Ratio-576x1024.jpg", // Default image
        }));
        
        setProfiles(formattedProfiles);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const userLiked = async (index: number) => {
  if (index >= profiles.length) return;

  const likedUserId = profiles[index]._id; // Ensure correct ID retrieval
  console.log("Liked user ID before sending:", likedUserId);

  try {
    const response = await api.post(
      "/api/v1/users/userLiked",
      { likedUserId : likedUserId }, // ✅ Send as an object
      { headers: { "Content-Type": "application/json" } } // ✅ Ensure JSON format
    );

    if (response.data?.data?.length > 0 && response.data.data[0]?.matched)
    {
      Alert.alert("Matched", "You have a match");
    }

    console.log("User liked response:", response.data);

    // Remove liked user from stack
    setProfiles((prevProfiles) => prevProfiles.filter((_, i) => i !== index));
  } catch (error) {
    console.error("Error liking user:", error.response?.data || error.message);
  }
};


  const userPassed = (index: number) => {
    console.log("User passed:", profiles[index]?._id);
  };


  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FFA62B" />
      ) : profiles.length > 0 ? (
        <View style={styles.swiperContainer}>
          <Swiper
            cards={profiles}
            renderCard={(profile) => (
              <View style={styles.card} key={profile._id}>
                <Image source={{ uri: profile.image }} style={styles.profileImage} />
                <View style={styles.detailsContainer}>
                  <Text style={styles.name}>
                    {profile.fullName.split(" ")[0]}, {profile.age}
                  </Text>
                  <Text style={styles.relationship}>{profile.relationshipType}</Text>
                </View>
              </View>
            )}
            onSwipedRight={(index) => userLiked(index)} // ✅ Pass index
            onSwipedLeft={(index) => userPassed(index)}
            cardIndex={0}
            backgroundColor="transparent"
            stackSize={3}
            containerStyle={styles.swiper}
          />
        </View>
      ) : (
        <Text style={styles.noProfiles}>No profiles available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  swiperContainer: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    top: 10,
  },
  swiper: {
    width: "100%",
    height: 500,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    height: 600,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#121212",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  profileImage: {
    width: "100%",
    height: 350,
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
});

export default HomeScreen;
