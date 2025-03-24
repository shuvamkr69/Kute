// OnboardingScreen.js
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<any, 'OnboardingScreen'>;

const slides = [
  {
    title: 'Welcome to Kute',
    description: 'Find your perfect match and connect with people who share your interests.',
    image: require('../assets/images/img1.jpg'),
  },
  {
    title: 'Swipe Right',
    description: 'Swipe right to like someone and start a conversation.',
    image: require('../assets/images/img2.jpg'),
  },
  {
    title: 'Meet New People',
    description: 'Join a community of singles and start meeting new people today!',
    image: require('../assets/images/img3.jpg'),
  },
];

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    navigation.navigate('Login');
  };

  const handleStart = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Image source={slide.image} style={styles.image} />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const opacity = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return <Animated.View key={index} style={[styles.dot, { opacity }]} />;
        })}
      </View>

      {/* Hide Skip button on the last page */}
      <Animated.View
        style={[
          styles.button,
          {
            opacity: scrollX.interpolate({
              inputRange: [(slides.length - 2) * width, (slides.length - 1) * width],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <TouchableOpacity onPress={handleNext}>
          <Text style={styles.buttonText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Start button visibility based on scroll position */}
      <Animated.View
        style={[
          styles.startButton,
          {
            opacity: scrollX.interpolate({
              inputRange: [(slides.length - 2) * width, (slides.length - 1) * width],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <TouchableOpacity onPress={handleStart}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    width: width,
    height: height,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  textContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 70,
    width: '100%',
    alignItems: 'center',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5de383',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  dot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#5de383',
    marginHorizontal: 5,
  },
  button: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    borderRadius: 30,
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  startButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    borderRadius: 30,
    paddingVertical: 5,
    paddingHorizontal: 5,
    opacity: 0, // Initially hidden
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
