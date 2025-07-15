import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../utils/api"; // Import the API utility
import { useAuth } from "../../navigation/AuthContext";
import { registerForPushNotifications } from "../../utils/notifications";
import BackButton from "../../components/BackButton";

/** Type Definitions */
type Props = NativeStackScreenProps<any, "MakeBio">;

const MakeBio: React.FC<Props> = ({ navigation }) => {
  const [bio, setBio] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchPushToken = async () => {
      const token = await registerForPushNotifications();
      if (token) {
        await AsyncStorage.setItem("pushToken", token); // Save pushToken for later use
        setPushToken(token);
      }
    };
    fetchPushToken();
  }, []);

  const { signIn } = useAuth();

  /** Function to submit user data */
  const submitData = async () => {
    if (!bio.trim()) {
      Alert.alert("Error", "Bio cannot be empty.");
      return;
    }

    setIsUploading(true);

    try {
      const tempUserData = await AsyncStorage.getItem("tempUserData");
      if (!tempUserData) throw new Error("No temporary data found");

      const userData = JSON.parse(tempUserData);
      if (!userData.email) {
        throw new Error("Missing required user details.");
      }

      userData.bio = bio;
      userData.pushToken =
        pushToken || (await AsyncStorage.getItem("pushToken")); // Ensure pushToken is set

      console.log("User Data:", userData);

      const photos = userData.photos || [];
      if (photos.length < 1 || photos.length > 6) {
        throw new Error("You must upload between 1 and 6 photos.");
      }

      const formData = new FormData();
      formData.append("email", userData.email);
      formData.append("fullName", userData.fullName);
      formData.append("password", userData.password);
      formData.append("age", String(userData.age));
      formData.append("gender", userData.gender);
      formData.append("personality", userData.personality);
      formData.append("interests", JSON.stringify(userData.interests));
      formData.append("relationshipType", userData.relationshipType);
      formData.append("bio", bio.trim());
      formData.append("genderOrientation", userData.genderOrientation);
      const locationArray = userData.location
        .split(",")
        .map((n: string) => Number(n.trim()));
      formData.append("location", JSON.stringify(locationArray)); // Important
      formData.append("country", userData.country);
      formData.append("pushToken", userData.pushToken || ""); // Ensure pushToken is included
      formData.append("religion", userData.religion);

      console.log("Form Data:", formData);

      photos.forEach((photoUri: string, index: number) => {
        formData.append(`avatar${index + 1}`, {
          uri: photoUri,
          name: `avatar${index + 1}.jpg`,
          type: "image/jpeg",
        } as any);
      });

      const response = await api.post("/api/v1/users/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201) {
        // Registration successful, now login automatically
        try {
          const loginResponse = await api.post("/api/v1/users/login", {
            email: userData.email,
            password: userData.password,
          });
          if (loginResponse.status === 200) {
            const { accessToken, refreshToken, user } = loginResponse.data.data;
            if (!accessToken || !refreshToken) {
              throw new Error("Authentication failed: Missing tokens");
            }
            await AsyncStorage.setItem("user", JSON.stringify(user));
            await AsyncStorage.setItem("accessToken", accessToken);
            await AsyncStorage.setItem("refreshToken", refreshToken);
            await AsyncStorage.setItem("avatar", user.avatar1);
            await AsyncStorage.setItem("location", JSON.stringify(user.location));
            // Register push token and update if needed
            const token = await registerForPushNotifications();
            if (token) {
              const storedToken = await AsyncStorage.getItem("pushToken");
              if (storedToken !== token) {
                try {
                  await api.post("/api/v1/users/updatePushToken", { pushToken: token });
                  await AsyncStorage.setItem("pushToken", token);
                } catch (error) {}
              }
            }
            signIn();
            navigation.reset({ index: 0, routes: [{ name: "HomeTabs" }] });
          } else {
            throw new Error("Unexpected response from server");
          }
        } catch (loginError: any) {
          console.error("Auto-login error after registration:", loginError.message);
          Alert.alert("Registration Complete", "Account created, but automatic login failed. Please login manually.");
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        }
      } else {
        throw new Error(response.data?.message || "Failed to submit data");
      }
    } catch (error: any) {
      console.error("Submit Error:", error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to submit data."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title={"Bio"} />
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Your Love Resume</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Tell us about yourself"
            placeholderTextColor="#888"
            value={bio}
            onChangeText={(text) => {
              if (text.length <= 500) setBio(text);
            }}
            multiline
            maxLength={500}
          />
          <Text
            style={[styles.charCount, bio.length === 500 && { color: "red" }]}
          >
            {bio.length}/500
          </Text>
        </View>
      </SafeAreaView>
      <TouchableOpacity
        style={[styles.submitButton, isUploading && styles.disabledButton]}
        onPress={submitData}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

/** Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#de822c",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    position: "relative",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 160,
    backgroundColor: "#1E1E1E",
    color: "#FFF",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#de822c",
    textAlignVertical: "top",
  },
  charCount: {
    position: "absolute",
    right: 10,
    bottom: 10,
    fontSize: 12,
    color: "#888",
  },

  submitButton: {
    backgroundColor: "#de822c",
    paddingVertical: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButtonContainer: {
    flex: 1,
    backgroundColor: "#121212",
  },
});

export default MakeBio;
