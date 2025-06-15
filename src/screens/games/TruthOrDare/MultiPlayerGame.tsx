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
  RefreshControl,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";
import { useFocusEffect } from "@react-navigation/native";
import { useSocket } from "../../../hooks/useSocket"; // ✅ Ensure this exists

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
};

type Props = NativeStackScreenProps<RootStackParamList, "MultiPlayerGame">;

const MultiplayerGame: React.FC<Props> = ({ navigation, route }) => {
  const { currentUserId } = route.params;
  const socket = useSocket();

  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [isSpinnerDone, setSpinnerDone] = useState(false);
  const [amIChooser, setAmIChooser] = useState<"me" | "opponent" | null>(null);
  const [promptType, setPromptType] = useState<"truth" | "dare" | null>(null);
  const [dareOptions, setDareOptions] = useState<string[]>([]);
  const [selectedDare, setSelectedDare] = useState<string | null>(null);
  const [customDare, setCustomDare] = useState<string>("");
  const [uploadModal, setUploadModal] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chooserId, setChooserId] = useState<string | null>(null);

//   const handleRefresh = async () => {
//   setRefreshing(true);

//   try {
//     if (!matchedUser) return;

//     // Rejoin room if needed
//     socket?.emit("join_match", {
//       matchId: matchedUser.matchId,
//       userId: currentUserId,
//     });

//     // Get updated match info
//     const res = await api.get(`/api/v1/users/status/${matchedUser.matchId}`);
//     const players = res.data;
    

//     const me = players.find((p) => p.userId === currentUserId);
//     const other = players.find((p) => p.userId !== currentUserId);

//     if (!me || !other) return;

//     const chosenPrompt = other.promptType;

//     if (chosenPrompt === "truth" || chosenPrompt === "dare") {
//       setPromptType(chosenPrompt);
//       console.log("navigated :   ",chosenPrompt)

//       // If I am NOT the chooser and truth is selected, navigate to TruthSetScreen ----p2
//       if (chosenPrompt === "truth" && !me.isChooser) {
//         navigation.navigate("TruthSetScreen", {
//           matchId: matchedUser.matchId,
//           currentUserId,
//         });
//       }

//       // If you're the answerer and question already came (optional fallback) -----p1
//       if (me.truthQuestion) {
//         navigation.navigate("TruthAnswerScreen", {
//           matchId: matchedUser.matchId,
//           currentUserId,
//           question: me.truthQuestion,
//         });
//       }

      
//     }
//   } catch (error) {
//     console.error("Refresh error:", error);
//   } finally {
//     setRefreshing(false);
//   }
// };


useEffect(() => {
  const interval = setInterval(async () => {
    try {
      if (!matchedUser) return;

      // Rejoin room if needed
      socket?.emit("join_match", {
        matchId: matchedUser.matchId,
        userId: currentUserId,
      });

      // Get updated match info
      const res = await api.get(`/api/v1/users/status/${matchedUser.matchId}`);
      const players = res.data;

      const me = players.find((p: any) => p.userId === currentUserId);
      const other = players.find((p: any) => p.userId !== currentUserId);

      if (!me || !other) return;

      const chosenPrompt = other.promptType;

      if (chosenPrompt === "truth" || chosenPrompt === "dare") {
        setPromptType(chosenPrompt);
        console.log("Prompt selected by opponent:", chosenPrompt);

        if (chosenPrompt === "truth" && !me.isChooser) {
          navigation.navigate("TruthSetScreen", {
            matchId: matchedUser.matchId,
            currentUserId,
          });
        }

        // if (chosenPrompt === "dare" && !me.isChooser) {
        //   navigation.navigate("DareSetScreen", {
        //     matchId: matchedUser.matchId,
        //     currentUserId,
        //   }); // 🛠️ Implement this screen later
        // }

        if (me.truthQuestion) {
          navigation.navigate("TruthAnswerScreen", {
            matchId: matchedUser.matchId,
            currentUserId,
            question: me.truthQuestion,
          });
        }
      }
    } catch (error) {
      console.error("Refresh error:", error);
    }
  }, 2000);

  return () => clearInterval(interval);
}, [matchedUser]);




  useFocusEffect(
    React.useCallback(() => {
      return () => {
        api
          .post("/api/v1/users/leave", { userId: currentUserId })
          .catch((err) => console.error("Leave queue error:", err.message));
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

          setMatchedUser({
            ...otherPlayer,
            matchId: res.data.players[0].matchId,
          });
          setWaiting(false);
          setAmIChooser(currentPlayer.isChooser ? "me" : "opponent");
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
    if (!socket || !matchedUser || !promptType || amIChooser !== "me") return;

    socket.emit("join_match", {
      matchId: matchedUser.matchId,
      userId: currentUserId,
    });

    socket.on("receive_truth_question", ({ question }) => {
      navigation.navigate("TruthAnswerScreen", {
        matchId: matchedUser.matchId,
        currentUserId,
        question,
      });
    });

    return () => {
      socket.off("receive_truth_question");
    };
  }, [socket, matchedUser, promptType, amIChooser]);

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

  useEffect(() => {
    if (!socket || !matchedUser || amIChooser === null) return;

    socket.emit("join_match", {
      matchId: matchedUser.matchId,
      userId: currentUserId,
    });

    const handlePromptChosen = ({ chosenPrompt }: any) => {
      setPromptType(chosenPrompt);

      // If I am NOT the chooser and prompt is truth, navigate to TruthSetScreen
      if (chosenPrompt === "truth" && amIChooser === "opponent") {
        navigation.navigate("TruthSetScreen", {
          matchId: matchedUser.matchId,
          currentUserId,
        });
      }
    };

    socket.on("prompt_chosen", handlePromptChosen);

    return () => {
      socket.off("prompt_chosen", handlePromptChosen);
    };
  }, [socket, matchedUser, amIChooser]);

  const renderTruthOrDareChoice = () => (
    <View style={styles.centered}>
      <Text style={styles.text}>You were chosen! Pick Truth or Dare:</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.choiceButton, { backgroundColor: "#3498db" }]}
          onPress={() => {
            setPromptType("truth");

            // ADD THIS:
            socket?.emit("prompt_chosen", {
              matchId: matchedUser.matchId,
              chosenPrompt: "truth",
              fromUserId: currentUserId,
            });
          }}
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
    <ScrollView
      contentContainerStyle={[styles.container, { flexGrow: 1 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={renderCountdown} />
      }
    >
      {!selectedGender ? (
        renderGenderSelection()
      ) : waiting && !matchedUser ? (
        renderWaiting()
      ) : countdown !== null ? (
        renderCountdown()
      ) : !isSpinnerDone ? (
        renderSpinner()
      ) : amIChooser === "me" ? (
        !promptType ? (
          renderTruthOrDareChoice()
        ) : promptType === "dare" ? (
          renderDareOptions()
        ) : (
          <Text style={styles.text}>Waiting for question from opponent...</Text>
        )
      ) : (
        <Text style={styles.text}>Opponent is choosing Truth or Dare...</Text>
      )}
    </ScrollView>
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
