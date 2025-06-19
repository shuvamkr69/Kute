import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  BackHandler,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<any, "NHIEWaitingForAnswersScreen">;

const NHIEWaitingForAnswersScreen: React.FC<Props> = ({ navigation }) => {
  const [prompt, setPrompt] = useState("");
  const [hasNavigated, setHasNavigated] = useState(false);

  useFocusEffect(
    //leave waiing room if back button clicked
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
        return true; // Block default behavior
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  // Fetch the prompt (once it is submitted)
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const res = await api.get("/api/v1/users/neverhaveiever/prompt-status");
        if (res.data.prompt) {
          setPrompt(res.data.prompt);
        }
      } catch (err) {
        console.error(
          "Failed to get prompt:",
          err.response?.data || err.message
        );
      }
    };

    const interval = setInterval(fetchPrompt, 3000);
    return () => clearInterval(interval);
  }, []);

  // Poll for all players having answered
  useEffect(() => {
    const interval = setInterval(async () => {
      if (hasNavigated) return;

      try {
        const [answerRes, turnRes] = await Promise.all([
          api.get("/api/v1/users/neverhaveiever/answers"),
          api.get("/api/v1/users/neverhaveiever/current-turn"),
        ]);

        // Assuming turnRes.data contains gamePhase and chanceHolderId, and answerRes.data contains userId
        const gamePhase = turnRes.data.gamePhase;
        const chanceHolderId = turnRes.data.chanceHolderId;
        const userId = answerRes.data.userId;

        if (gamePhase === "reviewing" && userId === chanceHolderId) {
          setHasNavigated(true);
          navigation.navigate("ReviewAnswersScreen");
        }
      } catch (err) {
        
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [hasNavigated]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waiting for others to answer...</Text>
      {prompt ? (
        <>
          <Text style={styles.promptText}>{prompt}</Text>
          <ActivityIndicator
            size="large"
            color="#8e44ad"
            style={{ marginTop: 30 }}
          />
        </>
      ) : (
        <Text style={styles.loading}>Loading prompt...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
    color: "#fff",
    textAlign: "center",
  },
  promptText: {
    fontSize: 20,
    color: "#ddd",
    textAlign: "center",
    paddingHorizontal: 10,
    marginBottom: 16,
    fontStyle: "italic",
  },
  loading: {
    fontSize: 16,
    color: "#aaa",
  },
});

export default NHIEWaitingForAnswersScreen;
