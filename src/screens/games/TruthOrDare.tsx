import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { io } from 'socket.io-client';

const socket = io('http:// http://192.168.193.211:3000:3000'); // Replace with your backend server URL

const TruthDareScreen: React.FC<NativeStackScreenProps<any, 'TruthDare'>> = ({ route }) => {
  const { roomId, username } = route.params;
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>('Waiting for your turn...');
  const [choice, setChoice] = useState<'truth' | 'dare' | null>(null);
  const [inputText, setInputText] = useState<string>('');

  useEffect(() => {
    socket.emit('joinRoom', { roomId, username });

    socket.on('startGame', (data) => {
      setIsPlayerTurn(data.turn === username);
      setCurrentPrompt(data.turn === username ? 'Your turn! Choose Truth or Dare' : `${data.turn}'s turn`);
    });

    socket.on('prompt', (data) => {
      setCurrentPrompt(data.prompt);
      setIsPlayerTurn(data.nextTurn === username);
    });

    socket.on('endGame', () => {
      setCurrentPrompt('Game Over!');
      setIsPlayerTurn(false);
    });

    return () => {
      socket.off('startGame');
      socket.off('prompt');
      socket.off('endGame');
    };
  }, [username, roomId]);

  const chooseOption = (option: 'truth' | 'dare') => {
    setChoice(option);
    socket.emit('chooseOption', { roomId, choice: option });
  };

  const submitPrompt = () => {
    if (!inputText.trim()) return;
    socket.emit('submitPrompt', { roomId, prompt: inputText, choice });
    setInputText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Truth or Dare</Text>
      <Text style={styles.prompt}>{currentPrompt}</Text>

      {isPlayerTurn && !choice && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => chooseOption('truth')}>
            <Text style={styles.buttonText}>Truth</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => chooseOption('dare')}>
            <Text style={styles.buttonText}>Dare</Text>
          </TouchableOpacity>
        </View>
      )}

      {choice && !isPlayerTurn && (
        <View>
          <TextInput
            style={styles.input}
            placeholder={`Enter a ${choice} for your opponent...`}
            placeholderTextColor="#B0B0B0"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.addButton} onPress={submitPrompt}>
            <Text style={styles.addButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 32,
    color: '#de822c',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  prompt: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#de822c',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
    width: '100%',
  },
  addButton: {
    backgroundColor: '#FFA62B',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default TruthDareScreen;