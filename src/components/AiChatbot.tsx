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
  const [showInstructions, setShowInstructions] = useState(false);
  const screenHeight = Dimensions.get("window").height;
  const scrollRef = useRef<ScrollView>(null);

  // Animation refs
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;


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
          >
            {/* Professional Header */}
            <LinearGradient
              colors={["#de822c", "#ff172e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <Image
                    source={require("../assets/images/cupid.png")}
                    style={styles.headerIcon}
                  />
                  <View>
                    <Text style={styles.headerTitle}>Cupid AI Assistant</Text>
                    <Text style={styles.headerSubtitle}>Your dating advisor</Text>
                  </View>
                </View>
                <View style={styles.headerRight}>
                  <TouchableOpacity 
                    onPress={() => setShowInstructions(true)} 
                    style={styles.helpButton}
                  >
                    <Ionicons name="help-circle-outline" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            {/* Chat History Container */}
            <View style={styles.chatContainer}>
              <ScrollView style={styles.history} ref={scrollRef} showsVerticalScrollIndicator={false}>
                {adviceHistory.length === 0 && (
                  <View style={styles.welcomeContainer}>
                    <Ionicons name="heart" size={32} color="#de822c" />
                    <Text style={styles.welcomeTitle}>Welcome to Cupid AI!</Text>
                    <Text style={styles.welcomeText}>
                      Ask me anything about dating, relationships, or conversation tips. 
                      I'm here to help you make meaningful connections!
                    </Text>
                  </View>
                )}
                
                {adviceHistory.map((line, i) => {
                  const isUser = line.startsWith("Me:");
                  const isCupid = line.startsWith("Cupid:");

                  if (isCupid && i > 0 && adviceHistory[i - 1].startsWith("Me:")) {
                    return (
                      <View key={i} style={styles.qaBlock}>
                        <View style={styles.userMessageContainer}>
                          <View style={styles.userAvatar}>
                            <Ionicons name="person" size={14} color="white" />
                          </View>
                          <Text style={styles.userMessage}>
                            {adviceHistory[i - 1].replace("Me: ", "")}
                          </Text>
                        </View>
                        <View style={styles.cupidMessageContainer}>
                          <View style={styles.cupidAvatar}>
                            <Image
                              source={require("../assets/images/cupid.png")}
                              style={styles.cupidAvatarImage}
                            />
                          </View>
                          <Text style={styles.cupidMessage}>
                            {line.replace("Cupid: ", "")}
                          </Text>
                        </View>
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

                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#de822c" />
                    <Text style={styles.loadingText}>Cupid is thinking...</Text>
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Professional Input Section */}
            <View style={styles.inputSection}>
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Ask Cupid for dating advice..."
                  placeholderTextColor="#999"
                  value={userInput}
                  onChangeText={setUserInput}
                  style={styles.input}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  onPress={askCupid}
                  disabled={loading || !userInput.trim()}
                  style={[styles.sendButton, (!userInput.trim() || loading) && styles.sendButtonDisabled]}
                >
                  <LinearGradient
                    colors={userInput.trim() && !loading ? ["#de822c", "#ff172e"] : ["#444", "#666"]}
                    style={styles.sendButtonGradient}
                  >
                    <Ionicons 
                      name="send" 
                      size={18} 
                      color={userInput.trim() && !loading ? "white" : "#999"} 
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <Text style={styles.characterCount}>{userInput.length}/500</Text>
            </View>
          </Animated.View>

          {/* Instructions Modal */}
          <Modal
            visible={showInstructions}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowInstructions(false)}
          >
            <View style={styles.instructionsModalBackground}>
              <View style={styles.instructionsModal}>
                <LinearGradient
                  colors={["#de822c", "#ff172e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.instructionsHeader}
                >
                  <Text style={styles.instructionsTitle}>How to Use Cupid AI</Text>
                  <TouchableOpacity 
                    onPress={() => setShowInstructions(false)}
                    style={styles.instructionsClose}
                  >
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </LinearGradient>
                
                <ScrollView style={styles.instructionsContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.instructionItem}>
                    <Ionicons name="chatbubble-ellipses" size={20} color="#de822c" />
                    <View style={styles.instructionText}>
                      <Text style={styles.instructionTitle}>Ask for Conversation Starters</Text>
                      <Text style={styles.instructionDescription}>
                        "What should I say to break the ice?" or "Give me creative pickup lines"
                      </Text>
                    </View>
                  </View>

                  <View style={styles.instructionItem}>
                    <Ionicons name="heart" size={20} color="#de822c" />
                    <View style={styles.instructionText}>
                      <Text style={styles.instructionTitle}>Dating Advice</Text>
                      <Text style={styles.instructionDescription}>
                        "How do I plan a perfect first date?" or "What are red flags to watch for?"
                      </Text>
                    </View>
                  </View>

                  <View style={styles.instructionItem}>
                    <Ionicons name="text" size={20} color="#de822c" />
                    <View style={styles.instructionText}>
                      <Text style={styles.instructionTitle}>Message Analysis</Text>
                      <Text style={styles.instructionDescription}>
                        "How should I respond to their last message?" or "What does this message mean?"
                      </Text>
                    </View>
                  </View>

                  <View style={styles.instructionItem}>
                    <Ionicons name="person-add" size={20} color="#de822c" />
                    <View style={styles.instructionText}>
                      <Text style={styles.instructionTitle}>Profile Tips</Text>
                      <Text style={styles.instructionDescription}>
                        "How can I improve my dating profile?" or "What makes a good bio?"
                      </Text>
                    </View>
                  </View>

                  <View style={styles.instructionItem}>
                    <Ionicons name="shield-checkmark" size={20} color="#de822c" />
                    <View style={styles.instructionText}>
                      <Text style={styles.instructionTitle}>Relationship Guidance</Text>
                      <Text style={styles.instructionDescription}>
                        "How do I know if someone likes me?" or "When should I ask someone out?"
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tipBox}>
                    <Ionicons name="bulb" size={20} color="#ffd700" />
                    <Text style={styles.tipText}>
                      💡 Tip: Be specific with your questions for better advice!
                    </Text>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

// Professional and clean styles
const styles = StyleSheet.create({
  fab: {
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiIconImage: {
    width: 30,
    height: 30,
    shadowColor: '#de822c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    width: "92%",
    height: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: "#333",
    overflow: 'hidden',
  },
  
  // Professional Header Styles
  headerGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpButton: {
    padding: 6,
    marginRight: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Chat Container Styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  history: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    color: '#de822c',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Enhanced Message Styles
  qaBlock: {
    marginBottom: 16,
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  userMessageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#de822c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userMessage: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 10,
    borderBottomLeftRadius: 3,
  },
  cupidMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cupidAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#de822c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cupidAvatarImage: {
    width: 16,
    height: 16,
  },
  cupidMessage: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    backgroundColor: '#de822c',
    padding: 10,
    borderRadius: 10,
    borderBottomLeftRadius: 3,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    color: '#de822c',
    marginLeft: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },

  // Enhanced Input Section
  inputSection: {
    backgroundColor: '#242424',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: 'white',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#444',
    fontSize: 15,
    maxHeight: 80,
    marginRight: 10,
  },
  sendButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterCount: {
    color: '#888',
    fontSize: 12,
    textAlign: 'right',
  },

  // Instructions Modal Styles
  instructionsModalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '88%',
    maxHeight: '75%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  instructionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsClose: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    padding: 12,
    backgroundColor: '#242424',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  instructionText: {
    flex: 1,
    marginLeft: 10,
  },
  instructionTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  instructionDescription: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  tipText: {
    color: '#ffd700',
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },

  // Legacy styles for compatibility
  chatLine: {
    fontSize: 14.5,
    lineHeight: 22,
    marginBottom: 6,
    paddingHorizontal: 8,
    color: '#fff',
  },
  title: {
    color: "#de822c",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.8,
  },
  iconImage: {
    width: 25,
    height: 25,
    resizeMode: "contain",
    tintColor: "#de822c",
    marginLeft: 10,
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