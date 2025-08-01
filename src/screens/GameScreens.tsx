import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  FlatList,
  Dimensions,
  Text,
  Alert,
  InteractionManager,
  Vibration,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getUserId } from '../utils/constants';

type Props = NativeStackScreenProps<any, 'Games'>;

const { width, height } = Dimensions.get('window');

const CARD_WIDTH = width;
const CARD_HEIGHT = height * 0.85;

const games = [
  { name: 'Truth or Dare 🔥', img: require('../../assets/gameScreenImages/truth-or-dare_orig.png'), route: 'TDWaitingScreen' },
  { name: 'Would You Rather ❓', img: require('../../assets/gameScreenImages/would-you-rather-questions.png'), route: 'WYRLobbyScreen' },
  { name: 'Never Have I Ever 🍸', img: require('../../assets/gameScreenImages/never-have-i-ever.png'), route: 'NeverHaveIEverGame' },
  { name: 'Events', img: require('../../assets/gameScreenImages/event-game-screen.png'), route: 'EventSelectionScreen' },
];

const GameCard = ({
  img,
  onPress,
}: {
  img: any;
  onPress: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity 
      activeOpacity={1} 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.touchableCard}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <ImageBackground source={img} style={styles.img} imageStyle={{ borderRadius: 28 }} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const GamesScreen: React.FC<Props> = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handlePlay = async (route: string) => {
    try {
      // Add subtle haptic feedback for better UX
      Vibration.vibrate(10);
      
      // Use InteractionManager to defer navigation until after the touch interaction
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate(route as never);
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Unable to navigate to game. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headingContainer}>
        <Text style={styles.headingText}>Games</Text>
      </View>
      <FlatList
        data={games}
        horizontal
        pagingEnabled
        keyExtractor={(_, i) => i.toString()}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        removeClippedSubviews={true}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH,
          offset: CARD_WIDTH * index,
          index,
        })}
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
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'flex-start',
    width: '100%',
    paddingLeft: 10,
    position: 'absolute',
    top: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  headingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 0,
    marginLeft: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 0,
  },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    paddingTop: 70,
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

  touchableCard: {
    flex: 1,
  },
});

export default GamesScreen;
