// SubmitPromptScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import api from '../../../utils/api';
import { Alert, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSocket } from '../../../utils/socket';
import { getUserId } from '../../../utils/constants';

type Props = NativeStackScreenProps<any, "SubmitPromptScreen">;

const SubmitPromptScreen: React.FC<Props> = ({ navigation, route }) => {
  const [prompt, setPrompt] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [userId, setUserId] = useState<string | null>(null);
  const roomId = route?.params?.roomId;

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    socket.on('nhie:roomUpdate', (room) => {
      if (room.state === 'in_progress' && room.currentPrompt && room.currentPrompt.promptSubmitted) {
        navigation.navigate('NHIEWaitingForAnswersScreen', { roomId });
      }
    });
    return () => {
      socket.off('nhie:roomUpdate');
    };
  }, [navigation, roomId, userId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(          //leave waiing room if back button clicked
  React.useCallback(() => {
    const onBackPress = () => {
      Alert.alert(
        "Leave Waiting Room?",
        "Do you want to leave the waiting room?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Leave",
            style: "destructive",
            onPress: async () => {
              try {
                await api.post("/api/v1/users/neverhaveiever/leave");
              } catch (err) {
                console.error("Failed to leave waiting room:", err);
              }
              navigation.navigate("HomeTabs");
            },
          },
        ]
      );
      return true; // Block default behavior
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [])
);

  const handleSubmit = () => {
    if (!prompt.trim() || !userId) return;
    const socket = getSocket();
    socket.emit('nhie:submitPrompt', { roomId, userId, prompt });
  };


  return (
    <View style={styles.container}>
      <Text style={styles.timer}>⏳ Time Left: {timeLeft}s</Text>
      <Text style={styles.title}>Write your “Never Have I Ever”</Text>
      <TextInput
        value={prompt}
        onChangeText={setPrompt}
        placeholder="e.g., Never have I ever cheated on a test..."
        style={styles.input}
        multiline
      />
      <Button title="Submit Prompt" onPress={handleSubmit} disabled={!prompt.trim()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  timer: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
});

export default SubmitPromptScreen;
