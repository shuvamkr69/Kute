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
  ActivityIndicator,
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
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePress = () => {
    console.log('GameCard pressed - starting navigation sequence');
    
    // Ensure the animation completes before triggering navigation
    if (!isPressed) {
      handlePressIn();
    }
    
    // Small delay to ensure touch feedback is visible
    setTimeout(() => {
      handlePressOut();
      console.log('GameCard press handler executing onPress');
      onPress();
    }, 100);
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.touchableCard}
      delayPressIn={0}
      delayPressOut={0}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <ImageBackground source={img} style={styles.img} imageStyle={{ borderRadius: 28 }} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const GamesScreen: React.FC<Props> = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handlePlay = async (route: string) => {
    console.log(`🎮 Attempting to navigate to: ${route}`);
    
    // Prevent multiple rapid taps
    if (isNavigating) {
      console.log('⚠️ Navigation already in progress, ignoring tap');
      return;
    }

    try {
      setIsNavigating(true);
      console.log('🚀 Navigation started');
      
      // Add subtle haptic feedback for better UX
      Vibration.vibrate(10);
      
      // Validate route exists before navigation
      const validRoutes = ['TDWaitingScreen', 'WYRLobbyScreen', 'NeverHaveIEverGame', 'EventSelectionScreen'];
      if (!validRoutes.includes(route)) {
        console.error('❌ Invalid route:', route);
        Alert.alert('Error', 'Invalid game route. Please try again.');
        return;
      }

      console.log('✅ Route validated, proceeding with navigation');

      // Use a more reliable navigation approach
      const navigationPromise = new Promise<void>((resolve, reject) => {
        try {
          console.log('📍 Executing navigation.navigate');
          navigation.navigate(route as never);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      // Use InteractionManager as a fallback
      InteractionManager.runAfterInteractions(() => {
        navigationPromise.catch((error) => {
          console.error('❌ Direct navigation failed, trying alternative approach:', error);
          // Fallback navigation method
          setTimeout(() => {
            try {
              console.log('🔄 Attempting fallback navigation');
              navigation.navigate(route as never);
            } catch (fallbackError) {
              console.error('❌ Fallback navigation also failed:', fallbackError);
              Alert.alert('Error', 'Unable to navigate to game. Please try again.');
            }
          }, 50);
        });
      });

      // Wait a moment for navigation to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('✅ Navigation sequence completed');
      
    } catch (error) {
      console.error('❌ Navigation error:', error);
      Alert.alert('Error', 'Unable to navigate to game. Please try again.');
    } finally {
      // Reset navigation state after a delay
      setTimeout(() => {
        console.log('🔄 Resetting navigation state');
        setIsNavigating(false);
      }, 1000);
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
        removeClippedSubviews={false}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        scrollEnabled={!isNavigating}
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
      
      {/* Navigation loading overlay */}
      {isNavigating && (
        <View style={styles.navigationLoadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="white" style={{ marginBottom: 8 }} />
            <Text style={styles.loadingText}>Loading Game...</Text>
          </View>
        </View>
      )}
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
    minHeight: CARD_HEIGHT,
    minWidth: CARD_WIDTH,
  },

  navigationLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  loadingContainer: {
    backgroundColor: 'rgba(222, 130, 44, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GamesScreen;
