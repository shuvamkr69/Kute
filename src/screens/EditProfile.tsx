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

type Props = NativeStackScreenProps<any, 'EditProfile'>;

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [profilePhoto, setProfilePhoto] = useState('');
  const [bio, setBio] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  // ✅ Load profile data from API or AsyncStorage
  const profileFetcher = async () => {
    try {
      const response = await api.get('/api/v1/users/me');
      const profileData = {
        profilePhoto: response.data.avatar1,
        interestedIn: response.data.interestedIn,
        relationshipType: response.data.relationshipType,
        interests: response.data.interests,
        bio: response.data.bio,
      };

      setProfilePhoto(profileData.profilePhoto);
      setInterestedIn(profileData.interestedIn);
      setRelationshipType(profileData.relationshipType);
      setSelectedInterests(profileData.interests);
      setBio(profileData.bio || '');


      // ✅ Save profile to AsyncStorage
      await AsyncStorage.setItem('profileData', JSON.stringify(profileData));
    } catch (error) {
      console.log('Error fetching profile, loading from AsyncStorage:', error);

      // ✅ Load from AsyncStorage if API fails
      const storedProfile = await AsyncStorage.getItem('profileData');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setProfilePhoto(profile.profilePhoto);
        setInterestedIn(profile.interestedIn);
        setRelationshipType(profile.relationshipType);
        setSelectedInterests(profile.interests);
        setBio(profile.bio);
      } else {
        Alert.alert('Error', 'Could not load profile data');
      }
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
      };
  
      await api.patch('/api/v1/users/me', updatedData);
      ToastAndroid.show("Profile Updated Successfully!", ToastAndroid.SHORT);
  
      navigation.goBack();
  
      // ✅ Save updated profile in AsyncStorage
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
        <ActivityIndicator size="large" color="#FFA62B" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <BackButton />
      <Text style={styles.headingText}>Edit your profile</Text>
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
        <Icon name="pencil" size={20} color="#FFA62B" />
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
    borderColor: '#FFA62B',
    width: '100%',
    minHeight : 56,
  },
  input: {
    flex: 1,
    height: 50,
    color: 'white',
    paddingLeft: 10,
  },
    container: {
      flex: 1,
      backgroundColor: '#121212',
      padding: 20,
    },
  
    headingText: {
      color: '#FFA62B',
      fontSize: 28,
      fontWeight: 'bold',
      alignSelf: 'center',
      marginBottom: 30,
    },
  
    profileContainer: {
      alignItems: 'center',
      marginTop: 30,
    },
  
    profileImageContainer: {
      position: 'relative',
    },
  
    profileImage: {
      width: 150,
      height: 150,
      borderRadius: 100,
      borderWidth: 2,
      borderColor: '#FFA62B',
    },
  
    editIcon: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: '#FFA62B',
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
      backgroundColor: '#FFA62B',
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
      color: '#FFA62B',
      fontWeight: 'bold',
    },
  
    confirmButton: {
      backgroundColor: '#FFA62B',
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
      backgroundColor: '#FFA62B',
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
    }
  
});

export default EditProfileScreen