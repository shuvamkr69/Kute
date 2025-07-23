import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  BackHandler,
  Pressable,
  Dimensions,
  TextInput,
  Button,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import api from "../../../utils/api";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import CustomAlert from "../../../components/CustomAlert";
import { getSocket } from '../../../utils/socket';
import { getUserId } from '../../../utils/constants';

const { width } = Dimensions.get("window");

type Step =
  | "groupSize"
  | "waitingRoom"
  | "submitPrompt"
  | "waitingForPrompt"
  | "answerPrompt"
  | "waitingForAnswers"
  | "reviewAnswers";

const NeverHaveIEverGameScreen: React.FC<any> = ({ navigation }) => {
  // State for all steps
  const [step, setStep] = useState<Step>("groupSize");
  const [waitingCounts, setWaitingCounts] = useState({ 2: 0, 3: 0, 4: 0 });
  const [groupSize, setGroupSize] = useState<number | null>(null);
  const [playersJoined, setPlayersJoined] = useState<number>(1);
  const [requiredPlayers, setRequiredPlayers] = useState<number>(2);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', onConfirm: null });
  // Prompt submission
  const [prompt, setPrompt] = useState('');
  const [promptTimeLeft, setPromptTimeLeft] = useState(120);
  // Waiting for prompt
  const [waitingPromptElapsed, setWaitingPromptElapsed] = useState(0);
  // Answer prompt
  const [answerTimeLeft, setAnswerTimeLeft] = useState(30);
  const [promptText, setPromptText] = useState("");
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [answerSkipped, setAnswerSkipped] = useState(false);
  // Waiting for answers
  const [waitingPrompt, setWaitingPrompt] = useState("");
  // Review answers
  const [answers, setAnswers] = useState<any[]>([]);
  const [reviewPrompt, setReviewPrompt] = useState("");
  const [reviewTimer, setReviewTimer] = useState(10);
  // Socket refs
  const hasNavigatedRef = useRef(false);

  // Get userId on mount
  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // Back handler for all steps
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        setCustomAlert({
          visible: true,
          title: "Leave Waiting Room?",
          message: "Do you want to leave the waiting room?",
          onConfirm: async () => {
            try {
              await api.post("/api/v1/users/neverhaveiever/leave");
            } catch (err) {
              //
            }
            setCustomAlert((prev) => ({ ...prev, visible: false }));
            navigation.navigate("HomeTabs");
          }
        });
        return true;
      };
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  // Group size selection logic
  useEffect(() => {
    if (step !== "groupSize") return;
    const fetchCounts = async () => {
      try {
        const res = await api.get("/api/v1/users/neverhaveiever/waiting-counts");
        setWaitingCounts(res.data.waitingCounts);
      } catch (err) {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 3000);
    return () => clearInterval(interval);
  }, [step]);

  const joinRoom = async (size: number) => {
    setGroupSize(size);
    try {
      await api.post("/api/v1/users/neverhaveiever/join", { groupSize: size });
      setStep("waitingRoom");
    } catch (err) {}
  };

  // Waiting room logic
  useEffect(() => {
    if (step !== "waitingRoom" || !userId) return;
    const socket = getSocket();
    socket.emit('nhie:joinRoom', { userId, groupSize });
    socket.on('nhie:roomUpdate', (room) => {
      setPlayersJoined(room.players.length);
      setRequiredPlayers(room.groupSize);
      setRoomId(room.roomId);
      if (room.state === 'in_progress') {
        const idx = room.players.findIndex(p => p.userId === userId);
        if (idx === room.chanceIndex) {
          setStep("submitPrompt");
        } else {
          setStep("waitingForPrompt");
        }
      }
    });
    return () => { socket.off('nhie:roomUpdate'); };
  }, [step, userId, groupSize]);

  // Prompt submission logic
  useEffect(() => {
    if (step !== "submitPrompt" || !userId) return;
    setPrompt("");
    setPromptTimeLeft(120);
    const socket = getSocket();
    socket.on('nhie:roomUpdate', (room) => {
      if (room.state === 'in_progress' && room.currentPrompt && room.currentPrompt.promptSubmitted) {
        setStep("waitingForAnswers");
      }
    });
    const timer = setInterval(() => {
      setPromptTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitPrompt();
        }
        return prev - 1;
      });
    }, 1000);
    return () => { socket.off('nhie:roomUpdate'); clearInterval(timer); };
  }, [step, userId, roomId]);

  const handleSubmitPrompt = () => {
    if (!prompt.trim() || !userId) return;
    const socket = getSocket();
    socket.emit('nhie:submitPrompt', { roomId, userId, prompt });
  };

  // Waiting for prompt logic
  useEffect(() => {
    if (step !== "waitingForPrompt" || !userId) return;
    setWaitingPromptElapsed(0);
    const socket = getSocket();
    socket.on('nhie:roomUpdate', (room) => {
      if (room.roomId === roomId && room.currentPrompt && room.currentPrompt.promptSubmitted && room.currentPrompt.gamePhase === 'answering') {
        setStep("answerPrompt");
      }
    });
    const timer = setInterval(() => setWaitingPromptElapsed(e => e + 1), 1000);
    return () => { socket.off('nhie:roomUpdate'); clearInterval(timer); };
  }, [step, userId, roomId]);

  // Answer prompt logic
  useEffect(() => {
    if (step !== "answerPrompt" || !userId) return;
    setAnswerTimeLeft(30);
    setAnswerSubmitted(false);
    setAnswerSkipped(false);
    setPromptText("");
    const socket = getSocket();
    socket.on('nhie:roomUpdate', (room) => {
      if (room.roomId !== roomId) return;
      if (room.currentPrompt) setPromptText(room.currentPrompt.text || 'Waiting for prompt...');
      if (!hasNavigatedRef.current) {
        if (room.currentPrompt && room.currentPrompt.gamePhase === 'reviewing') {
          hasNavigatedRef.current = true;
          setStep("reviewAnswers");
        } else if (room.currentPrompt && room.currentPrompt.gamePhase === 'typing') {
          hasNavigatedRef.current = true;
          const idx = room.players.findIndex(p => p.userId === userId);
          if (idx === room.chanceIndex) {
            setStep("submitPrompt");
          } else {
            setStep("waitingForPrompt");
          }
        }
      }
    });
    const timer = setInterval(() => {
      setAnswerTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!answerSubmitted) {
            handleSubmitAnswer('Skipped');
            setAnswerSkipped(true);
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => { socket.off('nhie:roomUpdate'); clearInterval(timer); };
  }, [step, userId, roomId, answerSubmitted]);

  const handleSubmitAnswer = (response: 'I Have' | 'I Have Not' | 'Skipped') => {
    if (answerSubmitted || !userId) return;
    const socket = getSocket();
    socket.emit('nhie:submitAnswer', { roomId, userId, response });
    setAnswerSubmitted(true);
  };

  // Waiting for answers logic
  useEffect(() => {
    if (step !== "waitingForAnswers") return;
    setWaitingPrompt("");
    const fetchPrompt = async () => {
      try {
        const res = await api.get("/api/v1/users/neverhaveiever/prompt-status");
        if (res.data.prompt) {
          setWaitingPrompt(res.data.prompt);
        }
      } catch (err) {}
    };
    fetchPrompt();
    const interval = setInterval(fetchPrompt, 3000);
    return () => clearInterval(interval);
  }, [step]);

  // Review answers logic (socket-only, no polling)
  useEffect(() => {
    if (!roomId || !userId) return;
    const socket = getSocket();
    const handler = (room) => {
      // Always update answers and prompt from the payload
      if (room.currentPrompt && room.currentPrompt.answers) {
        setAnswers(
          room.currentPrompt.answers.map(ans => ({
            userId: ans.userId,
            name: ans.name || '',
            avatar: ans.avatar || '',
            response: ans.response,
          }))
        );
      }
      if (room.currentPrompt && room.currentPrompt.text) {
        setReviewPrompt(room.currentPrompt.text);
      }
      // If phase is reviewing, transition to reviewAnswers
      if (room.currentPrompt && room.currentPrompt.gamePhase === 'reviewing') {
        setStep('reviewAnswers');
        hasNavigatedRef.current = false;
      }
      // If phase is typing, reset navigation ref for new round
      if (room.currentPrompt && room.currentPrompt.gamePhase === 'typing') {
        hasNavigatedRef.current = false;
      }
    };
    socket.on('nhie:roomUpdate', handler);
    return () => { socket.off('nhie:roomUpdate', handler); };
  }, [roomId, userId]);

  const triggerNextTurn = (room) => {
    if (!userId) return;
    const socket = getSocket();
    const idx = room.players.findIndex(p => p.userId === userId);
    if (idx === room.chanceIndex) {
      socket.emit('nhie:nextTurn', { roomId, userId });
      setStep("submitPrompt");
    } else {
      setStep("waitingForPrompt");
    }
  };

  // UI for each step
  let content = null;
  if (step === "groupSize") {
    content = (
      <LinearGradient colors={["#ff9a5a", "#ff6e40"]} style={styles.gradient}>
        <View style={styles.container}>
          <Text style={styles.title}>Select Group Size</Text>
          {[2, 3, 4].map((size) => (
            <Pressable
              key={size}
              onPress={() => joinRoom(size)}
              style={({ pressed }) => [
                styles.button,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={styles.buttonInner}>
                <Text style={styles.buttonText}>{size} Players</Text>
                <Text style={styles.countText}>{waitingCounts?.[size] ?? 0} waiting</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </LinearGradient>
    );
  } else if (step === "waitingRoom") {
    content = (
      <LinearGradient colors={["#ff172e", "#de822c"]} style={styles.gradient}>
        <View style={styles.container}>
          <Text style={styles.title}>Waiting Room</Text>
          <Text style={styles.subtitle}>Waiting for all players to join...</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>{playersJoined} / {requiredPlayers} players joined</Text>
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
            <Text style={styles.loadingHint}>Game will start automatically once all players are ready</Text>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Make sure everyone is ready to play 🎮</Text>
          </View>
        </View>
        <CustomAlert
          visible={customAlert.visible}
          title={customAlert.title}
          message={customAlert.message}
          onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
          onConfirm={customAlert.onConfirm}
          confirmText="Leave"
          cancelText="Cancel"
        />
      </LinearGradient>
    );
  } else if (step === "submitPrompt") {
    content = (
      <View style={styles.container}>
        <Text style={styles.timer}>⏳ Time Left: {promptTimeLeft}s</Text>
        <Text style={styles.title}>Write your “Never Have I Ever”</Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="e.g., Never have I ever cheated on a test..."
          style={styles.input}
          multiline
        />
        <Button title="Submit Prompt" onPress={handleSubmitPrompt} disabled={!prompt.trim()} />
      </View>
    );
  } else if (step === "waitingForPrompt") {
    content = (
      <View style={styles.container}>
        <Text style={styles.title}>Chance holder is deciding...</Text>
        <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
        <Text style={styles.subtitle}>Elapsed: {waitingPromptElapsed}s</Text>
      </View>
    );
  } else if (step === "answerPrompt") {
    content = (
      <View style={styles.container}>
        <Text style={styles.prompt}>{promptText}</Text>
        <Text style={styles.timer}>⏱ Time left: {answerTimeLeft}s</Text>
        <View style={styles.buttonGroup}>
          <Button
            title="🍷 I Have"
            onPress={() => handleSubmitAnswer("I Have")}
            disabled={answerSubmitted || answerSkipped}
            color="#8e44ad"
          />
          <Button
            title="🚫 I Have Not"
            onPress={() => handleSubmitAnswer("I Have Not")}
            disabled={answerSubmitted || answerSkipped}
            color="#c0392b"
          />
        </View>
        {answerSkipped && (
          <Text style={styles.skippedNote}>⚠️ You missed your chance to answer.</Text>
        )}
      </View>
    );
  } else if (step === "waitingForAnswers") {
    content = (
      <View style={styles.container}>
        <Text style={styles.title}>Waiting for others to answer...</Text>
        {waitingPrompt ? (
          <>
            <Text style={styles.promptText}>{waitingPrompt}</Text>
            <ActivityIndicator size="large" color="#8e44ad" style={{ marginTop: 30 }} />
          </>
        ) : (
          <Text style={styles.loading}>Loading prompt...</Text>
        )}
        <CustomAlert
          visible={customAlert.visible}
          title={customAlert.title}
          message={customAlert.message}
          onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
          onConfirm={customAlert.onConfirm}
          confirmText="Leave"
          cancelText="Cancel"
        />
      </View>
    );
  } else if (step === "reviewAnswers") {
    content = (
      <View style={styles.containerReview}>
        <Text style={styles.title}>Prompt:</Text>
        <Text style={styles.promptReview}>"{reviewPrompt}"</Text>
        <FlatList
          data={answers}
          renderItem={({ item }) => (
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
          )}
          keyExtractor={item => item.userId}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
        <Text style={styles.timer}>⏳ Next round in {reviewTimer}s...</Text>
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: width * 0.85,
    marginBottom: 20,
    elevation: 5,
  },
  buttonInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 20,
    color: "#333",
    fontWeight: "600",
  },
  countText: {
    fontSize: 16,
    color: "#ff6e40",
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
    opacity: 0.9,
    marginBottom: 30,
    textAlign: "center",
  },
  statusCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 28,
    borderRadius: 18,
    width: width * 0.85,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  statusText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  loadingHint: {
    marginTop: 20,
    fontSize: 14,
    color: "#fbe6e6",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 40,
  },
  footerText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  timer: { fontSize: 18, textAlign: 'center', marginBottom: 20, color: '#555' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 24,
    textAlignVertical: 'top',
    width: '100%',
    backgroundColor: '#fff',
  },
  prompt: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  buttonGroup: { gap: 16, width: "100%" },
  skippedNote: {
    marginTop: 24,
    fontSize: 16,
    color: "#c0392b",
    fontWeight: "500",
    textAlign: "center",
  },
  promptText: {
    fontSize: 20,
    color: "#333",
    textAlign: "center",
    paddingHorizontal: 10,
    marginBottom: 16,
    fontStyle: "italic",
  },
  loading: {
    fontSize: 16,
    color: "#aaa",
  },
  containerReview: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
    alignItems: 'center',
  },
  promptReview: {
    fontSize: 18,
    color: "#ddd",
    fontStyle: "italic",
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    width: width * 0.85,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  name: { fontSize: 16, color: "#fff" },
  have: { color: "#9b59b6", fontSize: 15 },
  not: { color: "#e74c3c", fontSize: 15 },
  skipped: { color: "#f1c40f", fontSize: 15 },
});

export default NeverHaveIEverGameScreen; 