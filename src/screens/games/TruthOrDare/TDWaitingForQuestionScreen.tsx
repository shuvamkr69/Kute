import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../../../utils/api';

type Props = NativeStackScreenProps<any, 'TDWaitingForQuestionScreen'>;

const TDWaitingForQuestionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { roomId, playerId } = route.params;

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/v1/users/td/status?roomId=${roomId}`);
        if (res.data.state === 'waitingForAnswer') {
          navigation.replace('TDAnswerScreen', {
            roomId,
            playerId,
            question: res.data.truthQuestion,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Waiting for opponent to send a truth question...</Text>
      <ActivityIndicator size="large" color="#ff69b4" />
    </View>
  );
};

export default TDWaitingForQuestionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, marginBottom: 20 },
});
