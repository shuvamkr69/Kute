import React, { useEffect, useState, useRef } from "react";
import { View, Text, Button, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import io from "socket.io-client";

const SOCKET_URL = "http://10.21.39.161:3000"; // TODO: Replace with your backend URL

const getUserId = () => {
  // TODO: Replace with actual user ID logic
  return Math.random().toString(36).substring(2, 10);
};

const TruthOrDareGame = () => {
  const [phase, setPhase] = useState("waiting");
  const [roomId, setRoomId] = useState(null);
  const [chanceHolder, setChanceHolder] = useState(null);
  const [userId] = useState(getUserId());
  const [opponentId, setOpponentId] = useState(null);
  const [choice, setChoice] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [game, setGame] = useState(null);
  const [round, setRound] = useState(1);
  const [input, setInput] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit("td:joinQueue", { userId });
    setPhase("waitingForMatch");

    socket.on("td:matched", ({ roomId, chanceHolder }) => {
      setRoomId(roomId);
      setChanceHolder(chanceHolder);
      setPhase(chanceHolder === userId ? "choose" : "waitForChoice");
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

  // UI
  if (phase === "waitingForMatch") {
    return <View style={styles.center}><ActivityIndicator size="large" /><Text>Waiting for another player...</Text></View>;
  }
  if (phase === "opponentLeft") {
    return <View style={styles.center}><Text>Opponent left the game.</Text></View>;
  }
  if (phase === "choose") {
    return (
      <View style={styles.center}>
        <Text>Round {round}</Text>
        <Text>You are the chance holder. Choose:</Text>
        <Button title="Truth" onPress={() => handleChoice("truth")} />
        {/* <Button title="Dare" onPress={() => handleChoice("dare")} disabled /> */}
      </View>
    );
  }
  if (phase === "waitForChoice") {
    return <View style={styles.center}><Text>Waiting for other player to choose...</Text></View>;
  }
  if (phase === "askTruth") {
    return (
      <View style={styles.center}>
        <Text>Opponent chose Truth. Type your question:</Text>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Type a truth question..." />
        <Button title="Submit" onPress={handleSubmitQuestion} disabled={!input.trim()} />
      </View>
    );
  }
  if (phase === "waitForQuestion") {
    return <View style={styles.center}><Text>Waiting for opponent to give you a truth...</Text></View>;
  }
  if (phase === "answerTruth") {
    return (
      <View style={styles.center}>
        <Text>Your question:</Text>
        <Text style={styles.question}>{game?.truthQuestion}</Text>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Type your answer..." />
        <Button title="Submit" onPress={handleSubmitAnswer} disabled={!input.trim()} />
      </View>
    );
  }
  if (phase === "waitForAnswer") {
    return <View style={styles.center}><Text>Waiting for opponent to answer...</Text></View>;
  }
  if (phase === "review") {
    return (
      <View style={styles.center}>
        <Text>Review:</Text>
        <Text>Q: {game?.truthQuestion}</Text>
        <Text>A: {game?.truthAnswer}</Text>
        {round < 3 ? <Button title="Next Round" onPress={handleNextRound} /> : <Text>Game Over!</Text>}
      </View>
    );
  }
  return <View style={styles.center}><Text>Loading...</Text></View>;
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, width: 250, marginVertical: 10 },
  question: { fontWeight: "bold", marginVertical: 10 },
});

export default TruthOrDareGame; 