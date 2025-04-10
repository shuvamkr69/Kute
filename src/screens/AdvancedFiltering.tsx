import React, { use, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PickerComponent from '../components/PickerComponent';
import Slider from '@react-native-community/slider';
import { TextInput } from 'react-native';
import api from '../utils/api';
import { getUserId } from '../utils/constants';
import LoadingScreen from './LoadingScreen';

const relationshipOptions = ['Long Term', 'Casual', 'Hookup', 'Marriage', 'Any'];
const genderOrientationOptions = ['Straight', 'Lesbian', 'Gay', 'Bisexual', 'Asexual', 'Pansexual', 'Queer'];
const zodiacOptions = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 'Any'];
const workoutOptions = ['Daily', 'Weekly', 'Occasionally', 'Never', 'Any'];
const drinkingOptions = ['Socially', 'Regularly', 'Never', 'Any'];
const smokingOptions = ['Socially', 'Regularly', 'Never', 'Any'];
const familyPlanningOptions = ['Want Kids', 'Dont Want Kids', 'Undecided', 'Any'];
const interestOptions = ['Music', 'Sports', 'Travel', 'Gaming', 'Books', 'Movies', 'Tech', 'Fitness', 'Art', 'Fashion', 'Photography', 'Cooking'];
const personalityOptions = ['Extrovert', 'Ambivert', 'Introvert', 'Any'];



const AdvancedFilteringScreen = ({ navigation }) => {
  const [genderPreference, setGenderPreference] = useState('Everyone');
  const [relationshipType, setRelationshipType] = useState('');
  const [genderOrientation, setGenderOrientation] = useState('');
  const [distance, setDistance] = useState(0);
  const [location, setLocation] = useState('');
  const [verifiedUser, setVerifiedUser] = useState(false);
  const [personality, setPersonality] = useState<string>('Any');
  const [interests, setInterests] = useState<string[]>([]);
  const [workout, setWorkout] = useState<string>('');
  const [drinking, setDrinking] = useState<string>('');
  const [smoking, setSmoking] = useState<string>('');
  const [familyPlanning, setFamilyPlanning] = useState<string>('');
  const [zodiac, setZodiac] = useState('');
  const [isPremium, setIsPremium] = useState(false); 
  const [loading, setLoading] = useState(true);


  const applyFilters = async () => {
    const userId = await getUserId(); // Replace with actual user ID from auth
    console.log('User ID:', userId);
    const filters = {
      userId: userId, // Replace with actual user ID from auth
      genderPreference,
      relationshipType,
      genderOrientation,
      distance,
      location,
      verifiedUser,
      personality,
      workout,
      drinking,
      smoking,
      familyPlanning,
      zodiac,
      interests,
      isPremium,
    };
  
    try {
      const response = await api.post('/api/v1/users/advanced-filters', filters);
      console.log('Filters Saved:', response.data);
      navigation.navigate('Home', { filters });
    } catch (error) {
      console.error('Request Failed:', error.response?.data || error.message);
    }
  };
  
  // Fetching saved filters when the screen loads
  const fetchFilters = async () => {
    try {
      const userId = await getUserId(); // Replace with actual user ID from auth
      const response = await api.get(`/api/v1/users/advanced-filters/${userId}`); // Replace with actual user ID from auth
      const savedFilters = response.data;
      setGenderPreference(savedFilters.genderPreference || 'Everyone');
      setRelationshipType(savedFilters.relationshipType || '');
      setGenderOrientation(savedFilters.genderOrientation || '');
      setDistance(savedFilters.distance || 0);
      setLocation(savedFilters.location || '');
      setVerifiedUser(savedFilters.verifiedUser || false);
      setPersonality(savedFilters.personality || '');
      setWorkout(savedFilters.workout || '');
      setDrinking(savedFilters.drinking || '');
      setSmoking(savedFilters.smoking || '');
      setFamilyPlanning(savedFilters.familyPlanning || '');
      setZodiac(savedFilters.zodiac || '');
      setInterests(savedFilters.interests || []);
      setIsPremium(savedFilters.isPremium || false);
    } catch (error) {
      console.error('Failed to fetch filters:', error.response?.data || error.message);
    }
    finally {
      setLoading(false); // Set loading to false after fetching
    }
  };
  
  useEffect(() => {
    fetchFilters(); // Fetch filters when the component mounts
  }, []); // Empty dependency array to run only once
  // Call fetchFilters when the screen loads (useEffect or useFocusEffect)
  


  const FilterSwitch = ({ label, value, onValueChange }) => (
    <View style={styles.switchContainer}>
      <Text style={{ color: '#fff' }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#555', true: '#5de383' }}
        thumbColor={value ? '#fff' : '#ccc'}
      />
    </View>
  );
  if (loading) {
    return <LoadingScreen />;
  }
 

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={26} color="white" />
      </TouchableOpacity>
      <Text style={styles.header}>Discover</Text>

      <FilterSwitch
        label="Verified User"
        value={verifiedUser}
        onValueChange={setVerifiedUser}
      />

<PickerComponent
        label="Personality"
        selectedValue={personality}
        options={personalityOptions}
        onValueChange={setPersonality}
      />

      <PickerComponent
        label="Workout"
        selectedValue={workout}
        options={workoutOptions}
        onValueChange={setWorkout}
      />

      <PickerComponent
        label="Drinking"
        selectedValue={drinking}
        options={drinkingOptions}
        onValueChange={setDrinking}
      />

      <PickerComponent
        label="Smoking"
        selectedValue={smoking}
        options={smokingOptions}
        onValueChange={setSmoking}
      />

      <PickerComponent
        label="Family Planning"
        selectedValue={familyPlanning}
        options={familyPlanningOptions}
        onValueChange={setFamilyPlanning}
      />

      <PickerComponent
        label="Zodiac Sign"
        selectedValue={zodiac}
        options={zodiacOptions}
        onValueChange={setZodiac}
      />

      <PickerComponent
        label="Relationship Type"
        selectedValue={relationshipType}
        options={relationshipOptions}
        onValueChange={setRelationshipType}
      />

      <PickerComponent
        label="Gender Orientation"
        selectedValue={genderOrientation}
        options={genderOrientationOptions}
        onValueChange={setGenderOrientation}
      />

      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={distance}
        onValueChange={setDistance}
        minimumTrackTintColor="#5de383"
        maximumTrackTintColor="#fff"
      />
      <Text style={{ color: '#fff' }}>Distance: {distance} km</Text>

      <TouchableOpacity onPress={applyFilters} style={styles.applyButton}>
        <Text style={styles.applyButtonText}>Apply Filters</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  header: {
    fontSize: 19,
    color: 'white',
    marginBottom: 25,
    marginLeft: 10,
  },
  applyButton: {
    backgroundColor: '#5de383',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  
});

export default AdvancedFilteringScreen;
