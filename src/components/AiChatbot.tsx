import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';

type Message = {
  _id: string;
  text: string;
  senderId: string;
};

type Props = {
  messages: Message[];
  loggedInUserId: string;
};

const AiChatbot: React.FC<Props> = ({ messages, loggedInUserId }) => {
  const [visible, setVisible] = useState(false);
  const [adviceHistory, setAdviceHistory] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  // Instead of sending full `messages`, do this:
const limitedMessages = messages.slice(-10); // Get last 10 messages

const safeMessages = limitedMessages.map(msg => ({
    ...msg,
    text: msg.text.slice(0, 1000), // Limit each message to 1000 characters
  }));


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [adviceHistory]);

  const askCupid = async () => {
    if (!userInput.trim()) return;

    setAdviceHistory(prev => [...prev, `🧑‍💬: ${userInput}`]);
    setLoading(true);
    try {
      const res = await api.post('/api/v1/users/aiChatbot/advice', {
        chatMessages: messages,
        loggedInUserId,
        userInput,
      });

      const responseText = res.data?.response || "Cupid's lost in love... try again!";
      console.log('Response from Cupid:', res.data);
      setAdviceHistory(prev => [...prev, `💘 Cupid: ${responseText}`]);
    } catch (err) {
      setAdviceHistory(prev => [...prev, `💘 Cupid: Sorry, something went wrong.`]);
    } finally {
      setUserInput('');
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.fab}>
        <Image
          source={require('../assets/images/cupid.png')} // your downloaded image here
          style={styles.iconImage}
        />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalBackground}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.title}>💘 Ask Cupid for Advice</Text>
            <ScrollView style={styles.history} ref={scrollRef}>
              {adviceHistory.map((line, i) => (
                <Text
                key={i}
                style={[
                  styles.chatLine,
                  line.startsWith('💘') ? styles.cupidMessage : styles.userMessage,
                ]}
              >
                {line}
              </Text>
              
              ))}
              {loading && <ActivityIndicator size="small" color="#5de383" />}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Type your love question..."
                placeholderTextColor="#888"
                value={userInput}
                onChangeText={setUserInput}
                style={styles.input}
              />
              <TouchableOpacity onPress={askCupid} disabled={loading || !userInput.trim()}>
                <LinearGradient
                    colors={['#5de383', '#00FFFF']}
                    style={[
                    styles.sendBtn,
                    { opacity: loading || !userInput.trim() ? 0.5 : 1 },
                    ]}
                >
                    <Text style={styles.sendText}>Send</Text>
                </LinearGradient>
                </TouchableOpacity>

            </View>

            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    zIndex: 999,
  },
  iconImage: {
    width: 55,
    height: 55,
    borderRadius: 30,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 20,
    width: '90%',
    height: '80%',
  },
  title: {
    color: '#5de383',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  history: {
    flex: 1,
    marginBottom: 10,
  },
  chatLine: {
    color: '#fff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#2b2b2b',
    color: 'white',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  sendBtn: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sendText: {
    color: '#000',
    fontWeight: 'bold',
  },
  closeBtn: {
    marginTop: 10,
    alignSelf: 'center',
  },
  closeText: {
    color: '#5de383',
    fontWeight: 'bold',
  },
  cupidMessage: {
    color: '#00FFFF',
    fontStyle: 'italic',
  },
  userMessage: {
    color: '#fff',
  },
  
});

export default AiChatbot;
