import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Image, Alert, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Modal 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const MAX_PHOTOS = 6;

type Props = NativeStackScreenProps<any, 'AddProfilePictures'>;

const AddProfilePictures: React.FC<Props> = ({ navigation }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean[]>(new Array(MAX_PHOTOS).fill(false));
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /** Request permissions on mount */
  useEffect(() => {
    (async () => {
      try {
        const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

        if (!galleryPermission.granted || !cameraPermission.granted) {
          Alert.alert(
            'Permissions Required', 
            'Please grant Camera & Gallery access to upload photos.'
          );
        }
      } catch (error) {
        console.error('Permission Request Failed:', error);
      }
    })();
  }, []);

  /** Function to pick an image from gallery */
  const pickImage = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 6 photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (result.canceled) return;

      if (result.assets?.[0]?.uri) {
        setPhotos((prevPhotos) => [...prevPhotos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Image Picker Error:', error);
      Alert.alert('Error', 'Failed to pick an image.');
    }
  };

  /** Function to take a new photo using camera */
  const takePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 6 photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (result.canceled) return;

      if (result.assets?.[0]?.uri) {
        setPhotos((prevPhotos) => [...prevPhotos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Camera Error:', error);
      Alert.alert('Error', 'Failed to take a photo.');
    }
  };

  /** Function to remove an image */
  const removeImage = useCallback((index: number) => {
    setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
  }, []);

  /** Function to save photos temporarily and navigate to the next step */
  const savePhotosAndNavigate = async () => {
    if (photos.length < 1) {
      Alert.alert('Error', 'You must upload at least one photo.');
      return;
    }

    setIsUploading(true);

    try {
      const tempUserData = await AsyncStorage.getItem('tempUserData');
      if (!tempUserData) {
        Alert.alert('Error', 'No temporary data found');
        setIsUploading(false);
        return;
      }

      const userData = JSON.parse(tempUserData);
      userData.photos = photos;

      await AsyncStorage.setItem('tempUserData', JSON.stringify(userData));

      navigation.navigate('MakeBio');
    } catch (error) {
      console.error('Error saving photos:', error);
      Alert.alert('Error', 'There was a problem saving your photos.');
      navigation.navigate('MakeBio');
    } finally {
      setIsUploading(false);
    }
  };

  /** Function to open modal for choosing image options */
  const openModal = (index: number) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  /** Function to close modal */
  const closeModal = () => {
    setModalVisible(false);
    setSelectedIndex(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Upload Your Best Photos</Text>

      <FlatList
        data={[...photos, ...new Array(MAX_PHOTOS - photos.length).fill(null)]}
        keyExtractor={(item, index) => index.toString()}
        numColumns={3}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={() => item ? removeImage(index) : openModal(index)}
          >
            {item ? (
              <>
                <Image source={{ uri: item }} style={styles.photo} />
                <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(index)}>
                  <Icon name="times-circle" size={24} color="red" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Icon name="plus" size={30} color="#FFA62B" />
              </>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Modal for Image Options */}
      {modalVisible && selectedIndex !== null && (
        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Choose an Option</Text>
              <TouchableOpacity style={styles.button} onPress={() => { pickImage(); closeModal(); }}>
                <Text style={styles.buttonText}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => { takePhoto(); closeModal(); }}>
                <Text style={styles.buttonText}>Take a Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <TouchableOpacity 
        style={[styles.uploadButton, isUploading && styles.disabledButton]} 
        onPress={savePhotosAndNavigate} 
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Next</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFA62B',
    marginBottom: 20,
  },
  photoContainer: {
    width: 140,
    height: 130,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFA62B',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)', 
    borderRadius: 12,
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#2C2C2C',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA62B',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFA62B',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
    width: '100%',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FFF',
  },
  uploadButton: {
    backgroundColor: '#FFA62B',
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddProfilePictures;
