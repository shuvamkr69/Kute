import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../../../utils/api';

type Props = NativeStackScreenProps<any, 'TDReviewScreen'>;

const TDReviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { roomId, playerId, question, answer, round, chanceHolder } = route.params;

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (round >= 5) {
        navigation.replace('TDGameOverScreen', { roomId, playerId });
      } else {
        try {
          await api.post('/api/v1/users/td/next', { roomId });
          navigation.replace('TDChoiceScreen', {
            roomId,
            playerId,
            chanceHolder: playerId === chanceHolder ? 'opponent' : playerId,
          });
        } catch (err) {
          console.error(err);
        }
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Question:</Text>
      <Text style={styles.content}>{question}</Text>
      <Text style={styles.label}>Answer:</Text>
      <Text style={styles.content}>{answer}</Text>
      <Text style={styles.subtext}>Next round starting soon...</Text>
    </View>
  );
};

export default TDReviewScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  label: { fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  content: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  subtext: { fontSize: 16, textAlign: 'center', marginTop: 30, color: 'gray' },
});
