import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';

interface Profile {
  id: number;
  image: string;
  name: string;
  age: string;
  lookingFor: string;
  zodiac: string;
}

interface Props {
  data: Profile[];
  onSwipeLeft: (profile: Profile) => void;
  onSwipeRight: (profile: Profile) => void;
}

const CustomSwiper: React.FC<Props> = ({ data, onSwipeLeft, onSwipeRight }) => {
  const currentIndex = useSharedValue(0);
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const swipe = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      'worklet'; // Mark this function as a worklet
      if (event.translationX > 150) {
        runOnJS(onSwipeRight)(data[currentIndex.value]);
        currentIndex.value += 1;
      } else if (event.translationX < -150) {
        runOnJS(onSwipeLeft)(data[currentIndex.value]);
        currentIndex.value += 1;
      }
      translateX.value = withSpring(0);
    });

  return (
    <GestureHandlerRootView style={styles.container}>
      {data[currentIndex.value] ? (
        <GestureDetector gesture={swipe}>
          <Animated.View style={[styles.card, animatedStyle]}>
            <Image source={{ uri: data[currentIndex.value].image }} style={styles.image} />
            <View style={styles.detailsContainer}>
              <Text style={styles.name}>{data[currentIndex.value].name}, {data[currentIndex.value].age}</Text>
              <Text style={styles.info}>{data[currentIndex.value].zodiac}</Text>
              <Text style={styles.info}>{data[currentIndex.value].lookingFor}</Text>
            </View>
          </Animated.View>
        </GestureDetector>
      ) : (
        <Text style={styles.endText}>No more profiles</Text>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 450,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    height: 450,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    elevation: 8,
  },
  image: {
    width: '100%',
    height: 350,
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  info: {
    fontSize: 16,
    color: '#B0B0B0',
    marginTop: 5,
  },
  endText: {
    fontSize: 20,
    color: '#FFF',
  },
});

export default CustomSwiper;