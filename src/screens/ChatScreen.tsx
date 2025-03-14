import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { io } from 'socket.io-client';

type Props = NativeStackScreenProps<any, 'Chat'>;

const socket = io('http://localhost:3000'); // Replace with your backend server URL

const ChatScreen: React.FC<Props> = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ text: string; user: string }[]>([]);

  useEffect(() => {
    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off('message');
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = { text: message, user: 'You' };
      socket.emit('message', newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={item.user === 'You' ? styles.myMessage : styles.otherMessage}>
            <Text style={styles.messageText}>{item.user}: {item.text}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
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
