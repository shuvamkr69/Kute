import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import CustomAlert from "../../../components/CustomAlert";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";

type Props = NativeStackScreenProps<any, "AnswerScreen">;

const AnswerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { gameId, currentUserId } = route.params;
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const res = await api.get(`/api/v1/users/wyr/poll/${gameId}`);
        const game = res.data;
        const currentRound = game.rounds?.[game.currentRound - 1];

        if (currentRound?.prompt) {
          setPrompt(currentRound.prompt);
        } else {
          setCustomAlert({ visible: true, title: "Error", message: "Prompt not available." });
          navigation.goBack();
        }
      } catch (err) {
        console.error("Error fetching prompt:", err);
        setCustomAlert({ visible: true, title: "Error", message: "Failed to load prompt." });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, []);

  const submitAnswer = async (answer: string) => {
    try {
      await api.post(`/api/v1/users/wyr/submit-answer/${gameId}`, { answer });
      navigation.replace("WaitingForFeedbackScreen", {
        gameId,
        currentUserId,
      });
    } catch (err) {
      console.error("Failed to submit answer:", err);
      setCustomAlert({ visible: true, title: "Error", message: "Could not submit answer." });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#de822c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Opponent Asks:</Text>
      <Text style={styles.prompt}>{prompt}</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#de822c" }]}
        onPress={() => submitAnswer("Option A")}
      >
        <Text style={styles.buttonText}>Option A</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#ff172e" }]}
        onPress={() => submitAnswer("Option B")}
      >
        <Text style={styles.buttonText}>Option B</Text>
      </TouchableOpacity>
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

export default AnswerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 20,
  },
  prompt: {
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: "100%",
    marginBottom: 20,
  },
  buttonText: {
    textAlign: "center",
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
});
