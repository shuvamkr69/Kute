import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import CustomButton from '../components/Button';
import PickerComponent from '../components/PickerComponent';
import api from '../utils/api';
import Toast from "react-native-toast-message";
import BackButton from '../components/BackButton';


const interestOptions = ['Music', 'Sports', 'Travel', 'Gaming', 'Books', 'Movies', 'Tech', 'Fitness', 'Art', 'Fashion', 'Photography', 'Cooking'];
const relationshipOptions = ['Long Term', 'Casual', 'Hookup', 'Marriage'];
const interestedInOptions = ['Men', 'Women', 'Others'];
const pronounsOptions = ['He/Him', 'She/Her', 'They/Them'];
const genderOrientationOptions = ['Straight', 'Lesbian', 'Gay', 'Bisexual', 'Asexual', 'Pansexual', 'Queer'];
const planetSignOptions = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const familyPlanningOptions = ['Want Kids', 'Don\'t Want Kids', 'Undecided'];
const bodyTypeOptions = ['Muscular', 'Average', 'Obese', 'Athletic', 'Slim'];


type Props = NativeStackScreenProps<any, 'EditProfile'>;

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [profilePhoto, setProfilePhoto] = useState('');
  const [bio, setBio] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);


  const [height, setHeight] = useState<string>('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'feet'>('cm');
  const [occupation, setOccupation] = useState('');
  const [workingAt, setWorkingAt] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [genderOrientation, setGenderOrientation] = useState('');
  const [languages, setLanguages] = useState('');
  const [prompts, setPrompts] = useState('');
  const [planetSign, setPlanetSign] = useState('');
  const [familyPlanning, setFamilyPlanning] = useState('');
  const [bodyType, setBodyType] = useState('');


  // ✅ Load profile data from API or AsyncStorage
  const profileFetcher = async () => {
    try {
      const response = await api.get('/api/v1/users/me');
      const profileData = response.data;
  
      setProfilePhoto(profileData.avatar1);
      setInterestedIn(profileData.interestedIn);
      setRelationshipType(profileData.relationshipType);
      setSelectedInterests(profileData.interests);
      setBio(profileData.bio || '');
      setOccupation(profileData.occupation || '');
      setHeight(profileData.height.split(' ')[0]);
      setWorkingAt(profileData.workingAt || '');
      setPronouns(profileData.pronouns || '');
      setGenderOrientation(profileData.genderOrientation || '');
      setLanguages(profileData.languages || '');
      setPrompts(profileData.prompts || '');
      setPlanetSign(profileData.planetSign || '');
      setFamilyPlanning(profileData.familyPlanning || '');
      setBodyType(profileData.bodyType || '');
      
      await AsyncStorage.setItem('profileData', JSON.stringify(profileData));
    } catch (error) {
      console.log('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    profileFetcher();
  }, []);

  // ✅ PATCH request to update profile
  const updateProfile = async () => {
    if (bio.trim() === '') {
      Alert.alert('Error', 'Bio cannot be empty');
      return;
    }
  
    try {
      const updatedData = {
        interestedIn,
        relationshipType,
        interests: selectedInterests,
        avatar1: profilePhoto,
        bio,
        occupation: occupation,
        workingAt: workingAt,
        pronouns: pronouns,
        genderOrientation: genderOrientation,
        languages: languages,
        prompts: prompts,
        planetSign: planetSign,
        familyPlanning: familyPlanning,
        bodyType: bodyType,
        height: height + ' ' + heightUnit,
      };
      console.log(updatedData);
  
      await api.patch('/api/v1/users/me', updatedData);
      ToastAndroid.show("Profile Updated Successfully!", ToastAndroid.SHORT);
      navigation.goBack();
  
      await AsyncStorage.setItem('profileData', JSON.stringify(updatedData));
    } catch (error) {
      Alert.alert('Error', 'Could not update profile');
      console.error('Error updating profile:', error);
    }
  };
  

  const selectInterest = (item: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(item)) {
        return prev.length > 1 ? prev.filter((interest) => interest !== item) : prev; // Prevent removing the last interest
      }
      return prev.length < 7 ? [...prev, item] : prev;
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#5de383" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <BackButton />
      <View style={styles.profileContainer}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: profilePhoto || 'https://www.shutterstock.com/image-photo/very-random-pose-asian-men-260nw-2423213779.jpg' }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editIcon} onPress={() => navigation.navigate('EditProfile')}>
            <Icon name="pencil" size={14} color="#121212" />
          </TouchableOpacity>
        </View>
      </View>

      <PickerComponent label="Interested In" selectedValue={interestedIn} options={interestedInOptions} onValueChange={setInterestedIn} />
      <PickerComponent label="Relationship Type" selectedValue={relationshipType} options={relationshipOptions} onValueChange={setRelationshipType} />

      <TouchableOpacity onPress={() => setShowInterestModal(true)}>
        <Icon name="pencil" size={20} color="#5de383" />
        <View style={styles.tagsContainer}>
          {selectedInterests.map((item, index) => (
            <TouchableOpacity key={index} style={styles.tag} onPress={() => selectInterest(item)}>
              <Text style={styles.tagText}>{item}</Text>
            </TouchableOpacity>
          ))}
          {selectedInterests.length === 0 && <Text style={{ color: '#B0B0B0', paddingLeft: 10 }}>Your interests</Text>}
        </View>
      </TouchableOpacity>

      <Modal visible={showInterestModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={interestOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => selectInterest(item)} style={styles.interestOption}>
                  <Text style={[styles.interestText, selectedInterests.includes(item) && styles.selectedInterest]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowInterestModal(false)} style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      <Text style={styles.label}>About me</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Write your bio..."
          placeholderTextColor="#B0B0B0"
          value={bio}
          onChangeText={setBio}
          multiline
        />
      </View>

<Text style={styles.label}>Height</Text>
<View style={styles.inputContainer}>
  <TextInput
    style={styles.input}
    placeholder="Enter Height"
    placeholderTextColor="#B0B0B0"
    value={height}
    onChangeText={setHeight}
    keyboardType="numeric"
  />
  <TouchableOpacity onPress={() => setHeightUnit((prev) => (prev === 'cm' ? 'feet' : 'cm'))}>
    <Text style={{ color: '#5de383', marginLeft: 10 }}>{heightUnit}</Text>
  </TouchableOpacity>
</View>





<Text style={styles.label}>Occupation</Text>
<TextInput
  style={styles.input}
  placeholder="Enter your occupation"
  placeholderTextColor="#B0B0B0"
  value={occupation}
  onChangeText={setOccupation}
/>

<Text style={styles.label}>Working At / Student At</Text>
<TextInput
  style={styles.input}
  placeholder="Where do you work or study?"
  placeholderTextColor="#B0B0B0"
  value={workingAt}
  onChangeText={setWorkingAt}
/>

<PickerComponent
  label="Pronouns"
  selectedValue={pronouns}
  options={pronounsOptions}
  onValueChange={setPronouns}
/>

<PickerComponent
  label="Gender Orientation"
  selectedValue={genderOrientation}
  options={genderOrientationOptions}
  onValueChange={setGenderOrientation}
/>

<Text style={styles.label}>Languages I Know</Text>
<TextInput
  style={styles.input}
  placeholder="Enter languages separated by commas"
  placeholderTextColor="#B0B0B0"
  value={languages}
  onChangeText={setLanguages}
/>

<Text style={styles.label}>Prompts</Text>
<TextInput
  style={styles.input}
  placeholder="Enter prompts"
  placeholderTextColor="#B0B0B0"
  value={prompts}
  onChangeText={setPrompts}
/>

<PickerComponent
  label="Planet Sign"
  selectedValue={planetSign}
  options={planetSignOptions}
  onValueChange={setPlanetSign}
/>

<PickerComponent
  label="Family Planning"
  selectedValue={familyPlanning}
  options={familyPlanningOptions}
  onValueChange={setFamilyPlanning}
/>

<PickerComponent
  label="Body Type"
  selectedValue={bodyType}
  options={bodyTypeOptions}
  onValueChange={setBodyType}
/>



      <CustomButton title="Save Changes" onPress={updateProfile} style={styles.updateButton} />

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#121212',
    width: '100%',
    
  },
  input: {
    flex: 1,
    height: 50,
    color: 'white',
    paddingLeft: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
  },
    container: {
      flex: 1,
      backgroundColor: '#121212',
      padding: 20,
    },
  
    profileContainer: {
      alignItems: 'center',
      marginTop: 30,
    },
  
    profileImageContainer: {
      position: 'relative',
      marginBottom: 20,
    },
  
    profileImage: {
      width: 150,
      height: 150,
      borderRadius: 100,
      borderWidth: 2,
      borderColor: '#5de383',
    },
  
    editIcon: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: '#5de383',
      borderRadius: 15,
      padding: 7,
    },
  
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingVertical: 10,
      gap: 8,
    },
  
    tag: {
      backgroundColor: '#5de383',
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
  
    tagText: {
      color: '#FFF',
      fontWeight: 'bold',
    },
  
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  
    modalContent: {
      backgroundColor: '#1E1E1E',
      padding: 20,
      borderRadius: 10,
      width: '80%',
    },
  
    interestOption: {
      padding: 15,
      alignItems: 'center',
    },
  
    interestText: {
      color: '#FFF',
    },
  
    selectedInterest: {
      color: '#5de383',
      fontWeight: 'bold',
    },
  
    confirmButton: {
      backgroundColor: '#5de383',
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
    },
  
    confirmButtonText: {
      color: '#FFF',
      fontWeight: 'bold',
    },
  
    updateButton: {
      marginTop: 20,
      marginBottom: 40,
      backgroundColor: '#5de383',
    },
  
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButton: {
      position: 'absolute',
      top: -15,
      height: 30,
      width: 30,
      alignContent: 'center',
      justifyContent: 'center',
    },
    label: {
      color: '#5de383',
      fontSize: 16,
      marginBottom: 5,
      marginTop: 10,
    }
    
  
});

export default EditProfileScreen