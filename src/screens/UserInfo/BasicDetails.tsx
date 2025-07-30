import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
  FlatList,
  ToastAndroid,
  Dimensions,
} from "react-native";
import CustomAlert from "../../components/CustomAlert";
import Icon from "react-native-vector-icons/FontAwesome";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import PickerComponent from "../../components/PickerComponent";
import BackButton from "../../components/BackButton";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

const { width } = Dimensions.get('window');

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

type Props = NativeStackScreenProps<any, "BasicDetails">;

const BasicDetails: React.FC<Props> = ({ navigation }) => {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [personality, setPersonality] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [relationshipType, setRelationshipType] = useState("");
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [genderOrientation, setGenderOrientation] = useState("");
  const [religion, setReligion] = useState("");
  const [occupation, setOccupation] = useState("");
  const [loveLanguage, setloveLanguage] = useState("");
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });

  // Load existing temp data on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const tempUserData = await AsyncStorage.getItem("tempUserData");
        if (tempUserData) {
          const userData = JSON.parse(tempUserData);
          console.log("📋 BasicDetails loaded existing temp data:", {
            fullName: userData.fullName,
            email: userData.email,
            loginMethod: userData.loginMethod || 'email',
            hasAvatar: !!userData.avatar,
            hasGoogleToken: !!userData.googleToken
          });
        }
      } catch (error) {
        console.error("❌ Error loading temp data in BasicDetails:", error);
      }
    };
    
    loadExistingData();
  }, []);

  const genderOptions = ["Male", "Female", "Other"];
  const personalityType = ["Introvert", "Ambivert", "Extrovert"];
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
  const relationshipOptions = ["Long Term", "Casual", "Hookup", "Marriage", "Not Set"];
  const genderOrientationOptions = [
    "Straight",
    "Gay",
    "Lesbian",
    "Bisexual",
    "Asexual",
    "Pansexual",
    "Queer",
  ];

  const religionOptions = [
    "Hinduism",
    "Christianity",
    "Buddhism",
    "Judaism",
    "Agnosticism",
    "Jainism",
    "Sikhism",
    "Islam",
    "Atheism",
    "Spiritual but not religious",
    "Paganism",
    "Taoism",
    "Confucianism",
    "Scientology",
    "Zoroastrianism",
    "New Age",
    "Prefer not to say",
    "Other",
  ];

  const loveLanguageOptions = [
    'Compliments',
    'Thoughtful Gestures',
    'Time Together',
    'Exchanging Presents',
    'Physical Touch',
    'Deep Conversations',
  ];
  const occupationOptions = [
    'Student',
    'Job',
    'Retired',
    'Unemployed',
  ];

  const selectInterest = (item: string) => {
    setSelectedInterests((prev) => {
      // Check if the interest is already selected
      if (prev.includes(item)) {
        return prev.filter((interest) => interest !== item);
      }

      // Prevent duplicates and limit to a maximum of 7 interests
      if (prev.length < 7) {
        return [...prev, item];
      } else {
        ToastAndroid.show(
          "You can select up to 7 interests only!",
          ToastAndroid.SHORT
        );
        return prev;
      }
    });
  };

  const removeInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.filter((interest) => interest !== item)
    );
  };

  const detailHandler = async () => {
    try {
      const tempUserData = await AsyncStorage.getItem("tempUserData");
      if (!tempUserData) {
        setCustomAlert({ visible: true, title: "Error", message: "No temporary data found" });
        return;
      }

      if (!age.trim()) {
        setCustomAlert({ visible: true, title: "Error", message: "Age is required" });
        return;
      }
      if (!gender.trim()) {
        setCustomAlert({ visible: true, title: "Error", message: "Gender is required" });
        return;
      }
      if (!personality.trim()) {
        setCustomAlert({ visible: true, title: "Error", message: "Personality type is required" });
        return;
      }
      if (selectedInterests.length === 0) {
        setCustomAlert({ visible: true, title: "Error", message: "At least one interest is required" });
        return;
      }
      if (!relationshipType.trim()) {
        setCustomAlert({ visible: true, title: "Error", message: "Relationship type is required" });
        return;
      }
      if (!genderOrientation.trim()) {
        setCustomAlert({ visible: true, title: "Error", message: "Gender orientation is required" });
        return;
      }
      if (!religion.trim()) {
        setCustomAlert({ visible: true, title: "Error", message: "Religion is required" });
        return;
      }

      const userData = JSON.parse(tempUserData);
      userData.age = parseInt(age.trim());
      userData.gender = gender.trim();
      userData.personality = personality.trim();
      userData.interests = selectedInterests;
      userData.relationshipType = relationshipType.trim();
      userData.genderOrientation = genderOrientation.trim();
      userData.religion = religion.trim();
      userData.occupation = occupation.trim();
      userData.loveLanguage = loveLanguage.trim();

      await AsyncStorage.setItem("tempUserData", JSON.stringify(userData));

      navigation.navigate("Location");
    } catch (error) {
      setCustomAlert({ visible: true, title: "Error", message: "There is a problem with the server" });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackButton title={"Tell us about yourself"} />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>About You</Text>
          <Text style={styles.headerSubtitle}>
            Help us understand who you are and what you're looking for
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.ageInputContainer}>
            <View style={styles.inputIconContainer}>
              <GradientIcon name="calendar-outline" size={20} />
            </View>
            <TextInput
              style={styles.ageInput}
              placeholder="Enter your age"
              placeholderTextColor="#888"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          <PickerComponent
            label="Gender"
            selectedValue={gender}
            options={genderOptions}
            onValueChange={setGender}
            icon={<GradientIcon name="person-outline" size={20} />}
          />

          <PickerComponent
            label="Gender Orientation"
            selectedValue={genderOrientation}
            options={genderOrientationOptions}
            onValueChange={setGenderOrientation}
            icon={<GradientIcon name="male-female-outline" size={20} />}
          />

          <PickerComponent
            label="Personality Type"
            selectedValue={personality}
            options={personalityType}
            onValueChange={setPersonality}
            icon={<GradientIcon name="happy-outline" size={20} />}
          />

          <PickerComponent
            label="Religion"
            selectedValue={religion}
            options={religionOptions}
            onValueChange={setReligion}
            icon={<GradientIcon name="leaf-outline" size={20} />}
          />

          <PickerComponent
            label="Occupation"
            selectedValue={occupation}
            options={occupationOptions}
            onValueChange={setOccupation}
            icon={<GradientIcon name="briefcase-outline" size={20} />}
          />

          <PickerComponent
            label="Love Language"
            selectedValue={loveLanguage}
            options={loveLanguageOptions}
            onValueChange={setloveLanguage}
            icon={<GradientIcon name="heart-circle-outline" size={20} />}
          />

          <View style={styles.interestsSection}>
            <Text style={styles.sectionLabel}>Interests</Text>
            <TouchableOpacity
              style={styles.interestsContainer}
              onPress={() => setShowInterestModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.interestsContent}>
                {selectedInterests.length === 0 ? (
                  <Text style={styles.placeholderText}>Select your interests</Text>
                ) : (
                  <View style={styles.tagsContainer}>
                    {selectedInterests.map((item, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <GradientIcon name="chevron-forward" size={20} />
            </TouchableOpacity>
          </View>

          <PickerComponent
            label="Relationship Type"
            selectedValue={relationshipType}
            options={relationshipOptions}
            onValueChange={setRelationshipType}
            icon={<GradientIcon name="heart-outline" size={20} />}
          />
        </View>

        <Modal visible={showInterestModal} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.pickerModalContent}>
              <Text style={styles.pickerModalLabel}>Select Interests</Text>
              <View style={styles.bubbleContainer}>
                {interestOptions.map((item) => {
                  const isSelected = selectedInterests.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={styles.bubbleTouchable}
                      onPress={() => selectInterest(item)}
                      activeOpacity={0.9}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={["#ff172e", "#de822c"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.bubble}
                        >
                          <Text style={[styles.bubbleText, { color: "#fff" }]}>{item}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={[styles.bubble, styles.bubbleUnselected]}>
                          <Text style={[styles.bubbleText, { color: "#B0B0B0" }]}>{item}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                onPress={() => setShowInterestModal(false)}
                style={styles.confirmButton}
                activeOpacity={0.9}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={detailHandler}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#de822c", "#ff172e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
      
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#de822c',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#A1A7B3',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formSection: {
    gap: 18,
  },
  ageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#23262F',
    paddingHorizontal: 15,
    paddingVertical: 18,
  },
  inputIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 15,
  },
  ageInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  interestsSection: {
    marginVertical: 10,
  },
  sectionLabel: {
    color: '#de822c',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#23262F',
    paddingHorizontal: 15,
    paddingVertical: 18,
    justifyContent: 'space-between',
  },
  interestsContent: {
    flex: 1,
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#de822c",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModalContent: {
    backgroundColor: "#23262F",
    borderRadius: 18,
    padding: 24,
    minWidth: 260,
    maxWidth: 340,
    alignItems: "center",
  },
  pickerModalLabel: {
    color: "#de822c",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 18,
  },
  bubbleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 18,
  },
  bubbleTouchable: {
    marginRight: 8,
    marginBottom: 8,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleUnselected: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#444",
  },
  bubbleText: {
    fontWeight: "bold",
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: "#de822c",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 30,
    marginHorizontal: 20,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  continueButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 17,
    marginRight: 8,
  },
});

export default BasicDetails;
