import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  FlatList,
  Dimensions,
  Text,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Games'>;

const { width, height } = Dimensions.get('window');

const CARD_WIDTH = width;
const CARD_HEIGHT = height * 0.85;

const games = [
  { name: 'Truth or Dare 🔥', img: require('../../assets/gameScreenImages/truth-or-dare_orig.png'), route: 'TruthOrDareModeSelection' },
  { name: 'Would You Rather ❓', img: require('../../assets/gameScreenImages/would-you-rather-questions.jpg'), route: 'WYRLobbyScreen' },
  { name: 'Couple Quiz 💕', img: require('../../assets/gameScreenImages/would-you-rather-questions.jpg'), route: 'Couple Quiz' },
  { name: 'Flirty Questions 💌', img: require('../../assets/gameScreenImages/flirty-questions.jpeg'), route: 'Flirty Questions' },
  { name: 'Never Have I Ever 🍸', img: require('../../assets/gameScreenImages/never-have-i-ever.jpeg'), route: 'GroupSizeSelectorScreen' },
];

const GameCard = ({
  img,
  onPress,
}: {
  img: any;
  onPress: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
    <View style={styles.card}>
      <ImageBackground source={img} style={styles.img} imageStyle={{ borderRadius: 28 }} />
    </View>
  </TouchableOpacity>
);

const GamesScreen: React.FC<Props> = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handlePlay = (route: string) => navigation.navigate(route);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.header}>Games</Text>
        <Text style={styles.subheading}>Break the ice!</Text>
      </View>

      <FlatList
        data={games}
        horizontal
        pagingEnabled
        keyExtractor={(_, i) => i.toString()}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        renderItem={({ item }) => (
          <GameCard
            img={item.img}
            onPress={() => handlePlay(item.route)}
          />
        )}
      />

      {/* Fixed pagination dots */}
      <View style={styles.pagination}>
        {games.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                opacity: activeIndex === i ? 1 : 0.3,
                transform: [{ scale: activeIndex === i ? 1.2 : 1 }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  topBar: {
    position: 'absolute',
    zIndex: 10,
    width: '100%',
    paddingHorizontal: 20,
  },

  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },

  subheading: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 4,
  },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    paddingTop: 80,
    paddingHorizontal: 20,
  },

  img: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },

  pagination: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#de822c',
    marginHorizontal: 6,
  },
});

export default GamesScreen;
