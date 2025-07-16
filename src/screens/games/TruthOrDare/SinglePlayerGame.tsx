import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import axios from "axios";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons, Entypo } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import BackButton from "../../../components/BackButton";

const BASE_API = "https://api.truthordarebot.xyz/api";
const BACKEND_URL = "https://your-backend-url.com/api/truth-or-dare"; // your backend for score submission

type RootStackParamList = {
  ModeSelection: undefined;
  SinglePlayerGame: undefined;
  MultiplayerGame: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "SinglePlayerGame">;

const { width, height } = Dimensions.get("window");

const SinglePlayerGame: React.FC<Props> = () => {
  const [prompt, setPrompt] = useState<{ type: string; question: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(true);
  const [selectedType, setSelectedType] = useState<"truth" | "dare" | null>(null);

  const fetchPrompt = async (typeOverride?: "truth" | "dare") => {
    try {
      setLoading(true);
      const type = typeOverride || (Math.random() < 0.5 ? "truth" : "dare");
      const res = await axios.get(`${BASE_API}/${type}?rating=r`);
      setPrompt({ type, question: res.data.question });
      setCompleted(false);
      setSelectedType(type);
      animatePrompt();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load prompt.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (didComplete: boolean) => {
    if (!prompt) return;

    try {
      await axios.post(`${BACKEND_URL}/submit`, {
        promptType: prompt.type,
        question: prompt.question,
        completed: didComplete,
      });

      setScore((prev) => prev + (didComplete ? 10 : -2));
      setCompleted(true);
    } catch {
      Alert.alert("Error", "Failed to submit result.");
    }
  };

  const animatePrompt = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    fetchPrompt();
    return () => setScore(0);
  }, []);

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title={"Single Player"}/>
    <View style={styles.container}>
      {/* Background decorations */}
      <View style={styles.circle} />
      <View style={styles.circle2} />

      {/* Score */}
      <View style={styles.scoreContainer}>
        <Ionicons name="trophy" size={24} color="#FFD700" />
        <Text style={styles.scoreText}> {score}</Text>
      </View>

      {/* Truth/Dare Selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            selectedType === "truth" && styles.typeButtonSelected,
          ]}
          onPress={() => fetchPrompt("truth")}
        >
          <Text style={styles.typeButtonText}>🧠 Truth</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            selectedType === "dare" && styles.typeButtonSelected,
          ]}
          onPress={() => fetchPrompt("dare")}
        >
          <Text style={styles.typeButtonText}>🔥 Dare</Text>
        </TouchableOpacity>
      </View>

      {/* Prompt */}
      {loading ? (
        <ActivityIndicator size="large" color="#FF6F61" />
      ) : (
        <Animated.View style={[styles.promptBox, { opacity: fadeAnim }]}>
          <Text style={styles.emoji}>
            {prompt?.type === "truth" ? "🧠" : "🔥"}
          </Text>
          <Text style={styles.promptText}>{prompt?.question}</Text>
        </Animated.View>
      )}

      {/* Buttons */}
      
        {!completed ? (
          <>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: "#28a745" }]}
              onPress={() => handleSubmit(true)}
            >
              <Ionicons name="checkmark" size={36} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: "#dc3545" }]}
              onPress={() => handleSubmit(false)}
            >
              <Ionicons name="close" size={36} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: "#FF6F61" }]}
            onPress={() => fetchPrompt(selectedType || undefined)}
          >
            <Entypo name="arrow-bold-right" size={36} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Instructions Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>How to Play</Text>
            <Text style={styles.modalText}>🎲 Choose Truth or Dare</Text>
            <Text style={styles.modalText}>✅ Press green if you completed it</Text>
            <Text style={styles.modalText}>❌ Press red if you skipped</Text>
            <Text style={styles.modalText}>🏆 Gain 10 points or lose 2 points</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Got It!</Text>
            </Pressable>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

export default SinglePlayerGame;

const styles = StyleSheet.create({
  backButtonContainer:{
    flex: 1,
    backgroundColor: "#121212",
  },

  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  circle: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 180,
    height: 180,
    backgroundColor: "#ff6f6122",
    borderRadius: 100,
  },
  circle2: {
    position: "absolute",
    bottom: -70,
    right: -70,
    width: 220,
    height: 220,
    backgroundColor: "#ffd70022",
    borderRadius: 110,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
    backgroundColor: "#222",
    padding: 10,
    borderRadius: 16,
  },
  scoreText: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 6,
  },
  promptBox: {
    backgroundColor: "#1E1E1E",
    padding: 28,
    borderRadius: 20,
    marginVertical: 20,
    width: "100%",
    alignItems: "center",
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  promptText: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: 40,
    gap: 30,
  },
  iconButton: {
    padding: 18,
    borderRadius: 50,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalText: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: "#FF6F61",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  typeSelector: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginVertical: 20,
  gap: 12,
},
typeButton: {
  backgroundColor: "#1e1e1e",
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: "#333",
},
typeButtonSelected: {
  backgroundColor: "#FF6F61",
  borderColor: "#FF6F61",
},
typeButtonText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "bold",
},
}); 