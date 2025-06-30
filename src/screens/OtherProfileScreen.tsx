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
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import axios from "axios";
import api from "../utils/api";
import BackButton from "../components/BackButton";

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
  const { userId } = route.params;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/api/v1/users/get/${userId}`);
        const data = res.data;
        console.log("User data:", data); // Debugging line
        const photos = [
          data.images[0],
          data.images[1],
          data.images[2],
          data.images[3],
          data.images[4],
          data.images[5],
        ].filter(Boolean); // Remove undefined or null

        setUser({ ...data, photos });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#de822c" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>User not found.</Text>
      </View>
    );
  }

  return (
        <View style={styles.backButtonContainer}>
          <BackButton title="" />
    <ScrollView style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.imageScroll}
      >
        {user.photos.map((photoUrl, index) => (
          <Image
            key={index}
            source={{ uri: photoUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      <Text style={styles.nameText}>
        {user.name}, {user.age}
      </Text>
      <Text style={styles.occupationText}>{user.occupation}</Text>
      <Text style={styles.bioText}>{user.bio}</Text>

      <View style={styles.infoSection}>
        <Text style={styles.label}>Height</Text>
        <Text style={styles.value}>{user.height}</Text>

        <Text style={styles.label}>Gender</Text>
        <Text style={styles.value}>{user.gender}</Text>

        <Text style={styles.label}>Orientation</Text>
        <Text style={styles.value}>{user.genderOrientation}</Text>

        <Text style={styles.label}>Interests</Text>
        <View style={styles.interestContainer}>
          {user.interests.map((interest, index) => (
            <Text key={index} style={styles.interestBadge}>
              {interest}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 16,
  },
  imageScroll: {
    height: 400,
    borderRadius: 16,
    marginBottom: 16,
  },
  image: {
    width: screenWidth - 32,
    height: 400,
    borderRadius: 16,
    marginRight: 16,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  occupationText: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 4,
  },
  bioText: {
    fontSize: 14,
    color: "#eee",
    marginTop: 12,
  },
  infoSection: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00FFFF",
    marginTop: 12,
  },
  value: {
    fontSize: 14,
    color: "#fff",
  },
  interestContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  interestBadge: {
    backgroundColor: "#00bcd4",
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 13,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});

export default OtherProfileScreen;
