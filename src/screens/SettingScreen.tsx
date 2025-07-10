import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Button,
  Linking,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../navigation/AuthContext";
import CustomButton from "../components/Button";
import api from "../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../components/BackButton";
import * as Location from "expo-location";
import CustomAlert from "../components/CustomAlert";
import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import Icon from "react-native-vector-icons/FontAwesome";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import * as IntentLauncher from 'expo-intent-launcher';

type Props = NativeStackScreenProps<any, "Settings">;

const SettingScreen: React.FC<Props> = ({ navigation }) => {
  const { signOut } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(false);
  const [visibility, setVisibility] = useState(true);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const handleLogout = () => {
    setShowLogoutAlert(true); // Show the custom alert
  };

  const confirmLogout = async () => {
    try {
      const response = await api.post("/api/v1/users/logout");
      console.log("Logout Response:", response.data);
      await AsyncStorage.clear();
      signOut();
      navigation.navigate("Login");
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      const response = await api.post("/api/v1/users/deactivate");
      console.log("Account Deactivated:", response.data);
      Alert.alert(
        "Account Deactivated",
        "Your account has been temporarily deactivated. You can reactivate it by logging in again."
      );
      await AsyncStorage.clear();
      signOut();
      navigation.navigate("Login");
    } catch (error) {
      console.error("Deactivation Error:", error);
      Alert.alert("Error", "Failed to deactivate account.");
    }
  };

  const handlePasswordChange = async () => {
    navigation.navigate("ChangePassword");
  }

  const handleLocation = async () => {
  try {
    if (Platform.OS === 'android') {
      IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
      );
    } else {
      Alert.alert(
        "Unsupported",
        "Please enable location from iOS settings manually."
      );
    }
  } catch (error) {
    console.error("Error opening location settings:", error);
    Alert.alert("Error", "Unable to open location settings.");
  }
};

  const handleEnableNotifications = async () => {
    if (Platform.OS === "android") {
      try {
        await Linking.openSettings(); // Opens your app's notification settings
      } catch (err) {
        console.error("Error opening settings:", err);
        Alert.alert("Error", "Could not open settings. Please try manually.");
      }
    } else {
      Alert.alert(
        "Unsupported",
        "Opening settings is only supported on Android."
      );
    }
  };

  const handleAccountOptions = async () => {
    Alert.alert(
      "Manage Account",
      "Would you like to delete your account permanently or deactivate it temporarily? Deactivating will hide your profile until you reactivate it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate Account",
          onPress: handleDeactivateAccount,
        },
        {
          text: "Delete Account",
          onPress: async () => {
            try {
              const response = await api.delete("/api/v1/users/deleteAccount");
              console.log("Account Deleted:", response.data);
              await AsyncStorage.clear();
              signOut();
              navigation.navigate("Login");
            } catch (error) {
              console.error("Delete Error:", error);
              Alert.alert("Error", "Failed to delete account.");
            }
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    navigation.setOptions({ title: "Settings" });
  }, [navigation]);

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title={"User Settings"} />

      <ScrollView style={styles.container}>
        <CustomAlert
          visible={showLogoutAlert}
          title="Confirm Logout"
          message="Are you sure you want to logout from your account?"
          onClose={() => setShowLogoutAlert(false)}
          onConfirm={confirmLogout}
          confirmText="Logout"
          cancelText="Cancel"
        />

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <View style={styles.optionRow}>
              <Feather
                name="edit-3"
                size={18}
                color="#de822c"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Edit Your Profile</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress = {handlePasswordChange} 
          style={styles.option}>
            <View style={styles.optionRow}>
              <Ionicons
                name="key-outline"
                size={18}
                color="#de822c"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Change Account Password</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <View style={styles.optionRow}>
              <Feather
                name="mail"
                size={18}
                color="#de822c"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Email Preferences</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              navigation.navigate("PhotoVerification");
            }}
          >
            <View style={styles.optionRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color="#de822c"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Verify your account</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <View style={styles.optionWithSwitch}>
            <View style={styles.optionRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color="#de822c"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Location Access</Text>
            </View>
            <TouchableOpacity
              onPress={handleLocation}
              style={styles.locationButton}
            >
              <Text style={styles.locationButtonText}>
                {location ? "Settings" : "Settings"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.optionWithSwitch}>
            <View style={styles.optionRow}>
              <Feather
                name="eye-off"
                size={18}
                color="#de822c"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Anonymous browsing</Text>
            </View>
            <Switch
              value={visibility}
              onValueChange={setVisibility}
              thumbColor={visibility ? "#de822c" : "#B0B0B0"}
              trackColor={{ false: "#555", true: "#de822c" }}
            />
          </View>

          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("BlockedUsersScreen")}
          >
            <View style={styles.optionRow}>
              <FontAwesome name="ban" size={20} color="#de822c" />
              <Text style={styles.optionText}>Blocked Users</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.optionWithSwitch}>
            <View style={styles.optionRow}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#de822c"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Push Notifications</Text>
            </View>
            <TouchableOpacity
              onPress={handleEnableNotifications}
              style={styles.locationButton}
            >
              <Text style={styles.locationButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>

          <TouchableOpacity style={styles.option}>
            <View style={styles.optionRow}>
              <Ionicons
                name="help-circle-outline"
                size={18}
                color="#de822c"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Help Center</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <View style={styles.optionRow}>
              <Ionicons
                name="bug-outline"
                size={18}
                color="#de822c"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Report a Problem</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout */}

        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleAccountOptions}
          >
            <View style={styles.optionRow}>
              <Ionicons
                name="trash-outline"
                size={20}
                color="white"
                style={styles.icon}
              />
              <Text style={styles.deleteText}>Delete Account</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.optionRow}>
              <Ionicons
                name="exit-outline"
                size={20}
                color="white"
                style={styles.icon}
              />
              <Text style={styles.logoutText}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    paddingHorizontal: 20,
  },
  backButtonContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  title: {
    fontSize: 19,
    fontWeight: "bold",
    color: "white",
    marginVertical: 30,
    marginLeft: 50,
  },
  section: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  option: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  optionText: {
    fontSize: 16,
    color: "#B0B0B0",
  },
  optionWithSwitch: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  logoutSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 30,
    marginBottom: 30,
    gap: 10,
  },

  logoutButton: {
    flex: 1,
    backgroundColor: "#d9534f",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#ff3e30",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // adds space between icon and text
  },

  icon: {
    width: 24,
    textAlign: "center",
  },

  logoutText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  deleteText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  locationButton: {
    backgroundColor: "#de822c",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  locationButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default SettingScreen;
