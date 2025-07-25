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
import MaskedView from '@react-native-masked-view/masked-view';

// Gradient Icon Component
const GradientIcon = ({ name, size = 20 }: { name: any; size?: number }) => (
  <MaskedView
    style={{ width: size, height: size }}
    maskElement={
      <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={name} size={size} color="black" />
      </View>
    }
  >
    <LinearGradient
      colors={["#de822c", "#ff172e"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    />
  </MaskedView>
);

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
      <BackButton title={"Complete Your Profile"} />
      <SafeAreaView style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.subtitle}>
            Tell potential matches what makes you unique
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputHeader}>
            <GradientIcon name="create-outline" size={18} />
            <Text style={styles.inputLabel}>About Me</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Share something interesting about yourself..."
            placeholderTextColor="#666"
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
            <View style={styles.tipContainer}>
              <GradientIcon name="bulb-outline" size={14} />
              <Text style={styles.tipText}>Be authentic & specific</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickTipsCard}>
          <View style={styles.tipsHeader}>
            <GradientIcon name="checkmark-done-outline" size={18} />
            <Text style={styles.tipsTitle}>Quick Tips</Text>
          </View>
          <View style={styles.tipsGrid}>
            {[
              { icon: 'heart-outline', text: 'Your passions' },
              { icon: 'search-outline', text: 'What you seek' },
              { icon: 'star-outline', text: 'Fun facts' },
              { icon: 'sparkles-outline', text: 'What makes you special' }
            ].map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <GradientIcon name={tip.icon} size={14} />
                <Text style={styles.tipItemText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={submitData}
          disabled={isUploading || !bio.trim()}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isUploading || !bio.trim() ? ["#666", "#888"] : ["#de822c", "#ff172e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <GradientIcon name="checkmark-circle" size={20} />
                <Text style={styles.buttonText}>Complete Profile</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
      
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
  backButtonContainer: {
    flex: 1,
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
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
    backgroundColor: '#181A20',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#de822c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#23262F',
  },
  input: {
    width: '100%',
    height: 120,
    backgroundColor: '#23262F',
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
    marginTop: 15,
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
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickTipsCard: {
    backgroundColor: '#181A20',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#23262F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  tipsTitle: {
    color: '#de822c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#23262F",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    flex: 1,
    minWidth: "48%",
  },
  tipItemText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  infoBox: {
    backgroundColor: '#181A20',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#23262F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoTitle: {
    color: '#de822c',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  infoItems: {
    gap: 10,
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#A1A7B3',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#de822c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 17,
    letterSpacing: 0.2,
    marginRight: 8,
  },
});

export default MakeBio;
