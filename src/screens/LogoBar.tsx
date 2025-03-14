import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Settings: undefined; // Add all screen names that LogoBar will navigate to
  Home: undefined;
  Notifications: undefined;
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const LogoBar: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Kute</Text>

      <View style={styles.iconsContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Icon name="sliders" size={24} color="white" style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Icon name="cog" size={24} color="white" />
        </TouchableOpacity>

        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#0d0d0d',
    borderBottomWidth: 2,
    borderBottomColor: '#1E1E1E',
    elevation: 2, // For Android shadow effect
    shadowColor: '#1E1E1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  iconsContainer: {
    flexDirection: 'row',
  },
  icon: {
    marginRight: 15,
  },
});

export default LogoBar;
