// Updated MultiplayerGame.tsx with gender-based matchmaking logic

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Alert,
  Button,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";
import api from "../../../utils/api";
import { useFocusEffect } from "@react-navigation/native";
const { width } = Dimensions.get("window");
const genders = ["Male", "Female", "Others"];

export type RootStackParamList = {
  MultiPlayerGame: { currentUserId: string };
  TruthAnswerScreen: { matchId: string; currentUserId: string };
  TruthSetScreen: { matchId: string; currentUserId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "MultiPlayerGame">;

const MultiplayerGame: React.FC<Props> = ({ navigation, route }) => {
  const { currentUserId } = route.params;
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [isSpinnerDone, setSpinnerDone] = useState(false);
  const [chosenPlayer, setChosenPlayer] = useState<"me" | "opponent" | null>(
    null
  );
  const [promptType, setPromptType] = useState<"truth" | "dare" | null>(null);
  const [dareOptions, setDareOptions] = useState<string[]>([]);
  const [selectedDare, setSelectedDare] = useState<string | null>(null);
  const [customDare, setCustomDare] = useState<string>("");
  const [uploadModal, setUploadModal] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused

      return () => {
        // Screen is unfocused (navigated back or away)
        api
          .post("/api/v1/users/leave", {
            userId: currentUserId,
          })
          .catch((err) => {
            console.error("Leave queue error:", err.message);
          });
      };
    }, [currentUserId])
  );

  useEffect(() => {
    if (!selectedGender) return;

    let isCancelled = false;
    let timeoutId: NodeJS.Timeout;

    const tryMatch = async () => {
      if (isCancelled) return;

      setWaiting(true);

      try {
        const res = await api.post("/api/v1/users/match", {
          userId: currentUserId,
          genderPreference: selectedGender,
        });

        if (res.data.matched) {
          const currentPlayer = res.data.players.find(
            (p: any) => p.userId === currentUserId
          );
          const otherPlayer = res.data.players.find(
            (p: any) => p.userId !== currentUserId
          );

          setMatchedUser(otherPlayer);
          setWaiting(false);
          console.log("choosen: ", currentPlayer.isChooser, " ", currentUserId)
          setChosenPlayer(currentPlayer.isChooser ? "me" : "opponent");
          setCountdown(5);

          
        } else {
          timeoutId = setTimeout(tryMatch, 3000);
        }
      } catch (err) {
        console.error("Match error:", err);
        setWaiting(false);
      }
    };

    tryMatch();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [selectedGender]);

  const handleGenderSelect = async (gender: string) => {
    try {
      const res = await api.post("/api/v1/users/join", {
        userId: currentUserId,
        genderPreference: gender,
      });

      if (res.data.success) {
        setSelectedGender(gender);
      }
    } catch (err) {
      console.error("Join error:", err.message);
    }
  };

  const renderGenderSelection = () => (
    <View style={styles.genderContainer}>
      <Text style={styles.title}>Choose gender to play with</Text>
      {genders.map((g) => (
        <TouchableOpacity
          key={g}
          style={[
            styles.genderButton,
            selectedGender === g && styles.selectedGender,
          ]}
          onPress={() => handleGenderSelect(g)}
        >
          <Text style={styles.genderText}>{g}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderWaiting = () => (
    <View style={styles.backButtonContainer}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.text}>Finding your match...</Text>
      </View>
    </View>
  );

  const renderSpinner = () => (
    <View style={styles.centered}>
      <Image
        source={require("../../../assets/images/wine-bottle.jpg")}
        style={{ width: 150, height: 150 }}
      />
      <Text style={styles.text}>Spinning bottle...</Text>
    </View>
  );

  const renderTruthOrDareChoice = () => (
    <View style={styles.centered}>
      <Text style={styles.text}>You were chosen! Pick Truth or Dare:</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.choiceButton, { backgroundColor: "#3498db" }]}
          onPress={() => setPromptType("truth")}
        >
          <Text style={styles.choiceText}>Truth</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.choiceButton, { backgroundColor: "#e67e22" }]}
          onPress={() => setPromptType("dare")}
        >
          <Text style={styles.choiceText}>Dare</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCountdown = () => (
    <View style={styles.centered}>
      <Text style={[styles.text, { fontSize: 32 }]}>Match found!</Text>
      <Text
        style={[
          styles.text,
          { fontSize: 48, fontWeight: "bold", color: "#FF6F61" },
        ]}
      >
        {countdown}
      </Text>
    </View>
  );

  useEffect(() => {
  if (!promptType || !matchedUser) return;

  if (promptType === "truth" && chosenPlayer === "me") {
    navigation.navigate("TruthAnswerScreen", {
      matchId: matchedUser.matchId,
      currentUserId,
    });
  }

  if (promptType === "truth" && chosenPlayer === "opponent") {
    navigation.navigate("TruthSetScreen", {
      matchId: matchedUser.matchId,
      currentUserId,
    });
  }
}, [promptType, chosenPlayer, matchedUser]);


  const renderDareOptions = () => (
    <View style={styles.centered}>
      <Text style={styles.text}>Choose or type a dare:</Text>
      {dareOptions.map((dare, i) => (
        <TouchableOpacity
          key={i}
          style={[
            styles.dareOption,
            selectedDare === dare && styles.selectedDareOption,
          ]}
          onPress={() => setSelectedDare(dare)}
        >
          <Text style={styles.dareText}>{dare}</Text>
        </TouchableOpacity>
      ))}
      <Text style={[styles.text, { marginTop: 10 }]}>or write your own:</Text>
      <TouchableOpacity
        style={styles.customDareButton}
        onPress={() => setUploadModal(true)}
      >
        <Text style={styles.choiceText}>Upload Dare Evidence</Text>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => (prev ?? 1) - 1);
      }, 1000);
    }

    if (countdown === 0) {
      setSpinnerDone(true);
      setCountdown(null);
    }

    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <View style={styles.container}>
      {!selectedGender ? (
        renderGenderSelection()
      ) : waiting && !matchedUser ? (
        renderWaiting()
      ) : countdown !== null ? (
        renderCountdown()
      ) : !isSpinnerDone ? (
        renderSpinner()
      ) : chosenPlayer === "me" ? (
        !promptType ? (
          renderTruthOrDareChoice()
        ) : promptType === "dare" ? (
          renderDareOptions()
        ) : (
          <Text style={styles.text}>Answer the truth question here...</Text>
        )
      ) : (
        <Text style={styles.text}>Opponent is choosing Truth or Dare...</Text>
      )}

      {/* Upload Modal (for Dare) */}
      <Modal visible={uploadModal} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.text}>
            Upload your photo or video (view-once)
          </Text>
          <TouchableOpacity onPress={() => setUploadModal(false)}>
            <Text style={{ color: "red", marginTop: 20 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default MultiplayerGame;

const styles = StyleSheet.create({
  backButtonContainer: { flex: 1, backgroundColor: "#121212" },
  container: { flex: 1, backgroundColor: "#121212", padding: 20 },
  centered: { alignItems: "center", justifyContent: "center", flex: 1 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  text: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
  },
  genderContainer: { flex: 1, justifyContent: "center" },
  genderButton: {
    backgroundColor: "#1e1e1e",
    padding: 12,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  selectedGender: { borderColor: "#FF6F61", backgroundColor: "#2e2e2e" },
  genderText: { color: "#fff", fontSize: 18, textAlign: "center" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 20,
  },
  choiceButton: { padding: 16, borderRadius: 14 },
  choiceText: { color: "#fff", fontSize: 18 },
  dareOption: {
    backgroundColor: "#1e1e1e",
    padding: 10,
    marginVertical: 6,
    borderRadius: 10,
    borderColor: "#444",
    borderWidth: 1,
  },
  selectedDareOption: { backgroundColor: "#FF6F61" },
  dareText: { color: "#fff" },
  customDareButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
});
