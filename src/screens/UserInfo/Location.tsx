import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator, Platform, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../../components/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const { width } = Dimensions.get('window');

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
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Where are you?</Text>
          <Text style={styles.headerSubtitle}>
            Help us find your perfect matches nearby
          </Text>
        </View>

        {loading ? (
          <View style={styles.centeredLoader}>
            <ActivityIndicator size="large" color="#de822c" />
            <Text style={styles.loadingText}>Getting your location...</Text>
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
                >
                  <View style={styles.customMarker}>
                    <GradientIcon name="location" size={30} />
                  </View>
                </Marker>
              </MapView>
              <TouchableOpacity 
                style={styles.mapConfirmButton} 
                onPress={handleConfirmLocation}
                activeOpacity={0.8}
              >
                <GradientIcon name="checkmark-circle" size={20} />
                <Text style={styles.mapConfirmButtonText}>Confirm Location</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputsSection}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <GradientIcon name="location-outline" size={20} />
                </View>
                <Text style={styles.locationText} numberOfLines={2}>
                  {address || 'Tap on map to select location'}
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <GradientIcon name="flag-outline" size={20} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Country / Region"
                  placeholderTextColor="#888"
                  value={country}
                  onChangeText={setCountry}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#de822c", "#ff172e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
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
    paddingTop: 20,
    paddingBottom: 30,
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
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#A1A7B3',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#23262F',
    backgroundColor: '#181A20',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 5,
    borderWidth: 2,
    borderColor: '#de822c',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mapConfirmButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#181A20',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#de822c',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mapConfirmButtonText: {
    color: '#de822c',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  inputsSection: {
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#23262F',
    paddingHorizontal: 15,
    paddingVertical: 18,
  },
  inputIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
    lineHeight: 22,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 17,
    marginRight: 8,
  },
});

export default LocationUniversityPage;