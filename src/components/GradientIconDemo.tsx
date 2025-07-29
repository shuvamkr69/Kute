import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

// Demo component to test the gradient icon functionality
const GradientIconDemo = () => {
  const GradientIcon = ({ name, size = 20 }) => {
    return (
      <MaskedView
        style={{ height: size, width: size }}
        maskElement={
          <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name={name} size={size} color="black" />
          </View>
        }
      >
        <LinearGradient
          colors={['#ff6b35', '#f7931e', '#de822c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </MaskedView>
    );
  };

  const iconNames = [
    'happy-outline',
    'barbell-outline', 
    'wine-outline',
    'cafe-outline',
    'people-outline',
    'star-outline',
    'heart-outline',
    'male-female-outline',
    'checkmark-done-circle-outline'
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gradient Icons Demo</Text>
      <View style={styles.iconGrid}>
        {iconNames.map((iconName, index) => (
          <View key={iconName} style={styles.iconContainer}>
            <GradientIcon name={iconName} size={30} />
            <Text style={styles.iconLabel}>{iconName.replace('-outline', '')}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    margin: 15,
    minWidth: 80,
  },
  iconLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default GradientIconDemo;
