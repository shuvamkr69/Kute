// WaitingForPromptScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import api from '../../../utils/api';

type Props = NativeStackScreenProps<any, "WaitingForPromptScreen">;

const WaitingForPromptScreen: React.FC<Props> = ({ navigation }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);

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
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    const pollPromptStatus = setInterval(async () => {
      try {
        const res = await api.get('/api/v1/users/neverhaveiever/prompt-status');
        if (res.data.promptReady) {
          navigation.navigate("AnswerPromptScreen");
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(pollPromptStatus);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chance holder is deciding...</Text>
      <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
      <Text style={styles.subtitle}>Elapsed: {timeElapsed}s</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#555' }
});

export default WaitingForPromptScreen;
