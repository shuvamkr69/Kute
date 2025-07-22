import React, { useEffect, useState, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, ImageBackground, TouchableOpacity, Platform } from "react-native";
import io from "socket.io-client";
import LottieView from "lottie-react-native";
import BackButton from "../../../components/BackButton";
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../utils/api';
// Import the brick background

const SOCKET_URL = "http://10.21.39.161:3000"; // TODO: Replace with your backend URL

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
  const [pointsAnim, setPointsAnim] = useState<{show: boolean, value: number}>({show: false, value: 0});
  const pointsAnimValue = useRef(new Animated.Value(0)).current;

  // Load real userId from AsyncStorage
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
      // Start timer and animation
      let t = 5;
      const interval = setInterval(() => {
        t -= 1;
        setTimer(t);
        if (t === 0) {
          clearInterval(interval);
          // Animate sword to grow
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

  // Handlers
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

  // Feedback handler
  const handleFeedback = async (type) => {
    if (feedbackGiven) return;
    setFeedbackGiven(true);
    const delta = type === 'up' ? 10 : -10;
    setPointsAnim({show: true, value: delta});
    Animated.sequence([
      Animated.timing(pointsAnimValue, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(pointsAnimValue, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start(() => setPointsAnim({show: false, value: 0}));
    try {
      await api.post('/api/v1/users/td/feedback', {
        gameId: game?._id,
        roundNumber: round,
        userId,
        feedback: type
      });
    } catch (e) {
      // Optionally show error
    }
  };

  // UI
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

  const renderCard = (children, style = {}) => (
    <View style={[styles.card, style]}>{children}</View>
  );

  const renderContent = () => {
    if (phase === "waitingForMatch") {
      return renderCard(
        <>
          <LottieView
            source={require("../../../assets/animations/sword-clashing.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={styles.cartooneyText}>Waiting for an opponent</Text>
        </>
      );
    }
    if (phase === "opponentLeft") {
      return renderCard(<Text style={styles.cartooneyText}>Opponent left the game.</Text>);
    }
    if (phase === "choose") {
      return renderCard(
        <>
          <Text style={styles.roundText}>Round {round}</Text>
          <Text style={styles.cartooneyText}>You are the chance holder. Choose:</Text>
          {renderCartooneyButton("Truth", () => handleChoice("truth"), false, { backgroundColor: '#6ec6ff' })}
          {/* {renderCartooneyButton("Dare", () => handleChoice("dare"), true, { backgroundColor: '#ffb347' })} */}
        </>
      );
    }
    if (phase === "waitForChoice") {
      return renderCard(<Text style={styles.cartooneyText}>Waiting for other player to choose...</Text>);
    }
    if (phase === "askTruth") {
      return renderCard(
        <>
          <Text style={styles.cartooneyText}>Opponent chose Truth. Type your question:</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a truth question..."
            placeholderTextColor="#bdbdbd"
          />
          {renderCartooneyButton("Submit", handleSubmitQuestion, !input.trim(), { backgroundColor: '#ffd54f' })}
        </>
      );
    }
    if (phase === "waitForQuestion") {
      return renderCard(<Text style={styles.cartooneyText}>Waiting for opponent to give you a truth...</Text>);
    }
    if (phase === "answerTruth") {
      return renderCard(
        <>
          <Text style={styles.cartooneyText}>Your question:</Text>
          <Text style={styles.question}>{game?.truthQuestion}</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your answer..."
            placeholderTextColor="#bdbdbd"
          />
          {renderCartooneyButton("Submit", handleSubmitAnswer, !input.trim(), { backgroundColor: '#aed581' })}
        </>
      );
    }
    if (phase === "waitForAnswer") {
      return renderCard(<Text style={styles.cartooneyText}>Waiting for opponent to answer...</Text>);
    }
    if (phase === "review") {
      return renderCard(
        <>
          <Text style={styles.cartooneyText}>Review:</Text>
          <Text style={styles.question}>Q: {game?.truthQuestion}</Text>
          <Text style={styles.answer}>A: {game?.truthAnswer}</Text>
          {/* Thumbs feedback only for question giver, only if not given */}
          {game && game.chanceHolder === userId && !feedbackGiven && (
            <View style={styles.feedbackRow}>
              <TouchableOpacity onPress={() => handleFeedback('up')} style={styles.thumbBtn}>
                <Ionicons name="thumbs-up" size={48} color="#90caf9" style={{textShadowColor:'#000',textShadowRadius:4}} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleFeedback('down')} style={styles.thumbBtn}>
                <Ionicons name="thumbs-down" size={48} color="#e57373" style={{textShadowColor:'#000',textShadowRadius:4}} />
              </TouchableOpacity>
            </View>
          )}
          {/* Points animation */}
          {pointsAnim.show && (
            <Animated.Text
              style={{
                position: 'absolute',
                bottom: 80,
                alignSelf: 'center',
                fontSize: 36,
                color: pointsAnim.value > 0 ? '#90caf9' : '#e57373',
                fontWeight: 'bold',
                opacity: pointsAnimValue,
                transform: [{ translateY: pointsAnimValue.interpolate({inputRange:[0,1],outputRange:[30,-30]}) }],
                textShadowColor: '#000',
                textShadowRadius: 4,
              }}
            >
              {pointsAnim.value > 0 ? `+${pointsAnim.value}` : `${pointsAnim.value}`}
            </Animated.Text>
          )}
          {round < 3 && feedbackGiven
            ? renderCartooneyButton("Next Round", handleNextRound, false, { backgroundColor: '#ffb347' })
            : null}
          {round >= 3 && feedbackGiven
            ? <Text style={[styles.cartooneyText, { color: '#e57373', fontSize: 28 }]}>Game Over!</Text>
            : null}
        </>
      );
    }
    return renderCard(<Text style={styles.cartooneyText}>Loading...</Text>);
  };

  // Match Starting Screen
  const renderMatchStarting = () => (
    <View style={styles.matchStartingContainer}>
      <Text style={styles.matchStartingText}>Match is starting!</Text>
      <Text style={styles.matchStartingTimer}>{timer}</Text>
      <Animated.View style={{
        width: 180,
        height: 180,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scale: swordAnim }],
      }}>
        <LottieView
          source={require("../../../assets/animations/sword-clashing.json")}
          autoPlay
          loop
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
    </View>
  );

  return (
    <View style = {styles.backButtonContaine}>
      <BackButton title = {"Truth or Dare"}/>
    <ImageBackground source={require('../../../../assets/gameScreenImages/brick-bg.png')} style={styles.bg} resizeMode="cover">
      <View style={styles.darkOverlay} />
      <View style={styles.overlay}>
        {showMatchStarting ? (
          renderMatchStarting()
        ) : phase === "waitingForMatch" ? (
          <>
            {/* Instructions at the top */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>How to Play</Text>
              <Text style={styles.instructionsText}>
                1. Wait to be matched with an opponent. {'\n'}
                2. If you are the chance holder, choose "Truth" (or "Dare" in future). {'\n'}
                3. Ask or answer questions as prompted. {'\n'}
                4. Play up to 3 rounds. {'\n'}
                5. Have fun and be respectful!
              </Text>
            </View>
            {renderContent()}
            {/* Rules at the bottom */}
            <View style={styles.rulesContainer}>
              <Text style={styles.rulesTitle}>Rules</Text>
              <Text style={styles.rulesText}>
                • No inappropriate or offensive questions.{"\n"}
                • Be honest and respectful.{"\n"}
                • You can skip a question if you feel uncomfortable.{"\n"}
                • The game is for fun—don’t take it too seriously!
              </Text>
            </View>
          </>
        ) : (
          renderContent()
        )}
      </View>
    </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContaine:{
    flex: 1,
  },
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.0)',
    padding: 20,
    zIndex: 2,
  },
  card: {
    backgroundColor: '#181818',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    marginVertical: 20,
    minWidth: 300,
    maxWidth: 350,
    borderWidth: 2,
    borderColor: '#333',
  },
  cartooneyButton: {
    backgroundColor: '#222',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  input: {
    borderWidth: 2,
    borderColor: '#444',
    borderRadius: 18,
    padding: 12,
    width: 220,
    marginVertical: 12,
    backgroundColor: '#222',
    color: '#fff',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  cartooneyText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  roundText: {
    fontSize: 26,
    color: '#ff7043',
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  question: {
    fontWeight: 'bold',
    marginVertical: 10,
    fontSize: 20,
    color: '#90caf9',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  answer: {
    fontWeight: 'bold',
    marginVertical: 10,
    fontSize: 20,
    color: '#a5d6a7',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  lottie: {
    width: 180,
    height: 180,
    marginBottom: 10,
    alignSelf: 'center',
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: 'rgba(30,30,30,0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#444',
  },
  instructionsTitle: {
    color: '#ffd54f',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  instructionsText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  rulesContainer: {
    width: '100%',
    backgroundColor: 'rgba(30,30,30,0.85)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#444',
  },
  rulesTitle: {
    color: '#90caf9',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  rulesText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  matchStartingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  matchStartingText: {
    color: '#ffd54f',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  matchStartingTimer: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 32,
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
});

export default TruthOrDareGame; 