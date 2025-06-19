// SubmitPromptScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import api from '../../../utils/api';
import { Alert, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<any, "SubmitPromptScreen">;

const SubmitPromptScreen: React.FC<Props> = ({ navigation }) => {
  const [prompt, setPrompt] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes

  useEffect(() => {
  const fetchTurn = async () => {
    const res = await api.get("/api/v1/users/neverhaveiever/current-turn");
console.log("📥 /current-turn result:", res.data);

    const { userId, chanceHolderId, gamePhase } = res.data;
    const isChanceHolder = userId === chanceHolderId;

    console.log("📌 [TurnInfo] userId:", userId);
    console.log("📌 [TurnInfo] chanceHolderId:", chanceHolderId);
    console.log("📌 [TurnInfo] isChanceHolder:", isChanceHolder);
    console.log("📌 [TurnInfo] gamePhase:", gamePhase);
  };

  fetchTurn();
}, []);


  

  useFocusEffect(          //leave waiing room if back button clicked
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

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [])
);

   useEffect(() => {
    const pollMatchStatus = async () => {
      try {
        const res = await api.get("/api/v1/users/neverhaveiever/waiting-room-status");

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
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit (could also mark as timeout)
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  // SubmitPromptScreen.tsx (simplified core navigation logic)

const handleSubmit = async () => {
  try {
    await api.post('/api/v1/users/neverhaveiever/submit-prompt', { prompt });
    navigation.navigate("NHIEWaitingForAnswersScreen"); // Only chance holder
  } catch (err) {
    console.error("Prompt submission failed:", err);
  }
};



  return (
    <View style={styles.container}>
      <Text style={styles.timer}>⏳ Time Left: {timeLeft}s</Text>
      <Text style={styles.title}>Write your “Never Have I Ever”</Text>
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="e.g., Never have I ever cheated on a test..."
        style={styles.input}
        multiline
      />
      <Button title="Submit Prompt" onPress={handleSubmit} disabled={!prompt.trim()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  timer: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
});

export default SubmitPromptScreen;
