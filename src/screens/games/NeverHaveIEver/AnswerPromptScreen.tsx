// AnswerPromptScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../../../utils/api';

type Props = NativeStackScreenProps<any, "AnswerPromptScreen">;

const AnswerPromptScreen: React.FC<Props> = ({ navigation }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitted, setSubmitted] = useState(false);
  const [promptText, setPromptText] = useState("");

   useEffect(() => {
    const pollMatchStatus = async () => {
      try {
        const res = await api.get("/api/v1/users/neverhaveiever/waiting-room-status");

        if (!res.data.readyToStart) {
          navigation.navigate("WaitingRoomScreen");
        }
      } catch (err) {
        console.error("Polling failed:", err.response?.data || err.message);
      }
    };

    const interval = setInterval(pollMatchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Get current prompt
    const fetchPrompt = async () => {
      try {
        const res = await api.get('/api/v1/users/neverhaveiever/prompt-status');
        setPromptText(res.data.prompt || "Waiting for prompt...");
      } catch (err) {
        console.error("Failed to fetch prompt:", err);
      }
    };

    fetchPrompt();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!submitted) handleSubmit("I Have Not"); // default if no action
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (response: "I Have" | "I Have Not") => {
    if (submitted) return;

    try {
      await api.post('/api/v1/neverhaveiever/submit-answer', { response });
      setSubmitted(true);
      navigation.navigate("ReviewAnswersScreen");
    } catch (err) {
      console.error("Failed to submit answer:", err);
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
          disabled={submitted}
          color="#8e44ad"
        />
        <Button
          title="🚫 I Have Not"
          onPress={() => handleSubmit("I Have Not")}
          disabled={submitted}
          color="#c0392b"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  prompt: { fontSize: 20, textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  timer: { fontSize: 18, marginBottom: 30, color: '#555' },
  buttonGroup: { gap: 16, width: '100%' }
});

export default AnswerPromptScreen;
