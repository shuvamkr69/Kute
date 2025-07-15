import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator, Platform } from 'react-native';
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
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
  });
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const mapRef = useRef(null);

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
    if (!hasPermission) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const locationObj = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = locationObj.coords;
      setSelectedLocation({ latitude, longitude });
      // Center map
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
      // Reverse geocode
      const addressArr = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addressArr && addressArr.length > 0) {
        const item = addressArr[0];
        const addr = `${item.name ? item.name + ', ' : ''}${item.street ? item.street + ', ' : ''}${item.city ? item.city + ', ' : ''}${item.region ? item.region + ', ' : ''}${item.country ? item.country : ''}`;
        setAddress(addr);
        setLocation(addr);
        if (item.country) setCountry(item.country);
      } else {
        setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
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
      // Store lat/lng string for backend, but show address in UI
      userData.location = `${selectedLocation.latitude.toFixed(5)}, ${selectedLocation.longitude.toFixed(5)}`;
      userData.country = country;

      await AsyncStorage.setItem('tempUserData', JSON.stringify(userData));

      navigation.navigate('AddProfilePictures');
    } catch (error) {
      Alert.alert('Error', 'There is a problem with the server');
    }
  };

  const handleConfirmLocation = async () => {
    setLoading(true);
    try {
      const { latitude, longitude } = selectedLocation;
      const addressArr = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addressArr && addressArr.length > 0) {
        const item = addressArr[0];
        const addr = `${item.name ? item.name + ', ' : ''}${item.street ? item.street + ', ' : ''}${item.city ? item.city + ', ' : ''}${item.region ? item.region + ', ' : ''}${item.country ? item.country : ''}`;
        setAddress(addr);
        setLocation(addr);
        if (item.country) setCountry(item.country);
      } else {
        setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get address for this location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title={"Your current location"} />
      <SafeAreaView style={styles.container}>
        {loading ? (
          <View style={styles.centeredLoader}>
            <ActivityIndicator size="large" color="#de822c" />
          </View>
        ) : (
          <>
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                region={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
              >
                <Marker
                  coordinate={selectedLocation}
                  draggable
                  onDragEnd={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
                />
              </MapView>
            </View>
            <TouchableOpacity style={styles.mapButtonModern} onPress={handleConfirmLocation}>
              <Text style={styles.mapButtonText}>Confirm Location</Text>
            </TouchableOpacity>
            <View style={[styles.inputContainer, { marginTop: 18 }]}> 
              <Icon name="map-marker" size={20} color="#B0B0B0" style={styles.icon} />
              <Text style={[styles.input, { color: location ? 'white' : '#B0B0B0' }]}> 
                {address || 'Location'}
              </Text>
            </View>
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
            <TouchableOpacity style={styles.buttonModern} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
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
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#23242a',
    backgroundColor: '#181A20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  mapButtonModern: {
    backgroundColor: '#23242a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#de822c',
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#de822c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  mapButtonText: {
    color: '#de822c',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  buttonModern: {
    backgroundColor: '#de822c',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#de822c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default LocationUniversityPage;