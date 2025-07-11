import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  ToastAndroid,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/FontAwesome";
import CustomButton from "../components/Button";
import PickerComponent from "../components/PickerComponent";
import api from "../utils/api";
import Toast from "react-native-toast-message";
import BackButton from "../components/BackButton";
import * as ImagePicker from "expo-image-picker";
import { Dimensions } from "react-native";
import { profile } from "../../assets/images";
import LoadingScreen from "./LoadingScreen";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

const screenWidth = Dimensions.get("window").width;
const itemSize = (screenWidth - 60) / 3; // 20 padding on both sides + 10 gap between items

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
const relationshipOptions = ["Long Term", "Casual", "Hookup", "Marriage", ""];
const Options = ["Men", "Women", "Others"];
const pronounsOptions = ["He/Him", "She/Her", "They/Them"];
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
];
const familyPlanningOptions = ["Want Kids", "Don't Want Kids", "Undecided"];
const bodyTypeOptions = ["Muscular", "Average", "Obese", "Athletic", "Slim"];
const drinkingOptions = ["Socially", "Regularly", "Never"];
const smokingOptions = ["Socially", "Regularly", "Never"];
const workoutOptions = ["Daily", "Weekly", "Occasionally", "Never"];
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

// Add this RIGHT BEFORE your EditProfileScreen component definition
// (after all the imports but before const EditProfileScreen: React.FC<Props> = ...)

const DraggablePhoto = ({
  photoUri,
  index,
  onRemove,
  onDragEnd,
  isDragging,
  setDraggingIndex,
  onAddPhoto,
}: {
  photoUri: string | null;
  index: number;
  onRemove: (index: number) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  isDragging: boolean;
  setDraggingIndex: (index: number | null) => void;
  onAddPhoto: () => void;
}) => {
  const position = useSharedValue({ x: 0, y: 0 });
  const isActive = useSharedValue(false);
  const scale = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      isActive.value = true;
      scale.value = 1.1;
      runOnJS(setDraggingIndex)(index);
    },
    onActive: (event) => {
      position.value = {
        x: event.translationX,
        y: event.translationY,
      };
    },
    onEnd: (event) => {
      isActive.value = false;
      scale.value = 1;
      position.value = { x: 0, y: 0 };
      // Calculate which item we're hovering over
      const dropIndex = Math.floor(event.absoluteX / itemSize);
      if (dropIndex >= 0 && dropIndex < 6 && dropIndex !== index) {
        runOnJS(onDragEnd)(index, dropIndex);
      }
      runOnJS(setDraggingIndex)(null);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: position.value.x },
        { translateY: position.value.y },
        { scale: scale.value },
      ],
      zIndex: isActive.value ? 100 : 1,
      opacity: isDragging ? 0.5 : 1,
    };
  });

  if (!photoUri) {
    return (
      <TouchableOpacity onPress={onAddPhoto} style={styles.gridItem}>
        <Icon name="plus" size={30} color="#de822c" />
      </TouchableOpacity>
    );
  }

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.gridItem, animatedStyle]}>
        <Image source={{ uri: photoUri }} style={styles.profileImage} />
        <TouchableOpacity
          style={styles.removeIcon}
          onPress={() => onRemove(index)}
        >
          <Icon name="times" size={16} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

type Props = NativeStackScreenProps<any, "EditProfile">;

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [bio, setBio] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [religion, setReligion] = useState("");

  // Replace profilePhoto state with an array
  const [profilePhotos, setProfilePhotos] = useState<string[]>([]);

  const [height, setHeight] = useState<string>("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "feet">("cm");
  const [occupation, setOccupation] = useState("");
  const [workingAt, setWorkingAt] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [genderOrientation, setGenderOrientation] = useState("");
  const [languages, setLanguages] = useState("");
  const [loveLanguage, setloveLanguage] = useState("");
  const [zodiac, setzodiac] = useState("");
  const [familyPlanning, setFamilyPlanning] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [smoking, setSmoking] = useState("");
  const [drinking, setDrinking] = useState("");
  const [workout, setWorkout] = useState("");

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // ✅ Load profile data from API or AsyncStorage
  const profileFetcher = async () => {
    try {
      const response = await api.get("/api/v1/users/me");
      const profileData = response.data;

      const avatars = []; //fetching all photos
      for (let i = 1; i <= 6; i++) {
        const avatar = profileData[`avatar${i}`];
        if (avatar) avatars.push(avatar);
      }

      setProfilePhotos(avatars);
      setRelationshipType(profileData.relationshipType);
      setSelectedInterests(
        Array.isArray(profileData.interests) ? profileData.interests : []
      );
      setBio(profileData.bio || "");
      setOccupation(profileData.occupation || "");
      setHeight(profileData.height?.split(" ")[0] || "");
      setWorkingAt(profileData.workingAt || "");
      setPronouns(profileData.pronouns || "");
      setGenderOrientation(profileData.genderOrientation || "");
      setLanguages(profileData.languages || "");
      setloveLanguage(profileData.loveLanguage || "");
      setzodiac(profileData.zodiac || "");
      setFamilyPlanning(profileData.familyPlanning || "");
      setBodyType(profileData.bodyType || "");
      setSmoking(profileData.smoking || "");
      setDrinking(profileData.drinking || "");
      setWorkout(profileData.workout || "");
      setReligion(profileData.religion || "");

      await AsyncStorage.setItem("profileData", JSON.stringify(profileData));
    } catch (error) {
      console.log("Error fetching profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await api.get("/api/v1/users/me");
      console.log("Fetched interests:", res.data.interests);
      setSelectedInterests(
        Array.isArray(res.data.interests)
          ? res.data.interests
          : res.data.interests.split(",").map((item) => item.trim())
      );
    };

    fetchProfile();
  }, []);

  // Add this function RIGHT AFTER your profileFetcher function
  // (inside the EditProfileScreen component)
  const handleDragEnd = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newPhotos = [...profilePhotos];
    const temp = newPhotos[fromIndex];
    newPhotos[fromIndex] = newPhotos[toIndex];
    newPhotos[toIndex] = temp;

    setProfilePhotos(newPhotos);
  };

  const handleAddPhoto = async () => {
    const validPhotos = profilePhotos.filter(
      (photo) => photo && photo !== "null"
    );
    if (validPhotos.length >= 6) {
      Alert.alert("Limit Reached", "You can upload a maximum of 6 photos.");
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "Please grant access to your gallery.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const newPhotos = [...profilePhotos];
      const emptyIndex = newPhotos.findIndex((photo) => !photo);
      if (emptyIndex !== -1) {
        newPhotos[emptyIndex] = result.assets[0].uri;
      } else {
        newPhotos.push(result.assets[0].uri);
      }
      setProfilePhotos(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    setProfilePhotos((prev) => {
      const updatedPhotos = [...prev];
      updatedPhotos[index] = null; // Mark the photo as null
      return updatedPhotos;
    });
    console.log("Photo removed. Updated photos:", profilePhotos);
  };

  useEffect(() => {
    profileFetcher();
  }, []);

  // ✅ PATCH request to update profile
  const updateProfile = async () => {
    if (bio.trim() === "") {
      Alert.alert("Error", "Bio cannot be empty");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("relationshipType", relationshipType);
      formData.append("bio", bio);
      formData.append("occupation", occupation);
      formData.append("workingAt", workingAt);
      formData.append("height", height);
      formData.append("pronouns", pronouns);
      formData.append("interests", JSON.stringify(selectedInterests)); // Convert to JSON string
      formData.append("genderOrientation", genderOrientation);
      formData.append("languages", languages);
      formData.append("loveLanguage", loveLanguage);
      formData.append("zodiac", zodiac);
      formData.append("familyPlanning", familyPlanning);
      formData.append("bodyType", bodyType);
      formData.append("smoking", smoking);
      formData.append("drinking", drinking);
      formData.append("workout", workout);
      formData.append("religion", religion);

      // ✅ Append images using FormData (handling both URLs and file URIs)
      profilePhotos.forEach((photoUri: string | null, index: number) => {
        if (photoUri === null || photoUri === "") {
          // Append "null" for removed images
          formData.append(`avatar${index + 1}`, "null");
        } else if (photoUri.startsWith("http")) {
          // Append existing image URLs
          formData.append(`avatar${index + 1}`, photoUri);
        } else {
          // Append new images (converted to FormData object)
          formData.append(`avatar${index + 1}`, {
            uri: photoUri,
            name: `avatar${index + 1}.jpg`,
            type: "image/jpeg",
          } as any);
        }
      });

      console.log(profilePhotos);

      const hasAtLeastOnePhoto = profilePhotos.some(
        (photoUri) => photoUri && photoUri !== "null"
      );

      if (!hasAtLeastOnePhoto) {
        Alert.alert(
          "Error",
          "You must have at least one photo on your profile."
        );
        return;
      }

      console.log(formData);

      await api.patch("/api/v1/users/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      ToastAndroid.show("Profile Updated Successfully!", ToastAndroid.SHORT);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Could not update profile");
      console.error("Error updating profile:", error);
    }
  };

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

  if (loading) {
    return <LoadingScreen description="Fetching your profile" />;
  }

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title={"Edit your profile"} />
      <FlatList
        style={styles.container}
        data={[1]} // Using single item array as container
        keyExtractor={() => "editProfile"}
        renderItem={() => (
          <>
            <View style={styles.profileContainer}>
              <View style={styles.gridContainer}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <DraggablePhoto
                    key={index}
                    photoUri={profilePhotos[index]}
                    index={index}
                    onRemove={removePhoto}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingIndex === index}
                    setDraggingIndex={setDraggingIndex}
                    onAddPhoto={handleAddPhoto}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <TouchableOpacity onPress={() => setShowInterestModal(true)}>
                <Icon name="pencil" size={20} color="#de822c" />
                <View style={styles.tagsContainer}>
                  {selectedInterests.map((item, index) => {
                    // Split comma-separated string if needed (as fallback)
                    const interests =
                      typeof item === "string" ? item.split(",") : [item];
                    return interests.map((interest, idx) => (
                      <TouchableOpacity
                        key={`${index}-${idx}`}
                        style={styles.tag}
                        onPress={() => selectInterest(interest.trim())}
                      >
                        <Text style={styles.tagText}>{interest.trim()}</Text>
                      </TouchableOpacity>
                    ));
                  })}
                  {selectedInterests.length === 0 && (
                    <Text style={{ color: "#B0B0B0", paddingLeft: 10 }}>
                      Your interests
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              <Modal
                visible={showInterestModal}
                transparent
                animationType="fade"
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <FlatList
                      data={interestOptions}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => selectInterest(item)}
                          style={styles.interestOption}
                        >
                          <Text
                            style={[
                              styles.interestText,
                              selectedInterests.includes(item) &&
                                styles.selectedInterest,
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                    <TouchableOpacity
                      onPress={() => setShowInterestModal(false)}
                      style={styles.confirmButton}
                    >
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              <Text style={styles.label}>About me</Text>
              <View style={styles.bioInputContainer}>
                <TextInput
                  style={styles.bioInput}
                  placeholder="Describe yourself"
                  placeholderTextColor="#B0B0B0"
                  value={bio}
                  onChangeText={(text) => {
                    if (text.length <= 500) {
                      setBio(text);
                    }
                  }}
                  multiline
                />
              </View>
              <Text
                style={[
                  styles.charCounter,
                  bio.length === 500 && styles.charLimitReached,
                ]}
              >
                {bio.length}/500
              </Text>

              <Text style={styles.label}>Height</Text>
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Height in cm"
                  placeholderTextColor="#B0B0B0"
                  value={height}
                  onChangeText={(text) => {
                    if (/^\d*$/.test(text)) {
                      setHeight(text);
                    }
                  }}
                  keyboardType="numeric"
                />
              </View>

              <Text style={[styles.sectionTitle, {marginTop: 20, marginBottom: 10}]}>Important</Text>

              <PickerComponent
                label="Occupation"
                selectedValue={occupation}
                options={occupationOptions}
                onValueChange={setOccupation}
              />

              <PickerComponent
                label="Love Language"
                selectedValue={loveLanguage}
                options={loveLanguageOptions}
                onValueChange={setloveLanguage}
              />

              <Text style={styles.label}>Working At / Student At</Text>
              <TextInput
                style={styles.input}
                placeholder="Where do you work or study?"
                placeholderTextColor="#B0B0B0"
                value={workingAt}
                onChangeText={setWorkingAt}
              />

              <PickerComponent
                label="Relationship Type"
                selectedValue={relationshipType}
                options={relationshipOptions}
                onValueChange={setRelationshipType}
              />

              <PickerComponent
                label="Pronouns"
                selectedValue={pronouns}
                options={pronounsOptions}
                onValueChange={setPronouns}
              />

              <PickerComponent
                label="Gender Orientation"
                selectedValue={genderOrientation}
                options={genderOrientationOptions}
                onValueChange={setGenderOrientation}
              />

              <PickerComponent
                label="Planet Sign"
                selectedValue={zodiac}
                options={zodiacOptions}
                onValueChange={setzodiac}
              />
              <PickerComponent
                label="Religion"
                selectedValue={religion}
                options={religionOptions}
                onValueChange={setReligion}
              />

              <PickerComponent
                label="Family Planning"
                selectedValue={familyPlanning}
                options={familyPlanningOptions}
                onValueChange={setFamilyPlanning}
              />

              <PickerComponent
                label="Body Type"
                selectedValue={bodyType}
                options={bodyTypeOptions}
                onValueChange={setBodyType}
              />

              <PickerComponent
                label="Workout"
                selectedValue={workout}
                options={workoutOptions}
                onValueChange={setWorkout}
              />

              <PickerComponent
                label="Smoking"
                selectedValue={smoking}
                options={smokingOptions}
                onValueChange={setSmoking}
              />
              <PickerComponent
                label="Drinking"
                selectedValue={drinking}
                options={drinkingOptions}
                onValueChange={setDrinking}
              />
            </View>

            <CustomButton
              title="Save Changes"
              onPress={updateProfile}
              style={styles.updateButton}
            />
          </>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContainer: {
    flex: 1,
    backgroundColor: "black",
  },

  bioInputContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingTop: 15, // Add padding at top
    borderWidth: 1,
    borderColor: "black",
    width: "100%",
    minHeight: 150, // Use minHeight instead of fixed height
  },
  bioInput: {
    flex: 1,
    color: "white",
    backgroundColor: "transparent",
    textAlignVertical: "top", // This makes text start from top
    paddingTop: 0,
  },

  input: {
    flex: 1,
    height: 50,
    color: "white",
    paddingLeft: 10,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
  },
  charCounter: {
    alignSelf: "flex-end",
    color: "#B0B0B0",
    fontSize: 12,
    marginBottom: 10,
    marginRight: 5,
    marginTop: 3,
  },
  charLimitReached: {
    color: "#ff5555",
    fontWeight: "bold",
    marginTop: 3,
    marginRight: 5,
  },
  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 10,
  },

  profileContainer: {
    alignItems: "center",
  },
  section: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "121212",
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  gridItem: {
    width: (Dimensions.get("window").width - 60) / 3.2,
    height: (Dimensions.get("window").width - 60) / 2.5,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    margin: 5,
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  removeIcon: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    padding: 5,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 10,
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
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },

  interestOption: {
    padding: 15,
    alignItems: "center",
  },

  interestText: {
    color: "#FFF",
  },

  selectedInterest: {
    color: "#de822c",
    fontWeight: "bold",
  },

  confirmButton: {
    backgroundColor: "#de822c",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  confirmButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },

  updateButton: {
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: "#de822c",
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: -15,
    height: 30,
    width: 30,
    alignContent: "center",
    justifyContent: "center",
  },
  label: {
    color: "#de822c",
    fontSize: 16,
    marginBottom: 10,
    marginTop: 30,
  },
  sectionTitle: {
    color: "#de822c",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default EditProfileScreen;
