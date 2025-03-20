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
  ScrollView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { io } from 'socket.io-client';
import api from '../utils/api';

type RootStackParamList = {
  Chat: { likedUserId: string; userName: string; loggedInUserId: string };
};

type Message = {
  _id: string;
  text: string;
  senderId: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const socket = io('http://192.168.193.211:3000');

// Memoized Message Item
const MessageItem = memo(({ text, isMyMessage }: { text: string; isMyMessage: boolean }) => (
  <View style={isMyMessage ? styles.myMessage : styles.otherMessage}>
    <Text style={styles.messageText}>{text}</Text>
  </View>
));

const ChatScreen: React.FC<Props> = ({ route }) => {
  const { likedUserId, userName, loggedInUserId } = route.params;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList<Message>>(null); // Ref for scrolling

  // Fetch or Create Conversation & Join Room
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

  // Listen for New Messages & Auto-Scroll
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

  // Auto-scroll to last message when chat is opened
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    }
  }, [messages.length]);

  // Send Message
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
      console.error('❌ Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <Text style={styles.chatHeader}>Chat with {userName}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#FFA62B" />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => <MessageItem text={item.text} isMyMessage={item.senderId === loggedInUserId} />}
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
          <Button title="Send" onPress={sendMessage} color="#FFA62B" />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  chatHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#FFA62B',
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 15,
    borderRadius: 10,
    marginRight: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFA62B',
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E1E1E',
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  messageText: {
    color: 'white',
  },
});

export default ChatScreen;
