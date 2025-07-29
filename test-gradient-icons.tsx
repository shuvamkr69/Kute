// Test file to verify GradientIcon component works
import React from 'react';
import { View, StyleSheet } from 'react-native';
import GradientIcon from './src/components/GradientIcon';

const TestGradientIcons = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <GradientIcon name="happy-outline" size={24} />
        <GradientIcon name="heart-outline" size={24} />
        <GradientIcon name="star-outline" size={24} />
        <GradientIcon name="settings-outline" size={24} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
});

export default TestGradientIcons;
