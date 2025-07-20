import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../../../utils/api';

type Props = NativeStackScreenProps<any, 'TDWaitingScreen'>;

const TDWaitingScreen: React.FC<Props> = ({ navigation, route }) => {
  const [status, setStatus] = useState('Waiting for opponent...');
  const playerId = route.params.playerId;
  const socketId = route.params.socketId; // Assuming you have this

  useEffect(() => {
    const joinGame = async () => {
      try {
        const res = await api.post('/api/v1/users/td/join', {
          playerId,
          socketId,
        });

        if (res.data.roomId) {
          navigation.replace('TDChoiceScreen', {
            roomId: res.data.roomId,
            playerId,
            chanceHolder: res.data.chanceHolder,
          });
        }
      } catch (error) {
        console.error(error);
      }
    };

    joinGame();
    const interval = setInterval(joinGame, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
      <ActivityIndicator size="large" color="#ff69b4" />
    </View>
  );
};

export default TDWaitingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, marginBottom: 20 },
});
