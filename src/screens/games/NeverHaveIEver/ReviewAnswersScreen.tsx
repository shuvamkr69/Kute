// ReviewAnswersScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../../../utils/api';

type Props = NativeStackScreenProps<any, "ReviewAnswersScreen">;

interface Answer {
  userId: string;
  name: string;
  avatar: string;
  response: "I Have" | "I Have Not";
}

const ReviewAnswersScreen: React.FC<Props> = ({ navigation }) => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [prompt, setPrompt] = useState("");
  const [allAnswered, setAllAnswered] = useState(false);
  const [timer, setTimer] = useState(10);

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
    const pollAnswers = async () => {
      try {
        const res = await api.get('/api/v1/neverhaveiever/answers');
        if (res.data.allAnswered) {
          setPrompt(res.data.prompt);
          setAnswers(res.data.answers);
          setAllAnswered(true);
        }
      } catch (err) {
        console.error("Failed to get answers:", err);
      }
    };

    const interval = setInterval(pollAnswers, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (allAnswered) {
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            goToNextTurn();
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [allAnswered]);

  const goToNextTurn = async () => {
    try {
      await api.post('/api/v1/users/neverhaveiever/next-turn');
      navigation.navigate("SubmitPromptScreen");
    } catch (err) {
      console.error("Failed to move to next turn:", err);
    }
  };

  const renderItem = ({ item }: { item: Answer }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={item.response === "I Have" ? styles.have : styles.not}>
        {item.response === "I Have" ? "🍷 I Have" : "🚫 I Have Not"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prompt:</Text>
      <Text style={styles.prompt}>{prompt}</Text>
      <FlatList
        data={answers}
        renderItem={renderItem}
        keyExtractor={(item) => item.userId}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
      {allAnswered && <Text style={styles.timer}>⏳ Next round in {timer}s...</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  prompt: { fontSize: 18, marginBottom: 20 },
  list: { flex: 1 },
  card: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  name: { fontSize: 16, fontWeight: '500', flex: 1 },
  have: { fontSize: 16, color: '#8e44ad' },
  not: { fontSize: 16, color: '#c0392b' },
  timer: { textAlign: 'center', marginTop: 16, fontSize: 16 }
});

export default ReviewAnswersScreen;
