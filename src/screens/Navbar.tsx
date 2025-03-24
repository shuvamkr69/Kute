import { StyleSheet, Text, Animated } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NavigationContainerRef } from '@react-navigation/native';

Icon.loadFont();

type Props = {
  navigation: NavigationContainerRef<any>;
};

const Navbar: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lastScreen = useRef<string | null>(null);
  const navbarOrder = ['Home', 'Games', 'Likes', 'Chat', 'MyProfile'];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const navigateWithAnimation = (screen: string) => {
    if (lastScreen.current === screen) return; // Prevent re-clicking the same icon

    // (Optional) You can add logic here to determine left/right swipe animation.
    Animated.timing(fadeAnim, {
      toValue: 0.5,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate(screen as never);
      lastScreen.current = screen;
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <Animated.View style={[styles.navbar, { opacity: fadeAnim }]}>
      {navbarOrder.map((screen, index) => (
        <TouchableOpacity key={index} style={styles.navButton} onPress={() => navigateWithAnimation(screen)}>
          <Icon name={screen === 'Home' ? 'home' : screen.toLowerCase()} size={24} color="#5de383" />
          <Text style={styles.label}>{screen}</Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#0d0d0d',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  navButton: {
    alignItems: 'center',
    padding: 10,
  },
  label: {
    fontSize: 12,
    color: '#B0B0B0',
    marginTop: 4,
  },
});

export default Navbar;
