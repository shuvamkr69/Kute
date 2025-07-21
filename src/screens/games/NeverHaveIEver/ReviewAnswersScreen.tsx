import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";

type Props = NativeStackScreenProps<any, "ReviewAnswersScreen">;

interface Answer {
  userId: string;
  name: string;
  avatar: string;
  response: "I Have" | "I Have Not" | "Skipped";
}

const ReviewAnswersScreen: React.FC<Props> = ({ navigation }) => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [prompt, setPrompt] = useState("");
  const [timer, setTimer] = useState(10);
  const hasNavigatedRef = useRef(false);


  // Poll for answers and start countdown when ready
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const startCountdown = () => {
      countdownInterval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            triggerNextTurn();
          }
          return prev - 1;
        });
      }, 1000);
    };

    const fetchAnswers = async () => {
      try {
        const res = await api.get("/api/v1/users/neverhaveiever/answers");
        if (res.data.allAnswered && res.data.answers.length > 0) {
          clearInterval(pollInterval);
          setPrompt(res.data.prompt);
          setAnswers(res.data.answers);
          startCountdown();
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
    navigation.navigate("WaitingRoomScreen");
  }
      }
    };

    // Poll every second instead of 50ms
    pollInterval = setInterval(fetchAnswers, 1000);
    fetchAnswers();

    return () => {
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  // Poll for gamePhase reset to typing for non–chance holders
 useEffect(() => {
  const resetPoll = setInterval(async () => {
    if (hasNavigatedRef.current) return; // <-- use the ref!
    try {
      const res = await api.get("/api/v1/users/neverhaveiever/current-turn");
      const { userId, chanceHolderId, gamePhase, turnInProgress } = res.data;
      const isChanceHolder = userId === chanceHolderId;

      if (
        !isChanceHolder &&
        gamePhase === "typing" &&
        turnInProgress === false &&
        !hasNavigatedRef.current // <-- use the ref!
      ) {
        hasNavigatedRef.current = true; // <-- set the ref!
        navigation.navigate("WaitingForPromptScreen");
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
    navigation.navigate("WaitingRoomScreen");
  }
    }
  }, 1000);

  return () => clearInterval(resetPoll);
}, []);


  // Trigger navigation to the next turn
  const triggerNextTurn = async () => {
    if (hasNavigatedRef.current) return; // <-- use the ref!
    hasNavigatedRef.current = true; // <-- set the ref!

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const turnRes = await api.get("/api/v1/users/neverhaveiever/current-turn");
      const { userId, chanceHolderId } = turnRes.data;
      const isChanceHolder = userId === chanceHolderId;

      if (isChanceHolder) {
        await api.post("/api/v1/users/neverhaveiever/next-turn");
        navigation.navigate("SubmitPromptScreen");
      } else {
        navigation.navigate("WaitingForPromptScreen");
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        navigation.navigate("WaitingRoomScreen");
      }
    }
  };


  const renderItem = ({ item }: { item: Answer }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text
          style={
            item.response === "I Have"
              ? styles.have
              : item.response === "Skipped"
              ? styles.skipped
              : styles.not
          }
        >
          {item.response === "I Have"
            ? "🍷 I Have"
            : item.response === "Skipped"
            ? "⚠️ Skipped"
            : "🚫 I Have Not"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prompt:</Text>
      <Text style={styles.prompt}>"{prompt}"</Text>
      <FlatList
        data={answers}
        renderItem={renderItem}
        keyExtractor={item => item.userId}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <Text style={styles.timer}>⏳ Next round in {timer}s...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 20 },
  title: { fontSize: 20, color: "#fff", fontWeight: "bold", marginBottom: 8 },
  prompt: {
    fontSize: 18,
    color: "#ddd",
    fontStyle: "italic",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  name: { fontSize: 16, color: "#fff" },
  have: { color: "#9b59b6", fontSize: 15 },
  not: { color: "#e74c3c", fontSize: 15 },
  skipped: { color: "#f1c40f", fontSize: 15 },
  timer: { marginTop: 24, textAlign: "center", color: "#aaa", fontSize: 16 },
});

export default ReviewAnswersScreen;
