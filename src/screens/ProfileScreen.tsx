import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, ToastAndroid } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import CustomButton from '../components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api'; 
import Toast from 'react-native-toast-message';

type Props = NativeStackScreenProps<any, 'MyProfile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('https://www.shutterstock.com/image-photo/very-random-pose-asian-men-260nw-2423213779.jpg');
  const [age, setAge] = useState<number | null>(null);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isPremiumActive, setIsPremiumActive] = useState(false);


  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        await AsyncStorage.removeItem('user'); // ✅ Ensure no stale data is loaded
  
        // ✅ Always fetch fresh user data from API first
        const response = await api.get('/api/v1/users/me');
        const user = response.data;
  
        setName(user.fullName || '');
        setAge(user.age || null);
        setProfilePhoto(user.avatar1 || profilePhoto);
        setBio(user.bio || '');
        setIsVerified(user.isVerified || false);
        setIsPremiumActive(user.isPremiumActive || false);
  
        // ✅ Save API response for offline access
        await AsyncStorage.setItem('user', JSON.stringify(user));
      } catch (error) {
        console.log('API error, loading from AsyncStorage', error);
  
        // 🔄 Load offline data only if API fails
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setName(user.fullName || '');
          setAge(user.age || null);
          setProfilePhoto(user.avatar1 || profilePhoto);
          setBio(user.bio || '');
        } else {
           ToastAndroid.show("No data found/ server error", ToastAndroid.SHORT);
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchUser();
  }, []);
  

  const handleUpgrade = () => {
    navigation.navigate('Premium');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#FFF' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileContainer}>
      <View style={styles.profileImageContainer}>
  <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
  
  {/* Edit Icon */}
  <TouchableOpacity style={styles.editIcon} onPress={() => navigation.navigate('EditProfile')}>
    <Icon name="pencil" size={14} color="#121212" />
  </TouchableOpacity>

        {/* Verification Badge */}
    <Icon 
        name="check-circle" 
        size={24} 
        color={isVerified ? "blue" : "grey"} 
        style={styles.verificationIcon} 
      />
</View>
        <Text style={styles.username}>{name}, {age}</Text>
        <Text style={styles.bio}>{bio}</Text>
      </View>

      {/* Upgrade Section */}
      <View style={styles.upgradeContainer}>
        <Text style={styles.upgradeTitle}>Kute-T 💕</Text>
        <Text style={styles.upgradeDescription}>
          Get 3x more matches and top your profile!
        </Text>
        <CustomButton title="Become a Kute-T" onPress={handleUpgrade} />
      </View>

      {/* Boost & Roses Section */}
      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Icon name="bolt" size={24} color="#FFA62B" />
          <Text style={styles.cardTitle}>Boost</Text>
          <Text style={styles.cardText}>Increase your visibility by 11%</Text>
        </View>
        <View style={styles.card}>
          <Icon name="heart" size={24} color="purple" />
          <Text style={styles.cardTitle}>Super Likes</Text>
          <Text style={styles.cardText}>Send special likes to your crush!</Text>
        </View>
        <View style={styles.card}>
          <Icon name="heart" size={24} color="purple" />
          <Text style={styles.cardTitle}>Unlock all features</Text>
          <Text style={styles.cardText}>Unlock all the premium features</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    elevation: 5,
  },
  username: {
    marginTop: 15,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#B0B0B0',
  },
  bio: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 5,
  },
  upgradeContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    marginTop: 30,
    alignItems: 'center',
    elevation: 5,
    padding: 50,
  },
  upgradeTitle: {
    color: '#FFA62B',
    fontSize: 20,
    fontWeight: 'bold',
  },
  upgradeDescription: {
    color: '#B0B0B0',
    textAlign: 'center',
    marginVertical: 10,
  },
  cardsContainer: {
    marginTop: 30,
  },
  card: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#FFA62B',
  },
  cardText: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  verificationIcon: {
    position: 'absolute',
    right: -50, 
    top: 120,
    borderRadius: 15,
    padding: 2,
  },
  
});

export default ProfileScreen;
