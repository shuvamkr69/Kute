import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../navigation/AuthContext';
import CustomButton from '../components/Button';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<any, 'Settings'>;

const SettingScreen: React.FC<Props> = ({ navigation }) => {
  const { signOut } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(false);
  const [visibility, setVisibility] = useState(true);

  const handleLogout = async () => {
    const response = await api.post('/api/v1/users/logout');
    console.log('Logout Response:', response.data);
    await AsyncStorage.clear();
    signOut();
    navigation.navigate('Login');
  };

  React.useEffect(() => {
    navigation.setOptions({ title: 'Settings' });
  }, [navigation]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Email Preferences</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.optionWithSwitch}>
          <Text style={styles.optionText}>Show Me on Kute</Text>
          <Switch
            value={visibility}
            onValueChange={setVisibility}
            thumbColor={visibility ? '#5de383' : '#B0B0B0'}
            trackColor={{ false: '#555', true: '#5de383' }}
          />
        </View>
        <View style={styles.optionWithSwitch}>
          <Text style={styles.optionText}>Location Access</Text>
          <Switch
            value={location}
            onValueChange={setLocation}
            thumbColor={location ? '#5de383' : '#B0B0B0'}
            trackColor={{ false: '#555', true: '#5de383' }}
          />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.optionWithSwitch}>
          <Text style={styles.optionText}>Push Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            thumbColor={notifications ? '#5de383' : '#B0B0B0'}
            trackColor={{ false: '#555', true: '#5de383' }}
          />
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

      <View style={styles.section}>
        <TouchableOpacity style={styles.sectionTitle}>
        <Text onPress={handleLogout}>Logout</Text>
        </TouchableOpacity>
         
      </View>

      
      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    color: '#5de383',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  option: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  optionText: {
    fontSize: 18,
    color: '#B0B0B0',
  },
  optionWithSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logoutSection: {
    marginBottom: 50,
    marginTop: 20,
    alignItems: 'center',
  },
});

export default SettingScreen;
