import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";
import { getSocket } from '../../../utils/socket';
import { getUserId } from '../../../utils/constants';

type Props = NativeStackScreenProps<any, "ReviewAnswersScreen">;

interface Answer {
  userId: string;
  name: string;
  avatar: string;
  response: "I Have" | "I Have Not" | "Skipped";
}

const ReviewAnswersScreen: React.FC<Props> = ({ navigation, route }) => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [prompt, setPrompt] = useState("");
  const [timer, setTimer] = useState(10);
  const [userId, setUserId] = useState<string | null>(null);
  const hasNavigatedRef = useRef(false);
  const roomId = route?.params?.roomId;

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    socket.on('nhie:roomUpdate', (room) => {
      if (room.roomId !== roomId) return;
      if (room.currentPrompt && room.currentPrompt.gamePhase === 'reviewing') {
        setPrompt(room.currentPrompt.text);
        setAnswers(room.currentPrompt.answers.map(ans => ({
          userId: ans.userId,
          name: ans.name || '',
          avatar: ans.avatar || '',
          response: ans.response,
        })));
        // Start countdown for next turn
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          setTimeout(() => triggerNextTurn(room), 10000);
        }
      }
    });
    return () => {
      socket.off('nhie:roomUpdate');
    };
  }, [roomId, userId]);

  const triggerNextTurn = (room) => {
    if (!userId) return;
    const socket = getSocket();
    const idx = room.players.findIndex(p => p.userId === userId);
    if (idx === room.chanceIndex) {
      socket.emit('nhie:nextTurn', { roomId, userId });
      navigation.navigate('SubmitPromptScreen', { roomId });
    } else {
      navigation.navigate('WaitingForPromptScreen', { roomId });
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
