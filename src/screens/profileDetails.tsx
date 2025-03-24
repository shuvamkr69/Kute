import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Modal, FlatList, Dimensions 
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Profile = {
    _id: string;
    fullName: string;
    age: number;
    gender: string;
    location: string;
    interests: string;
    relationshipType: string;
    bio: string;
    images: string[];
};

const { width, height } = Dimensions.get("window");

const ProfileDetails: React.FC<NativeStackScreenProps<any, 'ProfileDetails'>> = ({ navigation, route }) => {
  const { profile } = route.params as { profile: Profile };
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const openImageSlider = (index: number) => {
    setSelectedImageIndex(index);
    setModalVisible(true);
    
    // Ensure FlatList scrolls to the selected image
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    }, 100);
  };

  return (
    <View style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="times" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 10,
  },
  imageGallery: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  galleryImage: {
    width: '100%',
    height: 400,
    borderRadius: 15,
    marginBottom: 15,
  },
  detailsContainer: {
    padding: 20,
    width: '100%',
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  relationshipType: {
    fontSize: 20,
    color: '#5de383',
    marginBottom: 25,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    opacity: 0.9,
  },

  // 🔥 Modal Styles (Full-Screen Image Slider) 🔥
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 5,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 20,
    padding: 10,
  },
  fullScreenImageContainer: {
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
});

export default ProfileDetails;
