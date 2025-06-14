// screens/TruthAnswerScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
type RootStackParamList = {
  MultiPlayerGame: { currentUserId: string };
  TruthAnswerScreen: { matchId: string; currentUserId: string };
  TruthPromptSelectionScreen: { matchId: string; currentUserId: string };
  TruthReviewScreen: { matchId: string; currentUserId: string; answer: string };
};



type Props = NativeStackScreenProps<RootStackParamList, 'TruthAnswerScreen'>;

const TruthAnswerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId, currentUserId } = route.params;
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    // API call to send answer would go here
    console.log('Answer submitted:', answer);
    // Navigate back or to next step
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Type your answer to the truth:</Text>
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        style={styles.input}
        placeholder="Type your answer..."
        placeholderTextColor="#777"
      />
      <TouchableOpacity onPress={handleSubmit} style={styles.button}>
        <Text style={styles.buttonText}>Submit Answer</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TruthAnswerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', padding: 20 },
  label: { color: '#fff', fontSize: 20, marginBottom: 16 },
  input: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
    borderWidth: 1,
    padding: 12,
    color: '#fff',
    borderRadius: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF6F61',
    padding: 14,
    borderRadius: 10,
  },
  buttonText: { color: '#fff', fontSize: 18, textAlign: 'center' },
});
