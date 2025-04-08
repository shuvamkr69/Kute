import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../utils/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/navigationTypes';
import BackButton from '../components/BackButton';

type Props = NativeStackScreenProps<RootStackParamList, 'BoostsAndLikes'>;

const BoostsAndLikesScreen: React.FC<Props> = ({ navigation }) => {
  const handlePurchase = async (type: string) => {
    try {
      await api.post('/api/v1/users/buyFeature', { featureType: type });
      Alert.alert('Success', `You have successfully purchased ${type}!`);
    } catch (error) {
      Alert.alert('Error', `Failed to purchase ${type}. Please try again.`);
    }
  };

  return (
    <LinearGradient colors={['#121212', '#1E1E1E']} style={styles.container}>
        <BackButton title = {"Boost and Likes"}/>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Get Noticed Instantly!</Text>
        <Text style={styles.subtitle}>Boost your profile or send Super Likes to stand out.</Text>

        {/* Boost Section */}
        <View style={styles.card}>
          <Icon name="flash" size={50} color="#FFA62B" />
          <Text style={styles.title}>Boost Your Profile</Text>
          <Text style={styles.description}>Increase visibility and get 3x more matches.</Text>
          <TouchableOpacity onPress={() => handlePurchase('Boost')} style={styles.button}>
            <Text style={styles.buttonText}>Buy Boosts</Text>
          </TouchableOpacity>
        </View>

        {/* Super Likes Section */}
        <View style={styles.card}>
          <Icon name="heart" size={50} color="#FF69B4" />
          <Text style={styles.title}>Send Super Likes</Text>
          <Text style={styles.description}>Let someone special know you really like them!</Text>
          <TouchableOpacity onPress={() => handlePurchase('Super Like')} style={styles.button}>
            <Text style={styles.buttonText}>Buy Super Likes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#1E1E1E',
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginVertical: 10,
  },
  description: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#5de383',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BoostsAndLikesScreen;
