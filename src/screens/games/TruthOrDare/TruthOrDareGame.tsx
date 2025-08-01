import React, { useEffect, useState, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, StyleSheet, ImageBackground, TouchableOpacity, Platform, Animated, StatusBar, Keyboard } from "react-native";
import io from "socket.io-client";
import LottieView from "lottie-react-native";
import BackButton from "../../../components/BackButton";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [nextRoundCalled, setNextRoundCalled] = useState(false);
  const [pointsAnim, setPointsAnim] = useState({ show: false, value: 0 });
  const pointsAnimValue = useRef(new Animated.Value(0)).current;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [autoProgressTimer, setAutoProgressTimer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(5);

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
      console.log(`State update received: round ${gameState.round}, state: ${gameState.state}`);
      setGame(gameState);
      setRound(gameState.round);
      setChanceHolder(gameState.chanceHolder);
      
      // Reset feedback when a new round starts
      if (gameState.state === "waitingForChoice") {
        console.log("New round starting - resetting feedback state");
        setFeedbackGiven(false);
        setNextRoundCalled(false);
        // Clear any existing timer
        if (autoProgressTimer) {
          clearInterval(autoProgressTimer);
          setAutoProgressTimer(null);
        }
      }
      
      // Start auto-progression timer when entering review phase
      if (gameState.state === "review") {
        console.log("Entering review phase - starting 5 second timer");
        setTimeRemaining(5);
        const timer = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setAutoProgressTimer(null);
              
              // Only auto-give "up" feedback if user hasn't given feedback yet AND they are the rater
              if (!feedbackGiven && gameState.chanceHolder !== userId) {
                console.log("Timer expired: Auto-giving up feedback for non-responsive player");
                handleFeedback('up', true); // true indicates auto-feedback
              } else {
                // If feedback was already given or user is not the rater, just progress
                console.log(`Timer expired: Progressing to next round (feedbackGiven: ${feedbackGiven}, isRater: ${gameState.chanceHolder !== userId})`);
                if (gameState.round < 4) {
                  handleNextRound();
                } else {
                  setPhase("gameCompleted");
                }
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setAutoProgressTimer(timer);
      }
      
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

    socket.on("td:gameCompleted", (gameState) => {
      console.log("Game completed event received");
      setGame(gameState);
      setPhase("gameCompleted");
      // Clear any timers
      if (autoProgressTimer) {
        clearInterval(autoProgressTimer);
        setAutoProgressTimer(null);
      }
    });

    return () => {
      socket.disconnect();
      // Clear timer on cleanup
      if (autoProgressTimer) {
        clearInterval(autoProgressTimer);
      }
    };
  }, [userId]);

  // Keyboard visibility listener
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

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
    if (nextRoundCalled) return; // Prevent multiple calls
    console.log(`Requesting next round from round ${round}`);
    setNextRoundCalled(true);
    socketRef.current.emit("td:nextRound", { roomId });
  };

  const handleFeedback = async (type, isAuto = false) => {
    if (feedbackGiven) {
      console.log("Feedback already given, ignoring duplicate attempt");
      return;
    }
    
    console.log(`Giving feedback: ${type} (auto: ${isAuto})`);
    setFeedbackGiven(true);
    
    // Clear the auto-progression timer when feedback is given manually
    if (!isAuto && autoProgressTimer) {
      console.log("Clearing auto-progression timer due to manual feedback");
      clearInterval(autoProgressTimer);
      setAutoProgressTimer(null);
    }
    
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

      console.log(`Feedback sent successfully: ${type}, Game: ${game?._id}, Round: ${round}, ChanceHolder: ${game?.chanceHolder}`);
    } catch (e) {
      console.error('Error sending feedback:', e);
    }
    
    // Auto-progress after feedback (both manual and auto)
    setTimeout(() => {
      console.log(`Progressing after feedback - Round: ${round}`);
      if (round < 4) {
        handleNextRound();
      } else {
        setPhase("gameCompleted");
      }
    }, isAuto ? 500 : 1500); // Shorter delay for auto, longer for manual to show animation
  };

  const renderCartooneyButton = (label, onPress, disabled = false, style = {}) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.modernButton, disabled && styles.buttonDisabled, style]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={disabled ? ['#444', '#666'] : ['#ff6b35', '#f7931e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.buttonGradient}
      >
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (phase) {
      case "waitingForMatch": return (
        <View style={styles.contentContainer}>
          <View style={styles.loadingCard}>
            <LottieView source={require("../../../assets/animations/sword-clashing.json")} autoPlay loop style={styles.lottie} />
            <Text style={styles.modernText}>Finding your opponent...</Text>
            <Text style={styles.subText}>Prepare for the ultimate truth or dare challenge!</Text>
          </View>
        </View>
      );
      case "opponentLeft": return (
        <View style={styles.contentContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="person-remove" size={48} color="#ff6b6b" />
            <Text style={styles.modernText}>Opponent left the game</Text>
            <Text style={styles.subText}>Don't worry, you can find another match!</Text>
          </View>
        </View>
      );
      case "choose": return (
        <View style={styles.choiceContainer}>
          <Text style={styles.choiceTitle}>Make Your Choice</Text>
          <Text style={styles.choiceSubtitle}>What will it be this round?</Text>
          
          <View style={styles.splitChoiceContainer}>
            <View style={styles.diagonalSlash} />
            
            <TouchableOpacity onPress={() => handleChoice("truth")} style={styles.truthButton}>
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.choiceButtonGradient}
              >
                <Ionicons name="help-circle" size={32} color="white" />
                <Text style={styles.choiceButtonText}>TRUTH</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => handleChoice("dare")} style={styles.dareButton}>
              <LinearGradient
                colors={['#fa709a', '#fee140']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.choiceButtonGradient}
              >
                <Ionicons name="flash" size={32} color="white" />
                <Text style={styles.choiceButtonText}>DARE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      );
      
      case "waitForChoice": return (
        <View style={styles.contentContainer}>
          <View style={styles.waitingCard}>
            <Ionicons name="hourglass" size={48} color="#ff6b35" />
            <Text style={styles.modernText}>Opponent is choosing...</Text>
            <Text style={styles.subText}>Get ready for their decision!</Text>
          </View>
        </View>
      );
      case "askTruth": return (
        <View style={styles.contentContainer}>
          <View style={styles.inputCard}>
            <Ionicons name="help-circle" size={48} color="#4facfe" />
            <Text style={styles.modernText}>Ask a Truth Question</Text>
            <Text style={styles.subText}>Make it interesting and thought-provoking!</Text>
            <TextInput 
              style={styles.modernInput} 
              value={input} 
              onChangeText={setInput} 
              placeholder="What's your question?" 
              placeholderTextColor="#999"
              multiline
            />
            {renderCartooneyButton("Submit Question", handleSubmitQuestion, !input.trim())}
          </View>
        </View>
      );
      case "waitForQuestion": return (
        <View style={styles.contentContainer}>
          <View style={styles.waitingCard}>
            <Ionicons name="create" size={48} color="#4facfe" />
            <Text style={styles.modernText}>Waiting for question...</Text>
            <Text style={styles.subText}>Your opponent is crafting the perfect question!</Text>
          </View>
        </View>
      );
      case "answerTruth": return (
        <View style={styles.contentContainer}>
          <View style={styles.inputCard}>
            <Ionicons name="chatbubble-ellipses" size={48} color="#4facfe" />
            <Text style={styles.modernText}>Your Truth Question:</Text>
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{game?.truthQuestion}</Text>
            </View>
            <TextInput 
              style={styles.modernInput} 
              value={input} 
              onChangeText={setInput} 
              placeholder="Your honest answer..." 
              placeholderTextColor="#999"
              multiline
            />
            {renderCartooneyButton("Submit Answer", handleSubmitAnswer, !input.trim())}
          </View>
        </View>
      );
      case "waitForAnswer": return (
        <View style={styles.contentContainer}>
          <View style={styles.waitingCard}>
            <Ionicons name="time" size={48} color="#4facfe" />
            <Text style={styles.modernText}>Waiting for answer...</Text>
            <Text style={styles.subText}>Your opponent is thinking deeply!</Text>
          </View>
        </View>
      );
      case "review": return (
        <View style={styles.contentContainer}>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Round Review</Text>
            <View style={styles.qaContainer}>
              <View style={styles.questionSection}>
                <Ionicons name="help-circle" size={24} color="#4facfe" />
                <Text style={styles.sectionLabel}>Question</Text>
                <Text style={styles.questionText}>{game?.truthQuestion}</Text>
              </View>
              <View style={styles.answerSection}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#51cf66" />
                <Text style={styles.sectionLabel}>Answer</Text>
                <Text style={styles.answerText}>{game?.truthAnswer}</Text>
              </View>
            </View>
            
            {game && game.chanceHolder !== userId && !feedbackGiven && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackTitle}>Rate this answer</Text>
                <Text style={styles.timerText}>Auto-proceeds in {timeRemaining}s</Text>
                <View style={styles.feedbackRow}>
                  <TouchableOpacity onPress={() => handleFeedback('up')} style={styles.thumbBtn}>
                    <LinearGradient
                      colors={['#51cf66', '#40c057']}
                      style={styles.thumbGradient}
                    >
                      <Ionicons name="thumbs-up" size={32} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleFeedback('down')} style={styles.thumbBtn}>
                    <LinearGradient
                      colors={['#ff6b6b', '#fa5252']}
                      style={styles.thumbGradient}
                    >
                      <Ionicons name="thumbs-down" size={32} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {game && game.chanceHolder !== userId && feedbackGiven && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackTitle}>Feedback given!</Text>
                <Text style={styles.timerText}>Next round starting in {timeRemaining}s</Text>
              </View>
            )}
            
            {game && game.chanceHolder === userId && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackTitle}>Waiting for opponent's rating...</Text>
                <Text style={styles.timerText}>Auto-proceeds in {timeRemaining}s</Text>
              </View>
            )}
            
            {pointsAnim.show && (
              <Animated.Text style={[
                styles.pointsAnimation,
                {
                  color: pointsAnim.value > 0 ? '#51cf66' : '#ff6b6b',
                  opacity: pointsAnimValue,
                  transform: [{ 
                    translateY: pointsAnimValue.interpolate({ 
                      inputRange: [0, 1], 
                      outputRange: [30, -30] 
                    }) 
                  }],
                }
              ]}>
                {pointsAnim.value > 0 ? `+${pointsAnim.value}` : `${pointsAnim.value}`}
              </Animated.Text>
            )}
            
            {round >= 4 && feedbackGiven && (
              <View style={styles.gameCompleteSection}>
                <Ionicons name="trophy" size={48} color="#ffd43b" />
                <Text style={styles.gameCompleteText}>Game Completed!</Text>
                <Text style={styles.gameCompleteSubtext}>You can check you scores in leaderboard</Text>
              </View>
            )}
          </View>
        </View>
      );
      case "gameCompleted": return (
        <View style={styles.contentContainer}>
          <View style={styles.gameCompleteSection}>
            <Ionicons name="trophy" size={48} color="#ffd43b" />
            <Text style={styles.gameCompleteText}>Game Completed!</Text>
            <Text style={styles.gameCompleteSubtext}>Thanks for playing Truth or Dare</Text>
          </View>
        </View>
      );
      default: return <Text style={styles.cartooneyText}>Loading...</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <BackButton title="Truth or Dare" />
      <ImageBackground source={require('../../../../assets/gameScreenImages/brick-bg.png')} style={styles.bg} resizeMode="cover">
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.darkOverlay}
        />
        <View style={styles.overlay}>
          {round && phase !== "waitingForMatch" && !isKeyboardVisible && (
            <View style={styles.roundHeader}>
              <LinearGradient
                colors={['#ff6b35', '#f7931e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.roundGradient}
              >
                <Text style={styles.roundText}>Round {round}/4</Text>
              </LinearGradient>
            </View>
          )}
          {showMatchStarting ? (
            <View style={styles.matchStartingContainer}>
              <LinearGradient
                colors={['rgba(255, 107, 53, 0.1)', 'rgba(247, 147, 30, 0.1)']}
                style={styles.startingCard}
              >
                <Text style={styles.matchStartingText}>Game Starting</Text>
                <Text style={styles.matchStartingTimer}>{timer}</Text>
                <Animated.View style={{ 
                  width: 120, 
                  height: 120, 
                  alignSelf: 'center', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  transform: [{ scale: swordAnim }] 
                }}>
                  <LottieView source={require("../../../assets/animations/sword-clashing.json")} autoPlay loop style={{ width: '100%', height: '100%' }} />
                </Animated.View>
              </LinearGradient>
            </View>
          ) : renderContent()}
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 2,
  },
  
  // Round Header Styles
  roundHeader: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    zIndex: 5,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  roundGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  roundText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  // Content Container
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  
  // Modern Card Styles
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  errorCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  waitingCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  inputCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 450,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Choice Container
  choiceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingTop: 60,
  },
  choiceTitle: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  choiceSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  splitChoiceContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    maxHeight: 400,
  },
  diagonalSlash: {
    position: 'absolute',
    width: '120%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    top: '50%',
    left: '-10%',
    transform: [{ rotate: '-45deg' }],
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  truthButton: {
    position: 'absolute',
    top: '20%',
    left: '8%',
    zIndex: 2,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dareButton: {
    position: 'absolute',
    bottom: '20%',
    right: '8%',
    zIndex: 2,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#fa709a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  choiceButtonGradient: {
    paddingVertical: 25,
    paddingHorizontal: 35,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 140,
  },
  choiceButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Text Styles
  modernText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 5,
  },
  
  // Input Styles
  modernInput: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    padding: 15,
    width: '100%',
    marginVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  // Button Styles
  modernButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 15,
    elevation: 5,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 150,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  
  // Review Styles
  reviewTitle: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  qaContainer: {
    marginBottom: 25,
  },
  questionSection: {
    backgroundColor: 'rgba(79, 172, 254, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4facfe',
  },
  answerSection: {
    backgroundColor: 'rgba(81, 207, 102, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#51cf66',
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
    fontWeight: '500',
  },
  answerText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
    fontWeight: '500',
  },
  questionCard: {
    backgroundColor: 'rgba(79, 172, 254, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(79, 172, 254, 0.3)',
    width: '100%',
  },
  
  // Feedback Styles
  feedbackSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  feedbackTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  timerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  thumbBtn: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  thumbGradient: {
    padding: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Animation Styles
  pointsAnimation: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  // Game Complete Styles
  nextRoundSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  gameCompleteSection: {
    alignItems: 'center',
    marginTop: 20,
    padding: 20,
  },
  gameCompleteText: {
    fontSize: 28,
    color: '#ffd43b',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gameCompleteSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Match Starting Styles
  matchStartingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  startingCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: '90%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  matchStartingText: {
    color: '#ff6b35',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  matchStartingTimer: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  // Lottie Animation
  lottie: {
    width: 120,
    height: 120,
    marginBottom: 20,
    alignSelf: 'center',
  },
  
  // Legacy Styles (for compatibility)
  cartooneyText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
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
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default TruthOrDareGame; 
