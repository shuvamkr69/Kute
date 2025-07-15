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
  Image,
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
import * as IntentLauncher from "expo-intent-launcher";
import { Video, ResizeMode } from 'expo-av';

type Props = NativeStackScreenProps<any, "Settings">;

const SettingScreen: React.FC<Props> = ({ navigation }) => {
  const { signOut } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const [isPremium, setIsPremium] = useState(false);
  const [visibility, setVisibility] = useState(false);
  const [loadingAnon, setLoadingAnon] = useState(false);
  const DARK_MODE_KEY = 'darkMode';
  const [showMeme, setShowMeme] = useState(false);
  const [memeVideo, setMemeVideo] = useState<any>(null); // Use any for require()
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{address: string, latitude: number, longitude: number} | null>(null);

  const fetchUserStatus = async () => {
    try {
      const response = await api.get("/api/v1/users/me");
      setIsPremium(!!response.data.ActivePremiumPlan);
      setVisibility(!!response.data.anonymousBrowsing);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAnonymous = async () => {
    if (!isPremium) {
      Alert.alert(
        "Premium Required",
        "Anonymous browsing is available only for premium users."
      );
      return;
    }

    try {
      setLoadingAnon(true);
      const response = await api.post("/api/v1/users/toggle-anonymous");
      setVisibility(response.data.data.anonymousBrowsing);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update anonymous browsing setting.");
    } finally {
      setLoadingAnon(false);
    }
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
  };

  const handleLocation = async () => {
    try {
      if (Platform.OS === "android") {
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

  // Fetch and set current location (address) with confirmation and backend update
  const handleSetCurrentLocation = async () => {
    setLoadingCurrentLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to fetch your location.");
        setLoadingCurrentLocation(false);
        return;
      }
      const locationObj = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = locationObj.coords;
      const addressArr = await Location.reverseGeocodeAsync({ latitude, longitude });
      let addr = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      if (addressArr && addressArr.length > 0) {
        const item = addressArr[0];
        addr = `${item.name ? item.name + ', ' : ''}${item.street ? item.street + ', ' : ''}${item.city ? item.city + ', ' : ''}${item.region ? item.region + ', ' : ''}${item.country ? item.country : ''}`;
      }
      setPendingLocation({ address: addr, latitude, longitude });
      setShowLocationConfirm(true);
    } catch (error) {
      Alert.alert('Location Error', 'Unable to fetch location');
      console.error(error);
      setLoadingCurrentLocation(false);
    }
  };

  // Confirm and update location in backend
  const confirmSetLocation = async () => {
    if (!pendingLocation) return;
    setShowLocationConfirm(false);
    setLoadingCurrentLocation(true);
    try {
      // Update backend
      await api.post('/api/v1/users/updateLocation', {
        address: pendingLocation.address,
        lat: pendingLocation.latitude,
        lng: pendingLocation.longitude,
      });
      setCurrentLocation(pendingLocation.address);
      Toast.show({ type: 'success', text1: 'Location updated!' });
    } catch (error) {
      Alert.alert('Error', 'Failed to update location in backend.');
      console.error(error);
    } finally {
      setLoadingCurrentLocation(false);
      setPendingLocation(null);
    }
  };

  const cancelSetLocation = () => {
    setShowLocationConfirm(false);
    setPendingLocation(null);
    setLoadingCurrentLocation(false);
  };

  React.useEffect(() => {
    navigation.setOptions({ title: "Settings" });
    fetchUserStatus();
  }, [navigation]);

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title={"User Settings"} />
      <ScrollView style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/icons/logo.webp")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
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

          <TouchableOpacity
            onPress={handlePasswordChange}
            style={styles.option}
          >
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

          {/* New: Set Current Location */}
          <View style={[styles.optionWithSwitch, { marginBottom: 18, marginTop: 8 }]}> {/* Add spacing */}
            <View style={styles.optionRow}>
              <Ionicons
                name="map-outline"
                size={18}
                color="#de822c"
                style={styles.icon}
              />
              <Text style={styles.optionText}>Set your current location</Text>
            </View>
            <TouchableOpacity
              onPress={handleSetCurrentLocation}
              style={styles.locationButton}
              disabled={loadingCurrentLocation}
            >
              <Text style={styles.locationButtonText}>
                {loadingCurrentLocation ? "Setting..." : "Set"}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Show the current location address below the row */}
          {currentLocation ? (
            <View style={styles.currentLocationBox}>
              <Text style={styles.currentLocationLabel}>Current Location:</Text>
              <Text style={styles.currentLocationText}>{currentLocation}</Text>
            </View>
          ) : null}
          <CustomAlert
            visible={showLocationConfirm}
            title="Set Current Location"
            message={pendingLocation ? (
              <Text>
                Set your current location to:{"\n"}
                <Text style={{color:'#de822c'}}>{pendingLocation.address}</Text>
              </Text>
            ) : <Text />}
            onClose={cancelSetLocation}
            onConfirm={confirmSetLocation}
            confirmText="Yes, Set Location"
            cancelText="Cancel"
          />

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
              onValueChange={handleToggleAnonymous}
              thumbColor={visibility ? "#de822c" : "#B0B0B0"}
              trackColor={{ false: "#555", true: "#de822c" }}
              disabled={!isPremium || loadingAnon}
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

          <TouchableOpacity
            onPress={() => {
              navigation.navigate("HelpScreen");
            }}
            style={styles.option}
          >
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

          <TouchableOpacity
            onPress={() => {
              navigation.navigate("HelpScreen");
            }}
            style={styles.option}
          >
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

          <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
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
      {/* Fullscreen Meme Video Overlay */}
      {showMeme && memeVideo && (
        <View style={styles.fullscreenOverlay}>
          <Video
            source={memeVideo}
            style={styles.fullscreenVideo}
            resizeMode={ResizeMode.COVER}
            isLooping={false}
            shouldPlay
            isMuted
            onPlaybackStatusUpdate={status => {
              if (status.isLoaded && status.didJustFinish) setShowMeme(false);
            }}
          />
        </View>
      )}
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
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 160,
    height: 160,
  },
  fullscreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  currentLocationBox: {
    backgroundColor: '#23242a',
    borderRadius: 8,
    padding: 14,
    marginTop: 0,
    marginBottom: 18,
    marginLeft: 36,
    marginRight: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  currentLocationLabel: {
    color: '#de822c',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
    textAlign: 'left',
  },
  currentLocationText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'left',
    fontWeight: '500',
  },
});

export default SettingScreen;
