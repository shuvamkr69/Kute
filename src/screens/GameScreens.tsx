import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Games'>;

const GameCard = ({ name, image, onPress }: { name: string; image: any; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.card}>
    <ImageBackground source={image} style={styles.image} imageStyle={{ borderRadius: 15 }}>
      <View style={styles.overlay}>
        <Text style={styles.gameName}>{name}</Text>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

const GamesScreen: React.FC<Props> = ({ navigation }) => {
  const handlePlay = (game: string) => {
    console.log(`Playing ${game}`);
    navigation.navigate(`${game}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Games</Text>
      <Text style={styles.subtitle}>Play and break the ice!</Text>

      <View style={styles.grid}>
        <GameCard name="Truth or Dare 🔥" image={require('../assets/gameScreenImages/truth-or-dare_orig.png')} onPress={() => handlePlay('TruthDare')} />
        <GameCard name="Would You Rather ❓" image={require('../assets/gameScreenImages/would-you-rather-questions.jpg')} onPress={() => handlePlay('Would You Rather')} />
        <GameCard name="Couple Quiz 💕" image={require('../assets/gameScreenImages/would-you-rather-questions.jpg')} onPress={() => handlePlay('Couple Quiz')} />
        <GameCard name="Flirty Questions 💌" image={require('../assets/gameScreenImages/flirty-questions.jpeg')} onPress={() => handlePlay('Flirty Questions')} />
        <GameCard name="Never Have I Ever 🍸" image={require('../assets/gameScreenImages/never-have-i-ever.jpeg')} onPress={() => handlePlay('Never Have I Ever')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 5,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#de822c',
    textAlign: 'center',
    marginBottom: 3,
  },
  subtitle: {
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 20,
    aspectRatio: 1,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  gameName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default GamesScreen;
