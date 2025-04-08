import React, { useEffect, useState, useRef, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { io } from 'socket.io-client';
import { Ionicons, Entypo } from '@expo/vector-icons';
import api from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import LoadingScreen from './LoadingScreen';

import AiChatbot from '../components/AiChatbot';

type RootStackParamList = {
  Chat: {
    likedUserId: string;
    userName: string;
    loggedInUserId: string;
    likedUserAvatar?: string;
  };
};

type Message = {
  _id: string;
  text: string;
  senderId: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;



const socket = io('http://192.168.193.211:3000');

const MessageItem = memo(({ text, isMyMessage }: { text: string; isMyMessage: boolean }) => (
  <View style={isMyMessage ? styles.myMessage : styles.otherMessage}>
    <Text style={styles.messageText}>{text}</Text>
  </View>
));

const ChatScreen: React.FC<Props> = ({ route }) => {
  const { likedUserId, userName, loggedInUserId, likedUserAvatar } = route.params;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);

  const navigation = useNavigation();


  useEffect(() => {
    let isMounted = true;

    const fetchConversation = async () => {
      try {
        const response = await api.post<{ _id: string }>(`/api/v1/users/chats`, {
          userId: loggedInUserId,
          receiverId: likedUserId,
        });
        const convId = response.data._id;
        setConversationId(convId);
        socket.emit('joinConversation', convId);

        if (likedUserAvatar) {
          setProfileImage(likedUserAvatar);
        } else {
          const userDetailsResponse = await api.get<{ avatar1: string }>(`/api/v1/users/${likedUserId}`);
          setProfileImage(userDetailsResponse.data.avatar1);
        }

        if (convId) {
          const messagesResponse = await api.get<Message[]>(`/api/v1/users/messages/${convId}`);
          if (isMounted && messagesResponse.data) {
            const uniqueMessages = Array.from(new Map(messagesResponse.data.map(msg => [msg._id, msg])).values());
            setMessages(uniqueMessages);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching conversation:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchConversation();

    return () => {
      isMounted = false;
      socket.off('newMessage');
    };
  }, [likedUserId, loggedInUserId]);

  useEffect(() => {
    const handleNewMessage = (newMessage: Message) => {
      if (newMessage.senderId === loggedInUserId) return;

      setMessages(prevMessages => {
        if (prevMessages.some(msg => msg._id === newMessage._id)) return prevMessages;
        return [...prevMessages, newMessage];
      });

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [conversationId, loggedInUserId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (!message.trim() || !conversationId) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tempMessage: Message = { _id: tempId, text: message, senderId: loggedInUserId };

    setMessages(prev => [...prev, tempMessage]);
    setMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await api.post<{ _id: string; message: string }>(`/api/v1/users/messages`, {
        message,
        conversationId,
        senderId: loggedInUserId,
      });

      setMessages(prev =>
        prev.map(msg => (msg._id === tempId ? { ...msg, _id: response.data._id, text: response.data.message } : msg))
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
  };

  const handleOptionPress = async (option: string) => {
    setMenuVisible(false);
  
    switch (option) {
      case 'delete':
        Alert.alert(
          'Delete All Chats',
          'Are you sure you want to delete all chats?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                if (!conversationId) return;
  
                try {
                  await api.delete(`/api/v1/users/deleteAllMessages/${conversationId}`);
                  setMessages([]); // Clear messages locally
                  Alert.alert('Deleted', 'All chats have been deleted.');
                } catch (err) {
                  console.error('Error deleting chats:', err);
                  Alert.alert('Error', 'Failed to delete chats.');
                }
              },
            },
          ]
        );
        break;
  
      case 'mute':
        Alert.alert('Mute Notifications', 'You will not receive notifications for this chat.', [{ text: 'OK' }]);
        break;
  
      case 'block':
        Alert.alert('Block User', 'This user has been blocked.', [{ text: 'OK' }]);
        break;
    }
  };
  

  return (
<KeyboardAvoidingView
  style={{ flex: 1}}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>


      <View style={styles.topBar}>
        <View style={styles.leftSection}>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={'white'} />
          </TouchableOpacity>
          

          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName[0]?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.chatHeader}>{userName}</Text>
        </View>
        <View style={styles.iconGroup}>
          <TouchableOpacity onPress={() => Alert.alert('Phone Call', 'Call feature not implemented yet.')}>
            <Ionicons name="call-outline" size={24} color="white" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Entypo name="dots-three-vertical" size={20} color="white" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>


      <View style={styles.container}>
        {loading ? (
          <LoadingScreen description="Cupid’s syncing your chats... 🏹" />
        ) : (
          <FlatList
            showsVerticalScrollIndicator={false}
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => (
              <MessageItem text={item.text} isMyMessage={item.senderId === loggedInUserId} />
            )}
            keyExtractor={item => item._id}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#B0B0B0"
          />
          <TouchableOpacity onPress={sendMessage}>
            <Image
              source={require('../assets/icons/send-message.png')}
              style={styles.sendIcon}
            />
          </TouchableOpacity>

        </View>
      </View>

      {/* Options Modal */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <TouchableOpacity style={styles.modalBackground} onPress={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            <Text onPress={() => handleOptionPress('delete')} style={styles.menuItem}>Delete All Chats</Text>
            <Text onPress={() => handleOptionPress('mute')} style={styles.menuItem}>Mute Notifications</Text>
            <Text onPress={() => handleOptionPress('block')} style={styles.menuItem}>Block User</Text>
          </View>
        </TouchableOpacity>
      </Modal>
      <AiChatbot messages={messages} loggedInUserId={loggedInUserId} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center', // ensures vertical centering
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 60, // fixed height helps with alignment
    backgroundColor: 'black',
    borderBottomWidth: 1,
    borderBottomColor: '#5de383',
    elevation: 3,
    shadowColor: 'black',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  
  chatHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center', // vertical center inside icon group
    gap: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 1,
    paddingBottom: 0, // Add this
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#5de383',
    paddingVertical: 10,
    backgroundColor: 'black',
    width: '100%',
    marginTop: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    backgroundColor: 'black',
    paddingHorizontal: 15,
    borderRadius: 10,
    marginRight: 10,
    paddingVertical: 10,	
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#5de383',
    padding: 10,
    marginVertical: 5,
    borderRadius: 14,
    maxWidth: '80%',
    elevation: 3,
    paddingHorizontal: 15,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#242424',
    padding: 10,
    marginVertical: 5,
    borderRadius: 14,
    maxWidth: '80%',
    elevation: 2,
    paddingHorizontal: 15,
  },
  messageText: {
    color: 'white',
    margin: 3,
  },
  avatarImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#5de383',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  sendIcon: {
    width: 25,
    height: 25,
    tintColor: '#5de383', // Optional: if you want to color the icon
    marginRight: 10,
  },
  
  icon: {
    marginLeft: 15,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  menuItem: {
    color: 'white',
    fontSize: 16,
    paddingVertical: 10,
  },
});

export default ChatScreen;
