import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { 
  testLocalNotification, 
  testMatchNotification, 
  testVibration, 
  checkNotificationStatus, 
  testBackendNotification, 
  testBackendMatchNotification, 
  testCompleteFlow 
} from '../utils/notificationDebug';

const NotificationDebugPanel = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Notification Debug Panel</Text>
      
      <TouchableOpacity onPress={testLocalNotification} style={[styles.button, {backgroundColor: 'blue'}]}>
        <Text style={styles.buttonText}>Test Local Notification</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={testMatchNotification} style={[styles.button, {backgroundColor: 'green'}]}>
        <Text style={styles.buttonText}>Test Match Notification + Vibration</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={testBackendNotification} style={[styles.button, {backgroundColor: 'orange'}]}>
        <Text style={styles.buttonText}>Test Backend Notification</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={testBackendMatchNotification} style={[styles.button, {backgroundColor: 'red'}]}>
        <Text style={styles.buttonText}>Test Backend Match Notification</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={testVibration} style={[styles.button, {backgroundColor: 'purple'}]}>
        <Text style={styles.buttonText}>Test Vibration Only</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={checkNotificationStatus} style={[styles.button, {backgroundColor: 'gray'}]}>
        <Text style={styles.buttonText}>Check Notification Status</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={testCompleteFlow} style={[styles.button, {backgroundColor: 'black'}]}>
        <Text style={styles.buttonText}>Test Complete Flow</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1E1E1E',
    margin: 10,
    borderRadius: 10,
  },
  title: {
    color: '#de822c',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    padding: 12,
    margin: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default NotificationDebugPanel;

/*
To use this component, add it to any screen:

import NotificationDebugPanel from '../components/NotificationDebugPanel';

// Then in your render:
<NotificationDebugPanel />

This will give you all the test buttons in one place to debug your notifications.
*/
