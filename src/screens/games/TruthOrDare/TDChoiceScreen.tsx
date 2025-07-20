import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../../../utils/api';

type Props = NativeStackScreenProps<any, 'TDChoiceScreen'>;

const TDChoiceScreen: React.FC<Props> = ({ navigation, route }) => {
  const { roomId, playerId, chanceHolder } = route.params;

  useEffect(() => {
    if (playerId !== chanceHolder) {
      navigation.replace('TDWaitingForChoiceScreen', {
        roomId,
        playerId,
        chanceHolder,
      });
    }
  }, []);

  const chooseTruth = async () => {
    try {
      await api.post('/api/v1/users/td/choose', {
        roomId,
        playerId,
        choice: 'truth',
      });

      navigation.replace('TDWaitingForQuestionScreen', {
        roomId,
        playerId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Turn!</Text>
      <TouchableOpacity style={styles.button} onPress={chooseTruth}>
        <Text style={styles.buttonText}>Choose Truth</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TDChoiceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
  button: {
    backgroundColor: '#ff69b4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: { color: '#fff', fontSize: 18 },
});
