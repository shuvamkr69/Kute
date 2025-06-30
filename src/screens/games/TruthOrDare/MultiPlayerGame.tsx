// src/screens/TruthOrDare/MultiPlayerGame.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const genders = ["Male", "Female", "Others"];

export type RootStackParamList = {
  MultiPlayerGame: { currentUserId: string };
  TruthAnswerScreen: {
    matchId: string;
    currentUserId: string;
    question: string;
  };
  TruthSetScreen: { matchId: string; currentUserId: string };
  WaitingForAnswerScreen: {
    matchId: string;
    currentUserId: string;
  };

  TruthReviewScreen: {
    matchId: string;
    currentUserId: string;
    answer: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, "MultiPlayerGame">;

const MultiplayerGame: React.FC<Props> = ({ navigation, route }) => {
  const { currentUserId } = route.params;

  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [isSpinnerDone, setSpinnerDone] = useState(false);
  const [amIChooser, setAmIChooser] = useState<"me" | "opponent" | null>(null);
  const [promptType, setPromptType] = useState<"truth" | "dare" | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNavigatedToSetScreen, setHasNavigatedToSetScreen] = useState(false);
  const [hasNavigatedToAnswerScreen, setHasNavigatedToAnswerScreen] =
    useState(false);
  const [hasSeenReview, setHasSeenReview] = useState(false);

  const handleRefresh = async () => {
    if (!matchedUser?.matchId) {
      console.warn("⚠️ No matchedUser or matchId during refresh");
      return;
    }

    setRefreshing(true);
    try {
      console.log("🔄 Polling match status for:", matchedUser.matchId);

      const res = await api.get(`/api/v1/users/status/${matchedUser.matchId}`);
      const players = res.data;

      if (!Array.isArray(players) || players.length < 2) {
        console.warn("⏳ Match not complete yet. Waiting for both players...");
        return;
      }

      const me = players.find((p: any) => p.userId === currentUserId);
      const other = players.find((p: any) => p.userId !== currentUserId);

      if (!me || !other) {
        console.warn("❌ Could not identify current or opponent player");
        return;
      }

      const prompt = other.promptType;

      if (prompt === "truth" && !me.isChooser && !hasNavigatedToSetScreen) {
        console.log("🧭 Navigating to TruthSetScreen (P2)");
        setHasNavigatedToSetScreen(true);
        setPromptType("truth");

        navigation.navigate("TruthSetScreen", {
          matchId: matchedUser.matchId,
          currentUserId,
        });
      }
      // P2 navigates to TruthReviewScreen when answer is received
      if (other.receivedAnswer && !me.isChooser && !hasSeenReview) {
        console.log("📨 Navigating P2 to TruthReviewScreen");
        setHasSeenReview(true);

        navigation.navigate("TruthReviewScreen", {
          matchId: matchedUser.matchId,
          currentUserId,
          answer: me.receivedAnswer,
        });
      }

      if (me.truthQuestion && me.isChooser && !hasNavigatedToAnswerScreen) {
        console.log("➡️ Navigating to TruthAnswerScreen (P1)");
        setHasNavigatedToAnswerScreen(true);
        navigation.navigate("TruthAnswerScreen", {
          matchId: matchedUser.matchId,
          currentUserId,
          question: me.truthQuestion,
        });
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        console.log("⏳ Match not found yet (404), retrying later...");
      } else {
        console.error("Manual refresh failed:", err.message);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenderSelect = async (gender: string) => {
    try {
      const res = await api.post("/api/v1/users/join", {
        userId: currentUserId,
        genderPreference: gender,
      });
      if (res.data.success) setSelectedGender(gender);
    } catch (err) {
      console.error("Join error:", err.message);
    }
  };

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

          setMatchedUser({
            matchId: res.data.players[0].matchId,
          });
          setAmIChooser(currentPlayer.isChooser ? "me" : "opponent");
          setCountdown(5);
          setWaiting(false);
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

  // 🟡 Polling for game updates (prompt selection or question arrival)
  useEffect(() => {
    if (!matchedUser?.matchId) {
      return;
    }

    console.log("📡 Starting polling for matchId:", matchedUser.matchId);

    const interval = setInterval(async () => {
      try {
        const res = await api.get(
          `/api/v1/users/status/${matchedUser.matchId}`
        );
        const players = res.data;

        console.log("📥 Players from API:", players);

        const me = players.find((p: any) => p.userId === currentUserId);
        const other = players.find((p: any) => p.userId !== currentUserId);

        if (!me || !other) {
          console.warn("⚠️ Could not find both players.");
          return;
        }

        const prompt = other.promptType;

        // P2 navigates to TruthSetScreen
        if (prompt === "truth" && !me.isChooser) {
          console.log("🧭 Navigating to TruthSetScreen");
          setPromptType("truth");
          navigation.navigate("TruthSetScreen", {
            matchId: matchedUser.matchId,
            currentUserId,
          });
        }

        // P1 navigates to TruthAnswerScreen when question received
        if (me.truthQuestion && me.isChooser) {
          console.log("🧭 Navigating to TruthAnswerScreen");
          navigation.navigate("TruthAnswerScreen", {
            matchId: matchedUser.matchId,
            currentUserId,
            question: me.truthQuestion,
          });
        }
      } catch (err: any) {
        console.error("❌ Polling error:", err?.response?.data || err.message);
      }
    }, 2000);

    return () => {
      console.log("🛑 Stopping polling interval");
      clearInterval(interval);
    };
  }, [matchedUser]);

  const handlePromptSelect = async (type: "truth" | "dare") => {
    if (!matchedUser) return;

    try {
      await api.post("/api/v1/users/choosePrompt", {
        matchId: matchedUser.matchId,
        userId: currentUserId,
        promptType: type,
      });

      setPromptType(type);
    } catch (err) {
      console.error("Prompt selection failed:", err.message);
    }
  };

  const renderTruthOrDareChoice = () => (
    <View style={styles.centered}>
      <Text style={styles.text}>You were chosen! Pick Truth or Dare:</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.choiceButton, { backgroundColor: "#3498db" }]}
          onPress={() => handlePromptSelect("truth")}
        >
          <Text style={styles.choiceText}>Truth</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.choiceButton, { backgroundColor: "#e67e22" }]}
          onPress={() => handlePromptSelect("dare")}
        >
          <Text style={styles.choiceText}>Dare</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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

      {/*temporary button to remove waiting list*/}
      <TouchableOpacity
        style={{
          marginTop: 40,
          backgroundColor: "red",
          padding: 12,
          borderRadius: 10,
        }}
        onPress={async () => {
          try {
            const res = await api.delete("/api/v1/users/clear-waiting");
            console.log("🧹 Cleared waiting list:", res.data);
            alert("Waiting list cleared!");
          } catch (err) {
            console.error("Error clearing waiting list:", err.message);
          }
        }}
      >
        <Text
          style={{ color: "white", fontWeight: "bold", textAlign: "center" }}
        >
          Clear Waiting List
        </Text>
      </TouchableOpacity>
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

  return (
    <LinearGradient colors={["#1a1a1a", "#121212"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#de822c"]}/>
        }
      >
        {!selectedGender ? (
          renderGenderSelection()
        ) : waiting && !matchedUser ? (
          <ActivityIndicator size="large" color="#FF6F61" />
        ) : countdown !== null ? (
          renderCountdown()
        ) : !isSpinnerDone ? (
          <Text style={styles.text}>Spinning bottle...</Text>
        ) : amIChooser === "me" ? (
          !promptType ? (
            renderTruthOrDareChoice()
          ) : (
            <Text style={styles.text}>
              Waiting for question from opponent...
            </Text>
          )
        ) : (
          <Text style={styles.text}>Opponent is choosing Truth or Dare...</Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default MultiplayerGame;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: {
    color: "#ccc",
    fontSize: 18,
    textAlign: "center",
    marginVertical: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  genderContainer: { flex: 1, justifyContent: "center" },
  genderButton: {
    backgroundColor: "#222",
    padding: 14,
    marginVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#555",
    elevation: 3,
  },
  selectedGender: {
    borderColor: "#FF6F61",
    backgroundColor: "#2e2e2e",
  },
  genderText: { color: "#fff", fontSize: 18, textAlign: "center" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 24,
  },
  choiceButton: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 20,
    elevation: 4,
  },
  choiceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
});
