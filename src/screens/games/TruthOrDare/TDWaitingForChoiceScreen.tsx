import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../../../utils/api';

type Props = NativeStackScreenProps<any, 'TDWaitingForChoiceScreen'>;

const TDWaitingForChoiceScreen: React.FC<Props> = ({ navigation, route }) => {
  const { roomId, playerId } = route.params;

  useEffect(() => {
    const pollRoomState = async () => {
      try {
        const res = await api.get(`/api/v1/users/td/status?roomId=${roomId}`);
        if (res.data.state === 'waitingForQuestion') {
          navigation.replace('TDAskQuestionScreen', {
            roomId,
            playerId,
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    pollRoomState();
    const interval = setInterval(pollRoomState, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Waiting for other player to choose...</Text>
      <ActivityIndicator size="large" color="#ff69b4" />
    </View>
  );
};

export default TDWaitingForChoiceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, marginBottom: 20 },
});
