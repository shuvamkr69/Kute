import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import BackButton from '../components/BackButton';
import { getUserId } from '../utils/constants';

type Props = NativeStackScreenProps<any, 'AllChatScreen'>;

const ChatsScreen: React.FC<Props> = ({ navigation }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ✅ Fetch all chats from API
  const fetchChats = async () => {
    try {
      const userId = await getUserId();
      const response = await api.get(`/api/v1/users/chats/${userId}`);
      setChats(response.data.chats);

      // ✅ Cache the data in AsyncStorage
      await AsyncStorage.setItem('chats', JSON.stringify(response.data.chats));
    } catch (error) {
      console.error('Error fetching chats:', error);

      // ✅ Fallback to cached data if API fails
      const storedChats = await AsyncStorage.getItem('chats');
      if (storedChats) {
        setChats(JSON.parse(storedChats));
        Alert.alert('Offline Mode', 'Showing cached chats');
      } else {
        Alert.alert('Error', 'Unable to load chats. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FFA62B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.headingText}>Your Chats</Text>

      {chats.length === 0 ? (
        <Text style={styles.noChatsText}>No chats found. Start chatting now!</Text>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.chatId}
          renderItem={({ item }) => (
            <View style={styles.chatItem}>
              <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
              <View style={styles.chatDetails}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={styles.lastMessage}>{item.lastMessage}</Text>
              </View>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => navigation.navigate('ChatScreen', { chatId: item.chatId })}
              >
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  headingText: {
    color: '#FFA62B',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  chatDetails: {
    flex: 1,
  },
  chatName: {
    color: '#FFA62B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastMessage: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  chatButton: {
    backgroundColor: '#FFA62B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  chatButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  noChatsText: {
    color: '#B0B0B0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default ChatsScreen;
