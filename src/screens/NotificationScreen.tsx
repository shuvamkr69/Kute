import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Notifications'>;

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const notifications = [
    { id: 1, message: 'You have a new match!', time: '2 mins ago' },
    { id: 2, message: 'Someone liked your profile!', time: '10 mins ago' },
    { id: 3, message: 'Your profile was boosted!', time: '1 hour ago' },
    { id: 4, message: 'New message from Kute Support', time: 'Yesterday' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      {notifications.map((notification) => (
        <View key={notification.id} style={styles.card}>
          <Text style={styles.message}>{notification.message}</Text>
          <Text style={styles.time}>{notification.time}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFA62B',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFA62B',
    shadowColor: '#FFA62B',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
  message: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
  },
  time: {
    fontSize: 14,
    color: '#B0B0B0',
  },
});

export default NotificationsScreen;
