import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Games'>;

const games = [
  { name: 'Truth or Dare 🔥', image: require('../assets/gameScreenImages/truth-or-dare_orig.png') },
  { name: 'Would You Rather ❓', image: require('../assets/gameScreenImages/would-you-rather-questions.jpg') },
  { name: 'Couple Quiz 💕', image: require('../assets/gameScreenImages/would-you-rather-questions.jpg') },
  { name: 'Flirty Questions 💌', image: require('../assets/gameScreenImages/flirty-questions.jpeg') },
  { name: 'Never Have I Ever 🍸', image: require('../assets/gameScreenImages/never-have-i-ever.jpeg') },
];

const GamesScreen: React.FC<Props> = () => {
  const handlePlay = (game: string) => {
  };

  const renderGame = ({ item }: { item: typeof games[0] }) => (
    <TouchableOpacity onPress={() => handlePlay(item.name)} style={styles.card}>
      <ImageBackground source={item.image} style={styles.image} imageStyle={{ borderRadius: 15 }}>
        <View style={styles.overlay}>
          <Text style={styles.gameName}>{item.name}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Games</Text>
      <Text style={styles.subtitle}>Play and break the ice!</Text>

      <FlatList
        data={games}
        renderItem={renderGame}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 5,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFA62B',
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
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    margin: 10,
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
