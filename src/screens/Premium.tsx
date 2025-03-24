import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CustomButton from '../components/Button';
import { Alert } from 'react-native';
import api from '../utils/api';

type Props = NativeStackScreenProps<any, 'Premium'>;

const PremiumScreen: React.FC<Props> = ({ navigation }) => {
  const plans = [
    {
      name: 'Basic',
      price: '₹79 / Month',
      features: ['5 Likes per Day', 'See Who Liked You'],
    },
    {
      name: 'Standard',
      price: '₹129 / Month',
      features: ['Unlimited Likes', 'See Who Liked You', 'Boost Your Profile'],
    },
    {
      name: 'Diamond',
      price: '₹299 / Month',
      features: ['Unlimited Likes', 'See Who Liked You', 'Boost Your Profile', 'Message Before Match'],
    },
  ];


  const basicPlan = () => {
    try {
      api.post('/api/v1/users/premiumActivated', { ActivePremiumPlan: "Basic" });
      Alert.alert('Success', 'You have successfully subscribed to the Basic Plan!');
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe to the Basic Plan!');
    }
  };

  const standardPlan = () => {
    try {
      api.post('/api/v1/users/premiumActivated', { ActivePremiumPlan: "Standard" });
      Alert.alert('Success', 'You have successfully subscribed to the Standard Plan!');
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe to the Standard Plan!');
    }
  };

  const diamondPlan = () => {
    try {
      api.post('/api/v1/users/premiumActivated', { ActivePremiumPlan: "Diamond" });
      Alert.alert('Success', 'You have successfully subscribed to the Diamond Plan!');
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe to the Diamond Plan!');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Become a Kute-T</Text>
      <Text style={styles.subtitle}>Unlock all features to find your perfect match!</Text>

      {plans.map((plan, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>{plan.price}</Text>
          {plan.features.map((feature, idx) => (
            <Text key={idx} style={styles.feature}>
              ✅ {feature}
            </Text>
          ))}
          <CustomButton 
  title={`Subscribe to ${plan.name}`} 
  onPress={plan.name === "Diamond" ? diamondPlan : plan.name === "Standard" ? standardPlan : basicPlan} 
/>

        </View>
      ))}

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.goBack}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#5de383',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#5de383',
    shadowColor: '#5de383',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5de383',
    marginBottom: 10,
  },
  planPrice: {
    fontSize: 20,
    color: '#B0B0B0',
    marginBottom: 10,
  },
  feature: {
    color: 'white',
    marginBottom: 5,
  },
  goBack: {
    textAlign: 'center',
    color: '#5de383',
    marginTop: 20,
  },
});

export default PremiumScreen;
