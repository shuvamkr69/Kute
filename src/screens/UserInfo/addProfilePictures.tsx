import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Image, Alert, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Modal, 
  ScrollView, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import BackButton from '../../components/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const MAX_PHOTOS = 6;
const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 3;

// Gradient Icon Component
const GradientIcon = ({ name, size = 20 }: { name: any; size?: number }) => (
  <MaskedView
    style={{ width: size, height: size }}
    maskElement={
      <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={name} size={size} color="black" />
      </View>
    }
  >
    <LinearGradient
      colors={["#de822c", "#ff172e"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    />
  </MaskedView>
);

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
    <View style={styles.backButtonContainer}>
      <BackButton title={"Add Your Photos"} />
      <SafeAreaView style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.headerSubtitle}>
            Upload up to 6 photos to showcase yourself
          </Text>
        </View>

        <View style={styles.photosSection}>
          <FlatList
            data={[...photos, ...new Array(MAX_PHOTOS - photos.length).fill(null)]}
            keyExtractor={(item, index) => index.toString()}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContainer}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.photoContainer,
                  index === 0 && styles.primaryPhoto,
                  item && styles.hasPhoto
                ]}
                onPress={() => item ? removeImage(index) : openModal(index)}
                activeOpacity={0.8}
              >
                {item ? (
                  <>
                    <Image source={{ uri: item }} style={styles.photo} />
                    {index === 0 && (
                      <LinearGradient
                        colors={["#de822c", "#ff172e"]}
                        style={styles.primaryBadge}
                      >
                        <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                      </LinearGradient>
                    )}
                    <TouchableOpacity 
                      style={styles.removeIcon} 
                      onPress={() => removeImage(index)}
                    >
                      <LinearGradient
                        colors={["#FF3B30", "#FF1744"]}
                        style={styles.removeIconGradient}
                      >
                        <Ionicons name="close" size={16} color="#FFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : (
                  <LinearGradient
                    colors={['#23262F', '#181A20']}
                    style={styles.addPhotoGradient}
                  >
                    <GradientIcon name="add" size={24} />
                    <Text style={styles.addPhotoText}>
                      {index === 0 ? 'Primary' : 'Add'}
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.guidelinesSection}>
          <View style={styles.guidelinesHeader}>
            <GradientIcon name="information-circle-outline" size={16} />
            <Text style={styles.guidelinesTitle}>Quick Tips</Text>
          </View>
          <View style={styles.tipsGrid}>
            {[
              { icon: 'camera-outline', text: 'Clear photos' },
              { icon: 'happy-outline', text: 'Show your face' },
              { icon: 'star-outline', text: 'Be genuine' },
              { icon: 'checkmark-outline', text: 'Recent pics' }
            ].map((tip, index) => (
              <View key={index} style={styles.tipBubble}>
                <GradientIcon name={tip.icon} size={14} />
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </View>




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
                <Text style={styles.modalTitle}>Add Photo</Text>
                <Text style={styles.modalSubtitle}>Choose how you'd like to add your photo</Text>
                
                <View style={styles.optionContainer}>
                  <TouchableOpacity 
                    style={styles.optionBox} 
                    onPress={() => { pickImage(); closeModal(); }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#23262F', '#181A20']}
                      style={styles.optionGradient}
                    >
                      <GradientIcon name="images-outline" size={32} />
                      <Text style={styles.optionText}>Gallery</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.optionBox} 
                    onPress={() => { takePhoto(); closeModal(); }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#23262F', '#181A20']}
                      style={styles.optionGradient}
                    >
                      <GradientIcon name="camera-outline" size={32} />
                      <Text style={styles.optionText}>Camera</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        <TouchableOpacity 
          style={[styles.nextButton, isUploading && styles.disabledButton]} 
          onPress={savePhotosAndNavigate} 
          disabled={isUploading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#de822c", "#ff172e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextButtonGradient}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#de822c',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#A1A7B3',
    textAlign: 'center',
    lineHeight: 22,
  },
  photosSection: {
    flex: 1,
    marginBottom: 16,
  },
  gridContainer: {
    paddingVertical: 8,
  },
  photoContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 1.2,
    borderRadius: 12,
    backgroundColor: '#181A20',
    margin: 4,
    borderWidth: 2,
    borderColor: '#23262F',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryPhoto: {
    borderColor: '#de822c',
    borderWidth: 3,
  },
  hasPhoto: {
    borderColor: '#34C759',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  primaryBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  removeIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  removeIconGradient: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  addPhotoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  addPhotoText: {
    color: '#A1A7B3',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  guidelinesSection: {
    backgroundColor: '#181A20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#23262F',
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guidelinesTitle: {
    color: '#de822c',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23262F',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
    flex: 1,
    minWidth: '48%',
  },
  tipText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  guidelinesScroll: {
    maxHeight: 120,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  guidelineText: {
    color: '#A1A7B3',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    backgroundColor: '#181A20',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: width * 0.85,
    borderWidth: 1,
    borderColor: '#23262F',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#de822c',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#A1A7B3',
    textAlign: 'center',
    marginBottom: 25,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  optionBox: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionGradient: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#de822c',
    borderRadius: 16,
  },
  optionText: {
    color: '#FFF',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  cancelButtonText: {
    color: '#A1A7B3',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  nextButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 17,
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default AddProfilePictures;
