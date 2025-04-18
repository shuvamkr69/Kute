import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView, Alert, Button } from 'react-native';
import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../navigation/AuthContext';
import CustomButton from '../components/Button';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';
import * as Location from 'expo-location';
import CustomAlert from '../components/CustomAlert';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';



type Props = NativeStackScreenProps<any, 'Settings'>;

const SettingScreen: React.FC<Props> = ({ navigation }) => {
  const { signOut } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(false);
  const [visibility, setVisibility] = useState(true);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const handleLogout = () => {
    setShowLogoutAlert(true); // Show the custom alert
  };
  
  const confirmLogout = async () => {
    try {
      const response = await api.post('/api/v1/users/logout');
      console.log('Logout Response:', response.data);
      await AsyncStorage.clear();
      signOut();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };
  

  const handleDeactivateAccount = async () => {
    try {
      const response = await api.post('/api/v1/users/deactivate');
      console.log('Account Deactivated:', response.data);
      Alert.alert("Account Deactivated", "Your account has been temporarily deactivated. You can reactivate it by logging in again.");
      await AsyncStorage.clear();
      signOut();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Deactivation Error:', error);
      Alert.alert("Error", "Failed to deactivate account.");
    }
  };

  const handleLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
  
      if (status === 'granted') {
        Toast.show({
          type: 'success',
          text1: 'Location Access',
          text2: 'Location access is already enabled.',
        });
      } else {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus === 'granted') {
          Toast.show({
            type: 'success',
            text1: 'Permission Granted',
            text2: 'Location access has been enabled.',
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Permission Denied',
            text2: 'You denied location access. Enable it from settings if needed.',
          });
        }
      }
    } catch (error) {
      console.error('Location Permission Error:', error);
      Alert.alert('Error', 'An error occurred while requesting location permissions.');
    }
  };
  
  
  const handleEnableNotifications = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('Permission Denied', 'You denied push notification access.');
        return;
      }
    }
    Alert.alert('Success', 'Push notifications enabled!');
  };
  
  
  

  const handleAccountOptions = async () => {
    Alert.alert(
      "Manage Account",
      "Would you like to delete your account permanently or deactivate it temporarily? Deactivating will hide your profile until you reactivate it.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Deactivate Account", 
          onPress: handleDeactivateAccount
        },
        { 
          text: "Delete Account", 
          onPress: async () => {
            try {
              const response = await api.delete('/api/v1/users/deleteAccount');
              console.log('Account Deleted:', response.data);
              await AsyncStorage.clear();
              signOut();
              navigation.navigate('Login');
            } catch (error) {
              console.error('Delete Error:', error);
              Alert.alert("Error", "Failed to delete account.");
            }
          }
        },
      ]
    );
  };
  
  

  React.useEffect(() => {
    navigation.setOptions({ title: 'Settings' });
  }, [navigation]);

  return (
    <View style={styles.backButtonContainer}>
    <BackButton title = {'User Settings'}/>

    <ScrollView style={styles.container}>
      <CustomAlert
          visible={showLogoutAlert}
          title="Confirm Logout"
          message="Are you sure you want to logout from your account?"
          onClose={() => setShowLogoutAlert(false)}
          onConfirm={confirmLogout}
          confirmText="Logout"
          cancelText="Cancel"
        />


      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.option} onPress = {() => navigation.navigate('EditProfile')} >
          <Text style={styles.optionText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Email Preferences</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => { navigation.navigate("PhotoVerification"); } }>
          <Text style={styles.optionText}>Verify your account</Text>
        </TouchableOpacity>

        
      </View>

      {/* Privacy Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>


        <View style={styles.optionWithSwitch}>
          <Text style={styles.optionText}>Location Access</Text>
          <TouchableOpacity onPress={handleLocation} style={styles.locationButton}>
            <Text style={styles.locationButtonText}>{location ? 'Enabled' : 'Enable'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.optionWithSwitch}>
          <Text style={styles.optionText}>Anonymous browsing</Text>    
          <Switch
            value={visibility}
            onValueChange={setVisibility}
            thumbColor={visibility ? '#de822c' : '#B0B0B0'}
            trackColor={{ false: '#555', true: '#de822c' }}
          />
        </View>
        

      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.optionWithSwitch}>
          <Text style={styles.optionText}>Push Notifications</Text>
          <TouchableOpacity onPress={handleEnableNotifications} style={styles.locationButton}>
            <Text style={styles.locationButtonText}>Enable</Text>
          </TouchableOpacity>

        </View>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Email Notifications</Text>
        </TouchableOpacity>
      </View>

      {/* Help & Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Help Center</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Report a Problem</Text>
        </TouchableOpacity>
      </View>


      {/* Logout */}

      <View style={styles.logoutSection}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
  <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleAccountOptions}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>
      
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 20,
  },
  backButtonContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 30,
    marginLeft: 50,
  },
  section: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  option: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  optionText: {
    fontSize: 16,
    color: '#B0B0B0',
    
  },
  optionWithSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logoutSection: {
    marginBottom: 30,
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  logoutButton:{
    marginBottom: 5,
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#d9534f',
    width: '100%',
    padding: 15,
    borderRadius: 10,
  },
  logoutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    marginBottom: 20,
    backgroundColor: '#ff3e30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationButton: {
    backgroundColor: '#de822c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  
});

export default SettingScreen;
