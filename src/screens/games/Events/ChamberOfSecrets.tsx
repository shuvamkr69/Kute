import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ImageBackground, ActivityIndicator, Modal, Animated } from 'react-native';
import { getSocket } from '../../../utils/socket';
import api from '../../../utils/api';
import { getUserId } from '../../../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const BG_IMAGE = require('../../../../assets/gameScreenImages/brick-bg.png');
const API_URL = '/api/v1/users/chamber-of-secrets/messages'; // Relative to api baseURL
import BackButton from '../../../components/BackButton';

const ChamberOfSecrets = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [lastSent, setLastSent] = useState<{ text: string; createdAt: number } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [userRandomName, setUserRandomName] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initialize user ID first
  useEffect(() => {
    const initializeUserId = async () => {
      try {
        const id = await getUserId();
        setUserId(id);
      } catch (error) {
        console.error('Failed to get user ID:', error);
      }
    };
    initializeUserId();

    // Start fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Start pulse animation for connection indicator
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  // Handle socket connection and data fetching
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      const initializeChat = async () => {
        try {
          setIsLoading(true);
          
          // Fetch previous messages
          const response = await api.get(API_URL);
          setMessages(response.data || []);
          
          // Connect to socket
          const socket = getSocket();
          socketRef.current = socket;
          
          socket.emit('joinChamber', { userId });
          setIsConnected(true);
          
          socket.on('newChamberMessage', (msg: any) => {
            setMessages(prev => [...prev, msg]);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          });

          socket.on('chamberUserCount', (count: number) => {
            setOnlineCount(count);
          });

          socket.on('chamberUserInfo', ({ randomName }: { randomName: string }) => {
            setUserRandomName(randomName);
          });

          socket.on('chamberError', ({ message }: { message: string }) => {
            console.error('Chamber error:', message);
          });
          
          // Auto-scroll to bottom after initial load
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 200);
          
        } catch (error) {
          console.error('Failed to initialize chat:', error);
        } finally {
          setIsLoading(false);
        }
      };

      initializeChat();

      // Cleanup on screen unfocus
      return () => {
        if (socketRef.current) {
          socketRef.current.off('newChamberMessage');
          socketRef.current.off('chamberUserCount');
          socketRef.current.off('chamberUserInfo');
          socketRef.current.off('chamberError');
          setIsConnected(false);
          setUserRandomName('');
        }
      };
    }, [userId])
  );

  const sendMessage = useCallback(() => {
    if (!input.trim() || !userId || !isConnected) return;
    
    const now = Date.now();
    setLastSent({ text: input.trim(), createdAt: now });
    socketRef.current?.emit('sendChamberMessage', { text: input.trim(), senderId: userId });
    setInput('');
  }, [input, userId, isConnected]);

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    let isMine = false;
    if (userId && item.senderId && item.senderId === userId) {
      isMine = true;
    }
    // fallback for old messages (no senderId):
    if (!item.senderId && lastSent && item.text === lastSent.text && Math.abs(new Date(item.createdAt).getTime() - lastSent.createdAt) < 5000) {
      isMine = true;
    }

    const messageTime = new Date(item.createdAt);
    const timeString = messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const displayName = item.senderName || 'Anonymous';

    return (
      <Animated.View 
        style={[
          styles.messageContainer,
          { opacity: fadeAnim }
        ]}
      >
        <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
          {!isMine && (
            <View style={styles.messageHeader}>
              <View style={styles.anonymousAvatar}>
                <Ionicons name="person" size={12} color="#eec095" />
              </View>
              <Text style={styles.anonymousLabel}>{displayName}</Text>
            </View>
          )}
          <Text style={[styles.messageText, isMine && styles.myMessageText]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={styles.timeText}>{timeString}</Text>
            {isMine && (
              <View style={styles.messageStatus}>
                <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.7)" />
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  }, [userId, lastSent, fadeAnim]);

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title="Chamber Of Secrets" />
      
      {/* Connection Status - Top Left */}
      <View style={styles.topLeftStatus}>
        <View style={styles.connectionStatusSimple}>
          <Animated.View style={[styles.connectionDot, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.dot, isConnected ? styles.connectedDot : styles.disconnectedDot]} />
          </Animated.View>
          <Text style={styles.connectionTextSimple}>
            {isConnected ? `${userRandomName}` : 'Connecting...'}
          </Text>
        </View>
        
        <View style={styles.onlineStatusSimple}>
          <Ionicons name="people" size={14} color="#eec095" />
          <Text style={styles.onlineTextSimple}>{onlineCount} online</Text>
        </View>
      </View>

      {/* Instructions Button - Top Right */}
      <View style={styles.topRightInstructions}>
        <TouchableOpacity 
          style={styles.infoButtonFloating}
          onPress={() => setShowInstructions(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle" size={24} color="#eec095" />
        </TouchableOpacity>
      </View>

      <ImageBackground source={BG_IMAGE} style={styles.bgImage} resizeMode="cover">
        <View style={styles.overlay} />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#eec095" />
              <Text style={styles.loadingText}>Entering the Chamber...</Text>
              <Text style={styles.loadingSubtext}>Where secrets are whispered in shadows</Text>
            </View>
          </View>
        ) : (
          <View style={styles.container}>
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles" size={80} color="rgba(238, 192, 149, 0.3)" />
                <Text style={styles.emptyTitle}>The Chamber Awaits</Text>
                <Text style={styles.emptySubtitle}>Be the first to share a secret...</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.chatContainer}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                removeClippedSubviews={true}
                windowSize={10}
                maxToRenderPerBatch={20}
                updateCellsBatchingPeriod={50}
                initialNumToRender={20}
                showsVerticalScrollIndicator={false}
              />
            )}
            
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <LinearGradient
                colors={['rgba(35,38,47,0.95)', 'rgba(35,38,47,0.98)']}
                style={styles.inputContainer}
              >
                <View style={styles.inputRow}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed" size={16} color="#eec095" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={input}
                      onChangeText={setInput}
                      placeholder="Share your secret anonymously..."
                      placeholderTextColor="rgba(238, 192, 149, 0.6)"
                      onSubmitEditing={sendMessage}
                      returnKeyType="send"
                      editable={isConnected}
                      multiline
                      maxLength={500}
                    />
                  </View>
                  <TouchableOpacity 
                    style={[styles.sendButton, !isConnected && styles.sendButtonDisabled]} 
                    onPress={sendMessage} 
                    activeOpacity={0.8}
                    disabled={!isConnected || !input.trim()}
                  >
                    <LinearGradient
                      colors={isConnected && input.trim() ? ['#e18e41', '#de822c'] : ['#666', '#555']}
                      style={styles.sendButtonGradient}
                    >
                      <Ionicons name="send" size={18} color={isConnected && input.trim() ? "#fff" : "#888"} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <Text style={styles.characterCount}>{input.length}/500</Text>
              </LinearGradient>
            </KeyboardAvoidingView>
          </View>
        )}

        {/* Instructions Modal */}
        <Modal
          visible={showInstructions}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowInstructions(false)}
        >
          <BlurView intensity={50} tint="dark" style={styles.modalOverlay}>
            <View style={styles.instructionsModal}>
              <LinearGradient
                colors={['rgba(35,38,47,0.98)', 'rgba(24,26,32,0.98)']}
                style={styles.modalContent}
              >
                <View style={styles.modalHeader}>
                  <Ionicons name="help-circle" size={32} color="#eec095" />
                  <Text style={styles.modalTitle}>How It Works</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => setShowInstructions(false)}
                  >
                    <Ionicons name="close" size={24} color="#eec095" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.instructionsList}>
                  <View style={styles.instructionItem}>
                    <Ionicons name="globe" size={24} color="#4CAF50" />
                    <View style={styles.instructionText}>
                      <Text style={styles.instructionTitle}>Random Identity</Text>
                      <Text style={styles.instructionDescription}>
                        You get a unique mystical name each day for anonymous chatting
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.instructionItem}>
                    <Ionicons name="time" size={24} color="#FF9800" />
                    <View style={styles.instructionText}>
                      <Text style={styles.instructionTitle}>2-Hour Auto-Delete</Text>
                      <Text style={styles.instructionDescription}>
                        All messages automatically disappear after 2 hours for privacy
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.instructionItem}>
                    <Ionicons name="shield-checkmark" size={24} color="#2196F3" />
                    <View style={styles.instructionText}>
                      <Text style={styles.instructionTitle}>Safe & Secure</Text>
                      <Text style={styles.instructionDescription}>
                        Your real identity remains completely anonymous and protected
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.instructionItem}>
                    <Ionicons name="heart" size={24} color="#E91E63" />
                    <View style={styles.instructionText}>
                      <Text style={styles.instructionTitle}>Be Kind</Text>
                      <Text style={styles.instructionDescription}>
                        Respect others and keep the chamber a safe space for all
                      </Text>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => setShowInstructions(false)}
                >
                  <LinearGradient
                    colors={['#e18e41', '#de822c']}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Got It!</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </BlurView>
        </Modal>
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
    paddingTop: 80,
    paddingHorizontal: 0,
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(35, 38, 47, 0.8)',
  },
  loadingText: {
    color: '#eec095',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  loadingSubtext: {
    color: 'rgba(238, 192, 149, 0.7)',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#eec095',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  emptySubtitle: {
    color: 'rgba(238, 192, 149, 0.7)',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Chat Styles
  chatContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageBubble: {
    borderRadius: 18,
    padding: 16,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(222, 130, 44, 0.9)',
    borderBottomRightRadius: 6,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(35, 38, 47, 0.95)',
    borderBottomLeftRadius: 6,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  anonymousAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(238, 192, 149, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  anonymousLabel: {
    color: 'rgba(238, 192, 149, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  myMessageText: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  messageStatus: {
    marginLeft: 8,
  },
  
  // Input Styles
  inputContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 26, 32, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(238, 192, 149, 0.3)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    maxHeight: 80,
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  characterCount: {
    color: 'rgba(238, 192, 149, 0.6)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionsModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#eec095',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginLeft: -32,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(238, 192, 149, 0.1)',
  },
  instructionsList: {
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  instructionText: {
    flex: 1,
    marginLeft: 16,
  },
  instructionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  instructionDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Top Status Styles
  topLeftStatus: {
    position: 'absolute',
    top: 83,
    left: 20,
    zIndex: 4,
  },
  connectionStatusSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  connectionDot: {
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectedDot: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  disconnectedDot: {
    backgroundColor: '#FF5722',
  },
  connectionTextSimple: {
    color: '#eec095',
    fontSize: 12,
    fontWeight: '600',
  },
  onlineStatusSimple: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineTextSimple: {
    color: '#eec095',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  topRightInstructions: {
    position: 'absolute',
    top: 83,
    right: 20,
    zIndex: 4,
  },
  infoButtonFloating: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(238, 192, 149, 0.1)',
  },
});

export default ChamberOfSecrets;
