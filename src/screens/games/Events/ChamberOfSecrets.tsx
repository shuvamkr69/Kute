import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { getSocket } from '../../../utils/socket';
import api from '../../../utils/api';
import { getUserId } from '../../../utils/constants';
import { Ionicons } from '@expo/vector-icons';

const BG_IMAGE = require('../../../../assets/gameScreenImages/brick-bg.png');
const API_URL = '/api/v1/users/chamber-of-secrets/messages'; // Relative to api baseURL
import BackButton from '../../../components/BackButton';

const ChamberOfSecrets = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [lastSent, setLastSent] = useState<{ text: string; createdAt: number } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    getUserId().then(setUserId);
    // Fetch previous messages
    api.get(API_URL).then(res => {
      setMessages(res.data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    });
    // Connect to socket
    const socket = getSocket();
    socket.emit('joinChamber');
    socket.on('newChamberMessage', (msg: any) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    socketRef.current = socket;
    return () => {
      socket.off('newChamberMessage');
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim() || !userId) return;
    const now = Date.now();
    setLastSent({ text: input.trim(), createdAt: now });
    socketRef.current.emit('sendChamberMessage', { text: input.trim(), senderId: userId });
    setInput('');
  };

  const renderItem = ({ item }: { item: any }) => {
    let isMine = false;
    if (userId && item.senderId && item.senderId === userId) {
      isMine = true;
    }
    // fallback for old messages (no senderId):
    if (!item.senderId && lastSent && item.text === lastSent.text && Math.abs(new Date(item.createdAt).getTime() - lastSent.createdAt) < 5000) {
      isMine = true;
    }
    return (
      <View style={styles.shadowContainer}>
        <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
          <Text style={[styles.messageText, isMine && styles.myMessageText]}>{item.text}</Text>
          <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title="Chamber Of Secrets" />
    <ImageBackground source={BG_IMAGE} style={styles.bgImage} resizeMode="cover">
      <View style={styles.overlay} />
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type a secret..."
              placeholderTextColor="#eec095"
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage} activeOpacity={0.8}>
              <Ionicons name="send" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(32, 24, 24, 0.75)',
    zIndex: 1,
  },
  container: {
    flex: 1,
    zIndex: 2,
    paddingTop: 40,
    paddingHorizontal: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#eec095',
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    backgroundColor: 'rgba(178,216,216,0.92)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    maxWidth: '85%',
    // Enhanced shadow for both sender and receiver
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8, // For Android
  },
  shadowContainer: {
    width: '100%',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10, // For Android
    marginBottom: 2,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,76,76,0.95)',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#23262F',
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 2,
  },
  myMessageText: {
    color: 'white',
  },
  timeText: {
    color: 'white',
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 4,
    opacity: 0.7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(35,38,47,0.95)',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eec09533',
    borderRadius: 16,
    margin: 10,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(24,26,32,0.95)',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eec09555',
  },
  sendButton: {
    backgroundColor: '#e18e41',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#de822c',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});

export default ChamberOfSecrets;
