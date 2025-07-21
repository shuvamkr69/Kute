import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

const API = 'http://10.21.36.128:3000/api/v1/td'; // Update to your backend URL

type TDGameScreenProps = { playerId: string };

const TDGameScreen: React.FC<TDGameScreenProps> = ({ playerId }) => {
  const [status, setStatus] = useState('Joining...');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [chanceHolder, setChanceHolder] = useState<string | null>(null);
  const [game, setGame] = useState<any>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Join queue on mount
  useEffect(() => {
    setLoading(true);
    axios.post(`${API}/join`, { playerId })
      .then(res => {
        if (res.data.roomId) {
          setRoomId(res.data.roomId);
          setChanceHolder(res.data.chanceHolder);
          setStatus('Matched!');
        } else {
          setStatus('Waiting for opponent...');
        }
      })
      .catch(() => setStatus('Error joining'))
      .finally(() => setLoading(false));
  }, [playerId]);

  // Poll game state
  useEffect(() => {
    if (!roomId) return;
    pollRef.current = setInterval(() => {
      axios.get(`${API}/status?roomId=${roomId}`)
        .then(res => setGame(res.data))
        .catch(() => setStatus('Game ended or error.'));
    }, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roomId]);

  // Leave game
  const leaveGame = () => {
    if (roomId) axios.post(`${API}/leave`, { playerId, roomId });
    setRoomId(null);
    setGame(null);
    setStatus('Left game.');
  };

  // Actions
  const chooseTruth = () => {
    axios.post(`${API}/choose`, { roomId, playerId, choice: 'truth' });
  };
  const submitQuestion = () => {
    if (!question.trim()) return;
    axios.post(`${API}/question`, { roomId, question });
    setQuestion('');
  };
  const submitAnswer = () => {
    if (!answer.trim()) return;
    axios.post(`${API}/answer`, { roomId, answer });
    setAnswer('');
  };
  const nextRound = () => {
    axios.post(`${API}/next`, { roomId });
  };

  // UI logic
  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!roomId || !game) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{status}</Text>
        <TouchableOpacity style={styles.button} onPress={leaveGame}><Text style={styles.buttonText}>Leave</Text></TouchableOpacity>
      </View>
    );
  }
  const isChanceHolder = playerId === game.chanceHolder;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Round: {game.round}</Text>
      <Text style={styles.text}>You are {isChanceHolder ? 'the chance holder' : 'the other player'}</Text>
      <Text style={styles.text}>State: {game.state}</Text>
      {game.state === 'waitingForChoice' && isChanceHolder && (
        <TouchableOpacity style={styles.button} onPress={chooseTruth}><Text style={styles.buttonText}>Choose Truth</Text></TouchableOpacity>
      )}
      {game.state === 'waitingForChoice' && !isChanceHolder && (
        <Text style={styles.text}>Waiting for chance holder to choose...</Text>
      )}
      {game.state === 'waitingForQuestion' && !isChanceHolder && (
        <View style={{ width: '100%' }}>
          <TextInput
            style={styles.input}
            placeholder="Type your question..."
            value={question}
            onChangeText={setQuestion}
          />
          <TouchableOpacity style={styles.button} onPress={submitQuestion}><Text style={styles.buttonText}>Submit Question</Text></TouchableOpacity>
        </View>
      )}
      {game.state === 'waitingForQuestion' && isChanceHolder && (
        <Text style={styles.text}>Waiting for other player to ask a question...</Text>
      )}
      {game.state === 'waitingForAnswer' && isChanceHolder && (
        <View style={{ width: '100%' }}>
          <Text style={styles.text}>Question: {game.truthQuestion}</Text>
          <TextInput
            style={styles.input}
            placeholder="Type your answer..."
            value={answer}
            onChangeText={setAnswer}
          />
          <TouchableOpacity style={styles.button} onPress={submitAnswer}><Text style={styles.buttonText}>Submit Answer</Text></TouchableOpacity>
        </View>
      )}
      {game.state === 'waitingForAnswer' && !isChanceHolder && (
        <Text style={styles.text}>Waiting for answer...</Text>
      )}
      {game.state === 'review' && (
        <View style={{ width: '100%' }}>
          <Text style={styles.text}>Question: {game.truthQuestion}</Text>
          <Text style={styles.text}>Answer: {game.truthAnswer}</Text>
          <TouchableOpacity style={styles.button} onPress={nextRound}><Text style={styles.buttonText}>Next Round</Text></TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={styles.button} onPress={leaveGame}><Text style={styles.buttonText}>Leave Game</Text></TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  button: { backgroundColor: '#ff69b4', padding: 15, borderRadius: 10, marginVertical: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10, width: '100%' },
});

export default TDGameScreen; 