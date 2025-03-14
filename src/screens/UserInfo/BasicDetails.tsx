import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Modal, FlatList, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import PickerComponent from '../../components/PickerComponent';
import api from '../../utils/api';

type Props = NativeStackScreenProps<any, 'BasicDetails'>;

const BasicDetails: React.FC<Props> = ({ navigation }) => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [preference, setPreference] = useState('');
  const [personality, setPersonality] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [relationshipType, setRelationshipType] = useState('');
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);

  const genderOptions = ['Male', 'Female', 'Non-Binary', 'Other'];
  const preferenceOptions = ['Men', 'Women', 'Everyone'];
  const personalityType = ['Introvert', 'Ambivert', 'Extrovert'];
  const interestOptions = ['Music', 'Sports', 'Travel', 'Gaming', 'Books', 'Movies', 'Tech', 'Fitness', 'Art', 'Fashion', 'Photography', 'Cooking'];
  const relationshipOptions = ['Long Term', 'Casual', 'Hookup', 'Marriage'];

  const selectInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((interest) => interest !== item) : prev.length < 7 ? [...prev, item] : prev
    );
  };

  const removeInterest = (item: string) => {
    setSelectedInterests((prev) => prev.filter((interest) => interest !== item));
  };

  const detailHandler = async () => {
    try {
      const tempUserData = await AsyncStorage.getItem('tempUserData');
      if (!tempUserData) {
        Alert.alert('Error', 'No temporary data found');
        return;
      }

      const userData = JSON.parse(tempUserData);
      userData.age = parseInt(age.trim());
      userData.gender = gender.trim();
      userData.interestedIn = preference.trim();
      userData.personality = personality.trim();
      userData.interests = selectedInterests;
      userData.relationshipType = relationshipType.trim();

      await AsyncStorage.setItem('tempUserData', JSON.stringify(userData));

      navigation.navigate('Location');
    } catch (error) {
      Alert.alert('Error', 'There is a problem with the server');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Tell us about yourself</Text>

        <TouchableOpacity style={styles.inputContainer} activeOpacity={1}>
          <Icon name="calendar" size={20} color="#FFA62B" />
          <TextInput
            style={[styles.input, { width: '100%' }]}
            placeholder="Select Age"
            placeholderTextColor="#B0B0B0"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </TouchableOpacity>

        <PickerComponent
          label="Gender"
          selectedValue={gender}
          options={genderOptions}
          onValueChange={setGender}
          
        />
        <PickerComponent
          label="Interested In"
          selectedValue={preference}
          options={preferenceOptions}
          onValueChange={setPreference}
          
        />
        <PickerComponent
          label="Personality Type"
          selectedValue={personality}
          options={personalityType}
          onValueChange={setPersonality}
          
        />

        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowInterestModal(true)}>
          <Icon name="pencil" size={20} color="#FFA62B" />
          <View style={styles.tagsContainer}>
            {selectedInterests.map((item, index) => (
              <TouchableOpacity key={index} style={styles.tag} onPress={() => removeInterest(item)}>
                <Text style={styles.tagText}>{item}</Text>
              </TouchableOpacity>
            ))}
            {selectedInterests.length === 0 && <Text style={{ color: '#B0B0B0', paddingLeft: 10 }}>Your interests</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowRelationshipModal(true)}>
          <Icon name="heart" size={20} color="#FFA62B" />
          <Text style={{ color: relationshipType ? '#FFF' : '#B0B0B0', paddingLeft: 10 }}>
            {relationshipType || 'Select Relationship Type'}
          </Text>
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

        <Modal visible={showRelationshipModal} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={relationshipOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => { setRelationshipType(item); setShowRelationshipModal(false); }} style={styles.interestOption}>
                    <Text style={[styles.interestText, relationshipType === item && styles.selectedInterest]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={() => setShowRelationshipModal(false)} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={styles.button} onPress={detailHandler}>
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFA62B',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFA62B',
    minHeight: 56,
    color: 'white',
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
  input: {
    color : 'white',
    width: '100%',
    paddingLeft: 10,
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
    paddingLeft: 20,
  },
  interestOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FFA62B',
    alignItems: 'center',
  },

  interestText: {
    color: '#FFF',
    fontSize: 18,
  },
  selectedInterest: {
    color: '#FFA62B',
    fontWeight: 'bold',
  },
  confirmButton: {
    marginTop: 20,
    backgroundColor: '#FFA62B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FFA62B',
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default BasicDetails;