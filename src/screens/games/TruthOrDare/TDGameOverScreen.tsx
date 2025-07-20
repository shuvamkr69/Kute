import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'TDGameOverScreen'>;

const TDGameOverScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Game Over! 🎉</Text>
      <Text style={styles.subtitle}>Thanks for playing Truth & Dare</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('GamesScreen')}
      >
        <Text style={styles.buttonText}>Back to Games</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TDGameOverScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 18, marginBottom: 30, textAlign: 'center' },
  button: {
    backgroundColor: '#ff69b4',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: { color: '#fff', fontSize: 18 },
});
