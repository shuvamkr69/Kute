import React, { use, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import PickerComponent from "../components/PickerComponent";
import Slider from "@react-native-community/slider";
import { TextInput } from "react-native";
import api from "../utils/api";
import { getUserId } from "../utils/constants";
import LoadingScreen from "./LoadingScreen";
import { premiumActive } from "../../backend/src/controllers/user.controller";
import BackButton from "../components/BackButton";

const relationshipOptions = [
  "Long Term",
  "Casual",
  "Hookup",
  "Marriage",
  "Any",
];
const genderOrientationOptions = [
  "Straight",
  "Lesbian",
  "Gay",
  "Bisexual",
  "Asexual",
  "Pansexual",
  "Queer",
];
const zodiacOptions = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
  "Any",
];
const workoutOptions = ["Daily", "Weekly", "Occasionally", "Never", "Any"];
const drinkingOptions = ["Socially", "Regularly", "Never", "Any"];
const smokingOptions = ["Socially", "Regularly", "Never", "Any"];
const familyPlanningOptions = [
  "Want Kids",
  "Dont Want Kids",
  "Undecided",
  "Any",
];
const interestOptions = [
  "Music",
  "Sports",
  "Travel",
  "Gaming",
  "Books",
  "Movies",
  "Tech",
  "Fitness",
  "Art",
  "Fashion",
  "Photography",
  "Cooking",
];
const personalityOptions = ["Extrovert", "Ambivert", "Introvert", "Any"];

const distanceSteps = [0, 200, 400, 600, 800, 1000];
function getNearestStep(value) {
  return distanceSteps.reduce((prev, curr) => Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
}

const AdvancedFilteringScreen = ({ navigation }) => {
  const [genderPreference, setGenderPreference] = useState("Everyone");
  const [relationshipType, setRelationshipType] = useState("");
  const [genderOrientation, setGenderOrientation] = useState("");
  const [distance, setDistance] = useState(0);
  const [location, setLocation] = useState("");
  const [verifiedUser, setVerifiedUser] = useState(false);
  const [personality, setPersonality] = useState<string>("Any");
  const [interests, setInterests] = useState<string[]>([]);
  const [workout, setWorkout] = useState<string>("");
  const [drinking, setDrinking] = useState<string>("");
  const [smoking, setSmoking] = useState<string>("");
  const [familyPlanning, setFamilyPlanning] = useState<string>("");
  const [zodiac, setZodiac] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sliderValue, setSliderValue] = useState(distance);

  // Example: Simulate boost active for demo
  useEffect(() => {
    // TODO: Replace with real boost logic
  }, []);

  useEffect(() => {
    // Fetch boostActiveUntil from backend
    const fetchBoost = async () => {
      try {
        const res = await api.get('/api/v1/users/me');
        const until = res.data.boostActiveUntil ? new Date(res.data.boostActiveUntil) : null;
      } catch (e) {
      }
    };
    fetchBoost();
  }, []);

  useEffect(() => {
    // Remove boostActive, boostTimeLeft, showBoostModal, boostActiveUntil logic
  }, []);

  const applyFilters = async () => {
    const userId = await getUserId(); // Replace with actual user ID from auth
    console.log("User ID:", userId);
    const filters = {
      userId: userId, // Replace with actual user ID from auth
      genderPreference,
      relationshipType,
      genderOrientation,
      distance,
      location,
      verifiedUser,
      personality,
      workout,
      drinking,
      smoking,
      familyPlanning,
      zodiac,
      interests,
    };

    try {
      const response = await api.post(
        "/api/v1/users/advanced-filters",
        filters
      );
      console.log("Filters Saved:", response.data);
      navigation.navigate("Home", { filters });
    } catch (error) {
      console.error("Request Failed:", error.response?.data || error.message);
    }
  };

  const getPremiumStatus = async () => {
    try {
      const PremiumStatus = await api.get("/api/v1/users/me");
      const { ActivePremiumPlan } = PremiumStatus.data;

      if (ActivePremiumPlan === "Diamond") {
        setIsPremium(true);
      } else if (ActivePremiumPlan === "Standard") {
        setIsPremium(true);
      } else if (ActivePremiumPlan === "Basic") {
        setIsPremium(true);
      } else {
        setIsPremium(false);
      }
      console.log("premium: " + PremiumStatus.data.ActivePremiumPlan);
      console.log("isPremium: " + isPremium);
    } catch (error) {
      console.error(
        "Failed to fetch premium status:",
        error.response?.data || error.message
      );
    }
  };

  // Fetching saved filters when the screen loads
  const fetchFilters = async () => {
    try {
      const userId = await getUserId(); // Replace with actual user ID from auth
      const response = await api.get(
        `/api/v1/users/advanced-filters/${userId}`
      ); // Replace with actual user ID from auth
      const savedFilters = response.data;
      setGenderPreference(savedFilters.genderPreference || "Everyone");
      setRelationshipType(savedFilters.relationshipType || "");
      setGenderOrientation(savedFilters.genderOrientation || "");
      setDistance(savedFilters.distance || 0);
      setLocation(savedFilters.location || "");
      setVerifiedUser(savedFilters.verifiedUser || false);
      setPersonality(savedFilters.personality || "");
      setWorkout(savedFilters.workout || "");
      setDrinking(savedFilters.drinking || "");
      setSmoking(savedFilters.smoking || "");
      setFamilyPlanning(savedFilters.familyPlanning || "");
      setZodiac(savedFilters.zodiac || "");
      setInterests(savedFilters.interests || []);
    } catch (error) {
      console.error(
        "Failed to fetch filters:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPremiumStatus();
    fetchFilters();
  }, []);

  const resetFilters = () => {
    setRelationshipType("Any");
    setGenderOrientation("Straight");
    setDistance(100);
    setVerifiedUser(false);
    setPersonality("Any");
    setWorkout("Any");
    setDrinking("Any");
    setSmoking("Any");
    setFamilyPlanning("Any");
    setZodiac("Any");
  };

  const FilterSwitch = ({ label, value, onValueChange }) => (
    <View style={styles.switchContainer}>
      <Text style={{ color: "#fff" }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#555", true: "#de822c" }}
        thumbColor={value ? "#fff" : "#ccc"}
      />
    </View>
  );
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title="Discover" />
      <SafeAreaView style={styles.container}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', backgroundColor: 'black' }}>
            <Image
              source={require("../assets/icons/logo.webp")}
              style={{ width: 160, height: 160 }}
              resizeMode="contain"
            />
          </View>
          {/* Verified User in its own box */}
          <View style={styles.sectionContainer}>
            <FilterSwitch
              label={<View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="checkmark-done-circle-outline" size={20} color="#de822c" style={{ marginRight: 7 }} /><Text style={{ color: '#fff' }}>Verified User</Text></View>}
              value={verifiedUser}
              onValueChange={setVerifiedUser}
            />
          </View>
          {/* All other pickers in one box */}
          <View style={styles.sectionContainer}>
            <PickerComponent
              label="Personality"
              icon={<Ionicons name="happy-outline" size={20} color="#de822c" />}
              selectedValue={personality}
              options={personalityOptions}
              onValueChange={setPersonality}
            />
            <PickerComponent
              label="Workout"
              icon={<Ionicons name="barbell-outline" size={20} color="#de822c" />}
              selectedValue={workout}
              options={workoutOptions}
              onValueChange={setWorkout}
            />
            <PickerComponent
              label="Drinking"
              icon={<Ionicons name="wine-outline" size={20} color="#de822c" />}
              selectedValue={drinking}
              options={drinkingOptions}
              onValueChange={setDrinking}
            />
            <PickerComponent
              label="Smoking"
              icon={<Ionicons name="cafe-outline" size={20} color="#de822c" />}
              selectedValue={smoking}
              options={smokingOptions}
              onValueChange={setSmoking}
            />
            <PickerComponent
              label="Family Planning"
              icon={<Ionicons name="people-outline" size={20} color="#de822c" />}
              selectedValue={familyPlanning}
              options={familyPlanningOptions}
              onValueChange={setFamilyPlanning}
            />
            <PickerComponent
              label="Zodiac Sign"
              icon={<Ionicons name="star-outline" size={20} color="#de822c" />}
              selectedValue={zodiac}
              options={zodiacOptions}
              onValueChange={setZodiac}
            />
            <PickerComponent
              label="Relationship Type"
              icon={<Ionicons name="heart-outline" size={20} color="#de822c" />}
              selectedValue={relationshipType}
              options={relationshipOptions}
              onValueChange={setRelationshipType}
            />
            <PickerComponent
              label="Gender Orientation"
              icon={<Ionicons name="male-female-outline" size={20} color="#de822c" />}
              selectedValue={genderOrientation}
              options={genderOrientationOptions}
              onValueChange={setGenderOrientation}
            />
          </View>
          {/* Distance in its own box */}
          <View style={styles.sectionContainer}>
            <View style={styles.sliderBox}>
              <Text style={styles.sliderLabel}>Distance</Text>
              <View style={{ position: 'relative', width: '100%' }}>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={0}
                  maximumValue={1000}
                  step={1}
                  value={getNearestStep(sliderValue)}
                  onValueChange={val => {
                    const snapped = getNearestStep(val);
                    setSliderValue(snapped);
                  }}
                  onSlidingComplete={val => {
                    const snapped = getNearestStep(val);
                    setSliderValue(snapped);
                    setDistance(snapped);
                  }}
                  minimumTrackTintColor="#de822c"
                  maximumTrackTintColor="#fff"
                  thumbTintColor="#de822c"
                />
                {/* Tick lines absolutely positioned over the slider */}
                <View style={{ position: 'absolute', left: 0, right: 0, top: 18, height: 16, flexDirection: 'row', justifyContent: 'space-between', pointerEvents: 'none' }}>
                  {distanceSteps.map((step, idx) => (
                    <View key={step} style={{ alignItems: 'center', width: idx === 0 || idx === distanceSteps.length-1 ? 30 : 40 }}>
                      <View style={{ width: 2, height: 16, backgroundColor: '#de822c' }} />
                    </View>
                  ))}
                </View>
                {/* Labels below the slider */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 18, alignItems: 'flex-start' }}>
                  {distanceSteps.map((step, idx) => (
                    <View key={step} style={{ alignItems: 'center', width: idx === 0 || idx === distanceSteps.length-1 ? 30 : 40 }}>
                      <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>{step}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={styles.sliderValue}>{getNearestStep(sliderValue)} km</Text>
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
              <Text style={styles.applyButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={applyFilters} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  header: {
    fontSize: 19,
    color: "white",
    marginBottom: 25,
    marginLeft: 10,
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#de822c",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#ff1212",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#1E1E1E",
    color: "#FFF",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },

  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionContainer: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 30,
    marginBottom: 30,
  },
  sliderBox: {
    backgroundColor: '#232323',
    borderRadius: 15,
    padding: 18,
    marginBottom: 18,
    marginTop: 10,
    alignItems: 'center',
  },
  sliderLabel: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  sliderValue: {
    color: '#de822c',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
  },
});

export default AdvancedFilteringScreen;
