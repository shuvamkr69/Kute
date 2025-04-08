import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
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
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import PickerComponent from "../../components/PickerComponent";
import BackButton from "../../components/BackButton";
import { Ionicons } from "@expo/vector-icons";

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
  const relationshipOptions = ["Long Term", "Casual", "Hookup", "Marriage"];
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

  const selectInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.includes(item)
        ? prev.filter((interest) => interest !== item)
        : prev.length < 7
        ? [...prev, item]
        : prev
    );
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
        Alert.alert("Error", "No temporary data found");
        return;
      }

      if (!age.trim()) {
        Alert.alert("Error", "Age is required");
        return;
      }
      if (!gender.trim()) {
        Alert.alert("Error", "Gender is required");
        return;
      }
      if (!personality.trim()) {
        Alert.alert("Error", "Personality type is required");
        return;
      }
      if (selectedInterests.length === 0) {
        Alert.alert("Error", "At least one interest is required");
        return;
      }
      if (!relationshipType.trim()) {
        Alert.alert("Error", "Relationship type is required");
        return;
      }
      if (!genderOrientation.trim()) {
        Alert.alert("Error", "Gender orientation is required");
        return;
      }
      if (!religion.trim()) {
        Alert.alert("Error", "Religion is required");
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

      await AsyncStorage.setItem("tempUserData", JSON.stringify(userData));

      navigation.navigate("Location");
    } catch (error) {
      Alert.alert("Error", "There is a problem with the server");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackButton title={"Tell us about yourself"} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.inputContainer} activeOpacity={1}>
          <Icon
            name="calendar"
            size={20}
            color="#5de383"
            alignItems={"flex-end"}
          />
          <TextInput
            style={[styles.input, { width: "100%" }]}
            placeholder="Select Age"
            placeholderTextColor="#B0B0B0"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </TouchableOpacity>

        <View style={{ width: "100%" }}>
          <PickerComponent
            label="Gender"
            selectedValue={gender}
            options={genderOptions}
            onValueChange={setGender}
            icon={<Ionicons name="person-outline" size={20} color="#5de383" />}
          />

          <PickerComponent
            label="Gender Orientaion"
            selectedValue={genderOrientation}
            options={genderOrientationOptions}
            onValueChange={setGenderOrientation}
            icon={
              <Ionicons name="male-female-outline" size={20} color="#5de383" />
            }
          />

          <PickerComponent
            label="Personality Type"
            selectedValue={personality}
            options={personalityType}
            onValueChange={setPersonality}
            icon={<Ionicons name="happy-outline" size={20} color="#5de383" />}
          />

          <PickerComponent
            label="Religion"
            selectedValue={religion}
            options={religionOptions}
            onValueChange={setReligion}
            icon={<Ionicons name="leaf-outline" size={20} color="#5de383" />}
          />
        </View>

        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowInterestModal(true)}
        >
          <View style={styles.tagsContainer}>
            {selectedInterests.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onPress={() => removeInterest(item)}
              >
                <Text style={styles.tagText}>{item}</Text>
              </TouchableOpacity>
            ))}
            {selectedInterests.length === 0 && (
              <Text style={{ color: "#B0B0B0", paddingLeft: 10 }}>
                Your interests
              </Text>
            )}
            <Icon name="pencil" size={20} color="white" justifyContent={"flex-end"} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowRelationshipModal(true)}
        >
          <Icon name="heart" size={20} color="white" />
          <Text
            style={{
              color: relationshipType ? "#FFF" : "#B0B0B0",
              paddingLeft: 10,
            }}
          >
            {relationshipType || "Select Relationship Type"}
          </Text>
        </TouchableOpacity>

        <Modal visible={showInterestModal} transparent animationType="fade">
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

        <Modal visible={showRelationshipModal} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={relationshipOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setRelationshipType(item);
                      setShowRelationshipModal(false);
                    }}
                    style={styles.interestOption}
                  >
                    <Text
                      style={[
                        styles.interestText,
                        relationshipType === item && styles.selectedInterest,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                onPress={() => setShowRelationshipModal(false)}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <TouchableOpacity style={styles.button} onPress={detailHandler}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollContainer: {
    padding: 20,
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    width: "100%",
    borderWidth: 1,
    borderColor: "#121212",
    minHeight: 56,
    color: "white",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 10,
    gap: 8,
  },
  tag: {
    backgroundColor: "#5de383",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  input: {
    color: "white",
    width: "100%",
    paddingLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    paddingLeft: 20,
  },
  interestOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#5de383",
    alignItems: "center",
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 15,
    borderRadius: 10,
    width: "100%",
    marginBottom: 15,
    minHeight: 56,
    borderColor: "#121212",
    borderWidth: 1,
  },

  interestText: {
    color: "#FFF",
    fontSize: 18,
  },
  selectedInterest: {
    color: "#5de383",
    fontWeight: "bold",
  },
  confirmButton: {
    marginTop: 20,
    backgroundColor: "#5de383",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#5de383",
    paddingVertical: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    position: "absolute",
    bottom: 0,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default BasicDetails;
