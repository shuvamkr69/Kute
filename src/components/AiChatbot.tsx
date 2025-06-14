//5de383
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import api from "../utils/api";
import { Animated, PanResponder, Dimensions } from "react-native";
import BackButton from "./BackButton";
import { Ionicons } from "@expo/vector-icons";

type Message = {
  _id: string;
  text: string;
  senderId: string;
};

type Props = {
  messages: Message[];
  loggedInUserId: string;
};

const AiChatbot: React.FC<Props> = ({ messages, loggedInUserId }) => {
  const [visible, setVisible] = useState(false);
  const [adviceHistory, setAdviceHistory] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const screenHeight = Dimensions.get("window").height;
  const scrollRef = useRef<ScrollView>(null);

  // Animation refs
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Swipe down handler
  const modalPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        closeModal();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const limitedMessages = messages.slice(-10);
  const safeMessages = limitedMessages.map((msg) => ({
    ...msg,
    text: msg.text.slice(0, 1000),
  }));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [adviceHistory]);

  const askCupid = async () => {
    if (!userInput.trim()) return;

    setAdviceHistory((prev) => [...prev, `Me: ${userInput}`]);
    setLoading(true);
    try {
      const res = await api.post("/api/v1/users/aiChatbot/advice", {
        chatMessages: messages,
        loggedInUserId,
        userInput,
      });

      const responseText =
        res.data?.response || "Cupid's lost in love... try again!";
      setAdviceHistory((prev) => [...prev, `Cupid: ${responseText}`]);
    } catch (err) {
      setAdviceHistory((prev) => [
        ...prev,
        `Cupid: Sorry, something went wrong.`,
      ]);
    } finally {
      setUserInput("");
      setLoading(false);
    }
  };

  const openModal = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1)),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.back(1)),
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  return (
    <>
      <TouchableOpacity onPress={openModal} style={styles.fab}>
        <Image
          source={require("../assets/images/cupid.png")}
          style={styles.aiIconImage}
        />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalBackground}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY }],
                opacity,
              },
            ]}
            {...modalPanResponder.panHandlers}
          >
            <View>
              <Text style={styles.title}>Ask Cupid</Text>
              <Ionicons
                name="close-circle-outline"
                size={30}
                color="#de822c"
                style={styles.closeBtn}
                onPress={closeModal}
              />
            </View>
            <ScrollView style={styles.history} ref={scrollRef}>
              {adviceHistory.map((line, i) => {
                const isUser = line.startsWith("Me:");
                const isCupid = line.startsWith("Cupid:");

                if (isCupid && i > 0 && adviceHistory[i - 1].startsWith("Me:")) {
                  return (
                    <View key={i} style={styles.qaBlock}>
                      <Text style={[styles.chatLine, styles.userMessage]}>
                        {adviceHistory[i - 1]}
                      </Text>
                      <Text style={[styles.chatLine, styles.cupidMessage]}>
                        {line}
                      </Text>
                    </View>
                  );
                }

                if (isUser) return null;

                return (
                  <Text key={i} style={styles.chatLine}>
                    {line}
                  </Text>
                );
              })}

              {loading && <ActivityIndicator size="small" color="#de822c" />}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Whats on your mind..."
                placeholderTextColor="#888"
                value={userInput}
                onChangeText={setUserInput}
                style={styles.input}
              />
              <TouchableOpacity
                onPress={askCupid}
                disabled={loading || !userInput.trim()}
              >
                <Image
                  source={require("../assets/icons/send-message.png")}
                  style={styles.iconImage}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

// Keep all your existing styles exactly the same
const styles = StyleSheet.create({
  fab: {
    borderRadius: 30,
    padding: 10,
    elevation: 5,
  },
  aiIconImage: {
    width: 30,
    height: 30,
  },
  qaBlock: {
    marginBottom: 20,
    backgroundColor: "#181818",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  iconImage: {
    width: 25,
    height: 25,
    resizeMode: "contain",
    tintColor: "#de822c",
    marginLeft: 10,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "black",
    padding: 20,
    borderRadius: 24,
    width: "92%",
    height: "80%",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#2b2b2b",
  },
  title: {
    color: "#de822c",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.8,
  },
  history: {
    flex: 1,
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  chatLine: {
    fontSize: 14.5,
    lineHeight: 22,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  cupidMessage: {
    color: "#00FFFF",
    fontStyle: "italic",
  },
  userMessage: {
    color: "#E0E0E0",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    color: "white",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    fontSize: 14,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 8,
    shadowColor: "#de822c",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
  closeBtn: {
    position: "absolute",
    right: 0,
    marginTop: 0,
  },
  closeText: {
    color: "#de822c",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default AiChatbot;