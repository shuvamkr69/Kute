// AnswerPromptScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  BackHandler,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<any, "AnswerPromptScreen">;

const AnswerPromptScreen: React.FC<Props> = ({ navigation }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitted, setSubmitted] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [promptText, setPromptText] = useState("");
  const hasNavigatedRef = React.useRef(false);

  useEffect(() => {
    console.log("🧭 [NAVIGATION] Current screen: AnswerPromptScreen");
  }, []);

  // AnswerPromptScreen.tsx
useEffect(() => {
  const interval = setInterval(async () => {
    if (hasNavigatedRef.current) return; // Add navigation guard
    
    const res = await api.get("/api/v1/users/neverhaveiever/current-turn");
    const { gamePhase, userId, chanceHolderId } = res.data;
    const isChanceHolder = userId === chanceHolderId;

    if (gamePhase === "reviewing") {
      clearInterval(interval);
      navigation.navigate("ReviewAnswersScreen");
    } 
    else if (gamePhase === "typing") {
      clearInterval(interval);
      navigation.navigate(isChanceHolder ? "SubmitPromptScreen" : "WaitingForPromptScreen");
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, []);



  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "Leave Waiting Room?",
          "Do you want to leave the waiting room?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Leave",
              style: "destructive",
              onPress: async () => {
                try {
                  await api.post("/api/v1/users/neverhaveiever/leave");
                } catch (err) {
                  console.error("Failed to leave waiting room:", err);
                }
                navigation.navigate("HomeTabs");
              },
            },
          ]
        );
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  useEffect(() => {
    const pollMatchStatus = async () => {
      try {
        const res = await api.get(
          "/api/v1/users/neverhaveiever/waiting-room-status"
        );
        if (!res.data.readyToStart) {
          navigation.navigate("WaitingRoomScreen");
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
    navigation.navigate("WaitingRoomScreen");
  }
      }
    };

    const interval = setInterval(pollMatchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const res = await api.get("/api/v1/users/neverhaveiever/prompt-status");
        setPromptText(res.data.prompt || "Waiting for prompt...");
      } catch (err) {
        if (err.response && err.response.status === 404) {
    navigation.navigate("WaitingRoomScreen");
  }
      }
    };

    fetchPrompt();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!submitted) {
            handleSubmit("Skipped");
            setSkipped(true);
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  const handleSubmit = async (
    response: "I Have" | "I Have Not" | "Skipped"
  ) => {
    if (submitted) return;

    try {
      await api.post("/api/v1/users/neverhaveiever/submit-answer", {
        response,
      });
      setSubmitted(true);

      // Don't navigate early if skipped — wait on screen
    } catch (err) {
      if (err.response && err.response.status === 404) {
    navigation.navigate("WaitingRoomScreen");
  }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>{promptText}</Text>
      <Text style={styles.timer}>⏱ Time left: {timeLeft}s</Text>

      <View style={styles.buttonGroup}>
        <Button
          title="🍷 I Have"
          onPress={() => handleSubmit("I Have")}
          disabled={submitted || skipped}
          color="#8e44ad"
        />
        <Button
          title="🚫 I Have Not"
          onPress={() => handleSubmit("I Have Not")}
          disabled={submitted || skipped}
          color="#c0392b"
        />
      </View>

      {skipped && (
        <Text style={styles.skippedNote}>
          ⚠️ You missed your chance to answer.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  prompt: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  timer: { fontSize: 18, marginBottom: 30, color: "#555" },
  buttonGroup: { gap: 16, width: "100%" },
  skippedNote: {
    marginTop: 24,
    fontSize: 16,
    color: "#c0392b",
    fontWeight: "500",
    textAlign: "center",
  },
});

export default AnswerPromptScreen;
