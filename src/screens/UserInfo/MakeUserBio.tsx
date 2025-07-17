import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import CustomAlert from "../../components/CustomAlert";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/** Type Definitions */
type Props = NativeStackScreenProps<any, "MakeBio">;

const MakeBio: React.FC<Props> = ({ navigation }) => {
  const [bio, setBio] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [showUserExistsAlert, setShowUserExistsAlert] = useState(false);
  const [existingEmail, setExistingEmail] = useState("");
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });

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
    let attemptedEmail = "";
    if (!bio.trim()) {
      setCustomAlert({ visible: true, title: "Error", message: "Bio cannot be empty." });
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
      attemptedEmail = userData.email;

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
          setCustomAlert({ visible: true, title: "Registration Complete", message: "Account created, but automatic login failed. Please login manually." });
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        }
      } else {
        throw new Error(response.data?.message || "Failed to submit data");
      }
    } catch (error: any) {
      console.error("Submit Error:", error.message);
      const errorMsg = error.response?.data?.message || "Failed to submit data.";
      if (errorMsg.includes("User already exists")) {
        setExistingEmail(attemptedEmail);
        setShowUserExistsAlert(true);
      } else {
        setCustomAlert({ visible: true, title: "Error", message: errorMsg });
      }
    } finally {
      setIsUploading(false);
    }
  };

  // CustomAlert for user already exists
  const handleUserExistsConfirm = () => {
    setShowUserExistsAlert(false);
    navigation.navigate("Login", { email: existingEmail });
  };
  const handleUserExistsCancel = () => {
    setShowUserExistsAlert(false);
  };

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title={"Bio"} />
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Your Story</Text>
        <Text style={styles.subtitle}>
          Share a glimpse of your world. What makes you, you?
        </Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#888"
            value={bio}
            onChangeText={(text) => {
              if (text.length <= 500) setBio(text);
            }}
            multiline
            maxLength={500}
          />
          <View style={styles.charCountRow}>
            <Text style={[styles.charCount, bio.length === 500 && { color: "#FF3B30" }]}> 
              {bio.length}/500
            </Text>
            <Text style={styles.tipText}>Tip: Be genuine and specific!</Text>
          </View>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What to write:</Text>
          <Text style={styles.infoText}>• Your passions and what excites you</Text>
          <Text style={styles.infoText}>• What you're looking for</Text>
          <Text style={styles.infoText}>• A fun fact or a quirky trait</Text>
          <Text style={styles.infoText}>• What makes you unique</Text>
        </View>
      </SafeAreaView>
      <TouchableOpacity
        style={styles.buttonWrapper}
        onPress={submitData}
        disabled={isUploading}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#de822c", "#ff172e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      />
      <CustomAlert
        visible={showUserExistsAlert}
        title="User already exists"
        message="Would you like to login?"
        onClose={handleUserExistsCancel}
        onConfirm={handleUserExistsConfirm}
        confirmText="Yes, Login"
        cancelText="Cancel"
      />
    </View>
  );
};

/** Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 0,
    justifyContent: 'flex-start',
    // Remove maxWidth and alignSelf for full width
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#de822c",
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#A1A7B3',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 2,
    fontWeight: '400',
    letterSpacing: 0.1,
    paddingHorizontal: 8,
    lineHeight: 22,
  },
  card: {
    width: '100%',
    // Remove maxWidth and alignSelf for full width
    backgroundColor: '#181A20',
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 8,
    shadowColor: '#de822c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 6,
    marginTop: 8,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#23242a',
    alignItems: 'stretch',
  },
  input: {
    width: '100%',
    height: 240,
    backgroundColor: '#23242a',
    color: '#FFF',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#de822c',
    textAlignVertical: 'top',
    fontSize: 17,
    fontWeight: '400',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  charCount: {
    fontSize: 13,
    color: "#888",
    fontWeight: '500',
  },
  tipText: {
    color: '#de822c',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: '#181A20',
    borderRadius: 14,
    padding: 18,
    marginTop: 8,
    marginBottom: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#23242a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    alignItems: 'center', // Center children horizontally
  },
  infoTitle: {
    color: '#de822c',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center', // Center text
  },
  infoText: {
    color: '#A1A7B3',
    fontSize: 14,
    marginBottom: 2,
    marginLeft: 2,
    textAlign: 'center', // Center text
  },
  buttonWrapper: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#de822c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
  },
  buttonGradient: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 17,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  backButtonContainer: {
    flex: 1,
    backgroundColor: "#121212",
    // Remove any width or centering constraints
  },
});

export default MakeBio;
