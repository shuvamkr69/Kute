import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface GradientIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size: number;
  style?: any;
  colors?: string[];
}

const GradientIcon: React.FC<GradientIconProps> = ({ 
  name, 
  size, 
  style,
  colors = ['#ff6b35', '#de822c', '#ff8c00'] // Reddish orange gradient
}) => {
  return (
    <MaskedView
      style={[{ width: size, height: size }, style]}
      maskElement={
        <View style={{ backgroundColor: 'transparent', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={name} size={size} color="black" />
        </View>
      }
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
    </MaskedView>
  );
};

export default GradientIcon;
