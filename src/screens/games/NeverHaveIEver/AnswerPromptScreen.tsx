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
import { getSocket } from '../../../utils/socket';
import { getUserId } from '../../../utils/constants';

type Props = NativeStackScreenProps<any, "AnswerPromptScreen">;

const AnswerPromptScreen: React.FC<Props> = ({ navigation, route }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitted, setSubmitted] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const hasNavigatedRef = React.useRef(false);
  const roomId = route?.params?.roomId;

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    socket.on('nhie:roomUpdate', (room) => {
      if (room.roomId !== roomId) return;
      if (room.currentPrompt) setPromptText(room.currentPrompt.text || 'Waiting for prompt...');
      if (!hasNavigatedRef.current) {
        if (room.currentPrompt && room.currentPrompt.gamePhase === 'reviewing') {
          hasNavigatedRef.current = true;
          navigation.navigate('ReviewAnswersScreen', { roomId });
        } else if (room.currentPrompt && room.currentPrompt.gamePhase === 'typing') {
          hasNavigatedRef.current = true;
          const idx = room.players.findIndex(p => p.userId === userId);
          if (idx === room.chanceIndex) {
            navigation.navigate('SubmitPromptScreen', { roomId });
          } else {
            navigation.navigate('WaitingForPromptScreen', { roomId });
          }
        }
      }
    });
    return () => {
      socket.off('nhie:roomUpdate');
    };
  }, [navigation, roomId, userId]);

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
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!submitted) {
            handleSubmit('Skipped');
            setSkipped(true);
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const handleSubmit = (
    response: 'I Have' | 'I Have Not' | 'Skipped'
  ) => {
    if (submitted || !userId) return;
    const socket = getSocket();
    socket.emit('nhie:submitAnswer', { roomId, userId, response });
    setSubmitted(true);
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
