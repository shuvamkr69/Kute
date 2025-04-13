import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Modal, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../../components/BackButton';

type Props = NativeStackScreenProps<any, 'Location'>;

const LocationUniversityPage: React.FC<Props> = ({ navigation }) => {
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
  });
  const [loading, setLoading] = useState(false);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to fetch your location.');
      return false;
    }
    return true;
  };

  const fetchCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocation(`${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}`);
    } catch (error) {
      Alert.alert('Location Error', 'Unable to fetch location');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const handleSubmit = async () => {
    if (!location || !country) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const tempUserData = await AsyncStorage.getItem('tempUserData');
      if (!tempUserData) {
        Alert.alert('Error', 'No temporary data found');
        return;
      }

      const userData = JSON.parse(tempUserData);
      userData.location = location;
      userData.country = country;

      await AsyncStorage.setItem('tempUserData', JSON.stringify(userData));

      navigation.navigate('AddProfilePictures');
    } catch (error) {
      Alert.alert('Error', 'There is a problem with the server');
    }
  };

  const handleConfirmLocation = () => {
    const locString = `${selectedLocation.latitude.toFixed(5)}, ${selectedLocation.longitude.toFixed(5)}`;
    setLocation(locString);
    setShowMapModal(false);
  };

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title= {"Your current location"}/>
      <SafeAreaView style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#de822c" style={styles.loader} />}
      <Text style={styles.subtitle}>Please provide your location and country</Text>

      <TouchableOpacity onPress={() => setShowMapModal(true)} style={styles.inputContainer}>
        <Icon name="map-marker" size={20} color="#B0B0B0" style={styles.icon} />
        <Text style={[styles.input, { color: location ? 'white' : '#B0B0B0' }]}>
          {location || 'Location'}
        </Text>
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Icon name="flag" size={20} color="#B0B0B0" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Country / Region"
          placeholderTextColor="#B0B0B0"
          value={country}
          onChangeText={setCountry}
        />
      </View>


      <Modal
        animationType="slide"
        transparent={false}
        visible={showMapModal}
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
          >
            <Marker
              coordinate={selectedLocation}
              draggable
              onDragEnd={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
            />
          </MapView>
            <View style={styles.mapButtonContainer}>
            <TouchableOpacity style={styles.mapButton} onPress={handleConfirmLocation}>
              <Text style={styles.buttonText}>Confirm Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapButton} onPress={() => setShowMapModal(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            </View>
            
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>

    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 20,
    justifyContent: 'center',
  },
  backButtonContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 10,
    color: 'white',
  },
  icon: {
    marginRight: 10,
  },
  button: {
    backgroundColor: '#de822c',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    bottom: 0,
    
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  map: {
    flex: 1
  },
  mapButtonContainer :{
    backgroundColor : '1e1e1e',
  },
  mapButton: {
    backgroundColor: '#de822c',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    margin: 10,
  },
});

export default LocationUniversityPage;