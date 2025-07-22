// WaitingForPromptScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, BackHandler } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import api from '../../../utils/api';
import { useFocusEffect } from '@react-navigation/native';
import { getSocket } from '../../../utils/socket';
import { getUserId } from '../../../utils/constants';

type Props = NativeStackScreenProps<any, "WaitingForPromptScreen">;

const WaitingForPromptScreen: React.FC<Props> = ({ navigation, route }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const roomId = route?.params?.roomId;

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    socket.on('nhie:roomUpdate', (room) => {
      if (!hasNavigated && room.roomId === roomId && room.currentPrompt && room.currentPrompt.promptSubmitted && room.currentPrompt.gamePhase === 'answering') {
        setHasNavigated(true);
        navigation.navigate('AnswerPromptScreen', { roomId });
      }
    });
    return () => {
      socket.off('nhie:roomUpdate');
    };
  }, [hasNavigated, navigation, roomId, userId]);





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



  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chance holder is deciding...</Text>
      <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
      <Text style={styles.subtitle}>Elapsed: {timeElapsed}s</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#555' }
});

export default WaitingForPromptScreen;
