import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../../../utils/api';

type Props = NativeStackScreenProps<any, 'TDAnswerScreen'>;

const TDAnswerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { roomId, playerId, question } = route.params;
  const [answer, setAnswer] = useState('');

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    try {
      await api.post('/api/v1/users/td/answer', {
        roomId,
        answer,
      });
      navigation.replace('TDReviewScreen', {
        roomId,
        playerId,
        question,
        answer,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Question:</Text>
      <Text style={styles.question}>{question}</Text>
      <TextInput
        style={styles.input}
        placeholder="Type your answer here"
        value={answer}
        onChangeText={setAnswer}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Answer</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TDAnswerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  question: { fontSize: 20, marginBottom: 30, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ff69b4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18 },
});
