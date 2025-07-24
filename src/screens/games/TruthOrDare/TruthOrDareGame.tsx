import React, { useEffect, useState, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, StyleSheet, ImageBackground, TouchableOpacity, Platform, Animated } from "react-native";
import io from "socket.io-client";
import LottieView from "lottie-react-native";
import BackButton from "../../../components/BackButton";
import { Ionicons } from '@expo/vector-icons';
import api from '../../../utils/api';

const SOCKET_URL = "http://10.21.39.161:3000";

const TruthOrDareGame = () => {
  const [phase, setPhase] = useState("waiting");
  const [roomId, setRoomId] = useState(null);
  const [chanceHolder, setChanceHolder] = useState(null);
  const [userId, setUserId] = useState(null);
  const [choice, setChoice] = useState(null);
  const [game, setGame] = useState(null);
  const [round, setRound] = useState(1);
  const [input, setInput] = useState("");
  const socketRef = useRef(null);
  const [showMatchStarting, setShowMatchStarting] = useState(false);
  const [timer, setTimer] = useState(5);
  const swordAnim = useRef(new Animated.Value(1)).current;
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [pointsAnim, setPointsAnim] = useState({ show: false, value: 0 });
  const pointsAnimValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('user').then(userString => {
      const user = userString ? JSON.parse(userString) : null;
      if (user && user._id) setUserId(user._id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit("td:joinQueue", { userId });
    setPhase("waitingForMatch");

    socket.on("td:matched", ({ roomId, chanceHolder }) => {
      setRoomId(roomId);
      setChanceHolder(chanceHolder);
      setShowMatchStarting(true);
      setTimer(5);
      let t = 5;
      const interval = setInterval(() => {
        t -= 1;
        setTimer(t);
        if (t === 0) {
          clearInterval(interval);
          Animated.timing(swordAnim, {
            toValue: 10,
            duration: 1200,
            useNativeDriver: false,
          }).start(() => {
            setShowMatchStarting(false);
            setPhase(chanceHolder === userId ? "choose" : "waitForChoice");
            swordAnim.setValue(1);
          });
        }
      }, 1000);
    });

    socket.on("td:stateUpdate", (gameState) => {
      setGame(gameState);
      setRound(gameState.round);
      setChanceHolder(gameState.chanceHolder);
      if (gameState.state === "waitingForChoice") {
        setPhase(gameState.chanceHolder === userId ? "choose" : "waitForChoice");
      } else if (gameState.state === "waitingForQuestion") {
        setPhase(gameState.chanceHolder === userId ? "waitForQuestion" : "askTruth");
      } else if (gameState.state === "waitingForAnswer") {
        setPhase(gameState.chanceHolder === userId ? "answerTruth" : "waitForAnswer");
      } else if (gameState.state === "review") {
        setPhase("review");
      }
    });

    socket.on("td:opponentLeft", () => {
      setPhase("opponentLeft");
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  if (!userId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#181818' }}>
        <Text style={{ color: '#fff', fontSize: 22 }}>Loading...</Text>
      </View>
    );
  }

  const handleChoice = (choice) => {
    setChoice(choice);
    socketRef.current.emit("td:makeChoice", { roomId, userId, choice });
  };

  const handleSubmitQuestion = () => {
    socketRef.current.emit("td:submitQuestion", { roomId, question: input });
    setInput("");
  };

  const handleSubmitAnswer = () => {
    socketRef.current.emit("td:submitAnswer", { roomId, answer: input });
    setInput("");
  };

  const handleNextRound = () => {
    socketRef.current.emit("td:nextRound", { roomId });
  };

  const handleFeedback = async (type) => {
    if (feedbackGiven) return;
    setFeedbackGiven(true);
    const delta = type === 'up' ? 10 : -10;
    setPointsAnim({ show: true, value: delta });
    Animated.sequence([
      Animated.timing(pointsAnimValue, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(pointsAnimValue, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start(() => setPointsAnim({ show: false, value: 0 }));
    try {
      await api.post('/api/v1/users/td/feedback', {
        gameId: game?._id,
        roundNumber: round,
        userId: game?.chanceHolder,
        feedback: type
      });

      console.log(game?._id, round, game?.chanceHolder, delta, type);
    } catch (e) { }
  };

  const renderCartooneyButton = (label, onPress, disabled = false, style = {}) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.cartooneyButton, disabled && styles.buttonDisabled, style]}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (phase) {
      case "waitingForMatch": return (
        <View style={styles.contentContainer}>
          <LottieView source={require("../../../assets/animations/sword-clashing.json")} autoPlay loop style={styles.lottie} />
          <Text style={styles.cartooneyText}>Waiting for an opponent</Text>
        </View>
      );
      case "opponentLeft": return (
        <View style={styles.contentContainer}><Text style={styles.cartooneyText}>Opponent left the game.</Text></View>
      );
      case "choose": return (
        <View style={styles.splitChoiceContainer}>
          {/* Diagonal Slash */}
          <View style={styles.diagonalSlash} />
      
          {/* Truth Button */}
          <TouchableOpacity onPress={() => handleChoice("truth")} style={styles.truthButton}>
            <Text style={styles.truthButton}>TRUTH</Text>
          </TouchableOpacity>
      
          {/* Dare Button */}
          <TouchableOpacity onPress={() => handleChoice("dare")} style={styles.dareButton}>
            <Text style={styles.dareButton}>DARE</Text>
          </TouchableOpacity>
        </View>
      );
      
      case "waitForChoice": return (
        <View style={styles.contentContainer}><Text style={styles.cartooneyText}>Your opponent is making a choice</Text></View>
      );
      case "askTruth": return (
        <View style={styles.contentContainer}>
          <Text style={styles.cartooneyText}>Ask a Question</Text>
          <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Type a truth question..." placeholderTextColor="#bdbdbd" />
          {renderCartooneyButton("Submit", handleSubmitQuestion, !input.trim(), { backgroundColor: '#ffd54f' })}
        </View>
      );
      case "waitForQuestion": return (
        <View style={styles.contentContainer}><Text style={styles.cartooneyText}>Waiting for a question</Text></View>
      );
      case "answerTruth": return (
        <View style={styles.contentContainer}>
          <Text style={styles.cartooneyText}>Your question:</Text>
          <Text style={styles.question}>{game?.truthQuestion}</Text>
          <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Type your answer..." placeholderTextColor="#bdbdbd" />
          {renderCartooneyButton("Submit", handleSubmitAnswer, !input.trim(), { backgroundColor: '#aed581' })}
        </View>
      );
      case "waitForAnswer": return (
        <View style={styles.contentContainer}><Text style={styles.cartooneyText}>Waiting for opponent to answer...</Text></View>
      );
      case "review": return (
        <View style={styles.contentContainer}>
          <Text style={styles.cartooneyText}>Review:</Text>
          <Text style={styles.question}>Q: {game?.truthQuestion}</Text>
          <Text style={styles.answer}>A: {game?.truthAnswer}</Text>
          {game && game.chanceHolder !== userId && !feedbackGiven && (
            <View style={styles.feedbackRow}>
              <TouchableOpacity onPress={() => handleFeedback('up')} style={styles.thumbBtn}><Ionicons name="thumbs-up" size={48} color="#90caf9" /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleFeedback('down')} style={styles.thumbBtn}><Ionicons name="thumbs-down" size={48} color="#e57373" /></TouchableOpacity>
            </View>
          )}
          {pointsAnim.show && (
            <Animated.Text style={{
              position: 'absolute', bottom: 80, alignSelf: 'center', fontSize: 36,
              color: pointsAnim.value > 0 ? '#90caf9' : '#e57373', fontWeight: 'bold',
              opacity: pointsAnimValue, transform: [{ translateY: pointsAnimValue.interpolate({ inputRange: [0, 1], outputRange: [30, -30] }) }],
              textShadowColor: '#000', textShadowRadius: 4,
            }}>{pointsAnim.value > 0 ? `+${pointsAnim.value}` : `${pointsAnim.value}`}</Animated.Text>
          )}
          {round < 3 && feedbackGiven && renderCartooneyButton("Next Round", handleNextRound)}
          {round >= 3 && feedbackGiven && <Text style={[styles.cartooneyText, { color: '#e57373', fontSize: 28 }]}>Game Completed</Text>}
        </View>
      );
      default: return <Text style={styles.cartooneyText}>Loading...</Text>;
    }
  };

  return (
    <View style={styles.backButtonContaine}>
      <BackButton title="Truth or Dare" />
      <ImageBackground source={require('../../../../assets/gameScreenImages/brick-bg.png')} style={styles.bg} resizeMode="cover">
        <View style={styles.darkOverlay} />
        <View style={styles.overlay}>
          {round && phase !== "waitingForMatch" && (
            <View style={styles.roundHeader}>
              <Text style={styles.roundText}>Round {round}</Text>
            </View>
          )}
          {showMatchStarting ? (
            <View style={styles.matchStartingContainer}>
              <Text style={styles.matchStartingText}>Game is Starting</Text>
              <Text style={styles.matchStartingTimer}>{timer}</Text>
              <Animated.View style={{ width: 180, height: 180, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', transform: [{ scale: swordAnim }] }}>
                <LottieView source={require("../../../assets/animations/sword-clashing.json")} autoPlay loop style={{ width: '100%', height: '100%' }} />
              </Animated.View>
            </View>
          ) : renderContent()}
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContaine: {
    flex: 1
  },
  bg: {
    flex: 1, width: '100%', height: '100%'
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1
  },
  overlay:
  {
    flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 2
  },
  roundHeader: {
    position: 'absolute', top: 60, alignSelf: 'center', zIndex: 5, backgroundColor: 'transparent', paddingVertical: 10, paddingHorizontal: 30,  borderColor: '#ff7043', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 10
  },
  roundText: {
    fontSize: 32, color: 'white', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2
  },
  contentContainer: {
    padding: 20, alignItems: 'center', justifyContent: 'center'
  },
  cartooneyButton: {
    backgroundColor: '#ffeb3b', borderRadius: 25, paddingVertical: 16, paddingHorizontal: 40, marginVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 8, borderWidth: 3, borderColor: 'white', transform: [{ rotate: '-2deg' }]
  },
  buttonText: {
    color: '#000', fontWeight: 'bold', fontSize: 24, letterSpacing: 1, textShadowColor: '#fff59d', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3, fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  input: {
    borderWidth: 2, borderColor: '#444', borderRadius: 18, padding: 12, width: 220, marginVertical: 12, backgroundColor: '#222', color: '#fff', fontSize: 18, fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace'
  },
  cartooneyText: {
    fontSize: 22, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginVertical: 10, fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2
  },
  question: {
    fontWeight: 'bold', marginVertical: 10, fontSize: 20, color: '#90caf9', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2
  },
  answer: {
    fontWeight: 'bold', marginVertical: 10, fontSize: 20, color: '#a5d6a7', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2
  },
  lottie: {
    width: 180, height: 180, marginBottom: 10, alignSelf: 'center'
  },
  matchStartingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%'
  },
  matchStartingText: {
    color: '#ffd54f', fontSize: 32, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace', textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4
  },
  matchStartingTimer: {
    color: '#fff', fontSize: 48, fontWeight: 'bold', marginBottom: 24, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace', textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4
  },
  feedbackRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, gap: 32
  },
  thumbBtn: {
    backgroundColor: '#222',
    borderRadius: 32,
    padding: 12,
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },

  splitChoiceContainer: {
  flex: 1,
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  paddingBottom: 40,
},

diagonalSlash: {
  position: 'absolute',
  width: '150%',
  height: 4,
  backgroundColor: '#fff',
  top: '55%',
  left: '-25%',
  transform: [{ rotate: '-45deg' }],
  zIndex: 1,
},

truthButton: {
  position: 'absolute',
  top: '25%',
  left: '10%',
  zIndex: 2,
  paddingVertical: 24,
  paddingHorizontal: 30,
  borderColor: 'white',
  borderWidth: 3,
  backgroundColor: '#42a5f5',
  borderRadius: 25,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 8,
},

dareButton: {
  position: 'absolute',
  bottom: '15%',
  right: '10%',
  zIndex: 2,
  paddingVertical: 24,
  paddingHorizontal: 30,
  borderColor: 'white',
  borderWidth: 3,
  backgroundColor: '#ef5350',
  borderRadius: 25,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 8,
},

  
});

export default TruthOrDareGame; 
