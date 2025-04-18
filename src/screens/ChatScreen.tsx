  import React, { useEffect, useState, useRef, memo } from "react";
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
    Animated,
    Keyboard,
    Pressable,
  } from "react-native";
  import { debounce } from "lodash";
  import {
    NativeStackNavigationProp,
    NativeStackScreenProps,
  } from "@react-navigation/native-stack";
  import { io } from "socket.io-client";
  import { Ionicons, Entypo } from "@expo/vector-icons";
  import api from "../utils/api";
  import { LinearGradient } from "expo-linear-gradient";
  import { useNavigation } from "@react-navigation/native";
  import LoadingScreen from "./LoadingScreen";
  import AiChatbot from "../components/AiChatbot";

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
    createdAt?: string;
    replyTo?: {
      _id: string;
      text: string;
      senderId: string;
    };
  };

  type Props = NativeStackScreenProps<any, "Chat">;

  const socket = io("http://192.168.193.211:3000");

  const MessageItem = memo(
    ({
      text,
      isMyMessage,
      createdAt,
      replyTo,
      onLongPress,
      loggedInUserId, // Update the prop name here
    }: {
      text: string;
      isMyMessage: boolean;
      createdAt?: string;
      replyTo?: {
        _id: string;
        text: string;
        senderId: string;
      };
      onLongPress: () => void;
      loggedInUserId: string; // Update the prop type here
    }) => {
      const formatTime = (isoDate?: string) => {
        if (!isoDate) return "";
        const date = new Date(isoDate);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        const hourFormatted = hours % 12 || 12;
        return `${hourFormatted}:${minutes.toString().padStart(2, "0")} ${ampm}`;
      };

      return (
        <Pressable
          onLongPress={onLongPress}
          style={
            isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
          }
        >
          {replyTo && (
            <View
              style={[
                styles.replyContainer,
                isMyMessage
                  ? styles.myReplyContainer
                  : styles.otherReplyContainer,
              ]}
            >
              <View style={styles.replyLine} />
              <View style={styles.replyContent}>
                <Text style={styles.replyToText}>
                  {replyTo.senderId === loggedInUserId ? "You" : "Them"}
                </Text>
                <Text style={styles.replyText}>
                  {replyTo.text}
                </Text>
              </View>
            </View>
          )}
          <View style={isMyMessage ? styles.myMessage : styles.otherMessage}>
            <Text style={styles.messageText}>{text}</Text>
            {createdAt && (
              <Text style={styles.timeText}>{formatTime(createdAt)}</Text>
            )}
          </View>
        </Pressable>
      );
    }
  );

  const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
    const { likedUserId, userName, loggedInUserId, likedUserAvatar } =
      route.params;
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    // In ChatScreen.js

    const flatListRef = useRef<FlatList<Message>>(null);

    useEffect(() => {
      let isMounted = true;

      const fetchConversation = async () => {
        try {
          const response = await api.post<{ _id: string }>(
            `/api/v1/users/chats`,
            {
              userId: loggedInUserId,
              receiverId: likedUserId,
            }
          );
          const convId = response.data._id;
          setConversationId(convId);
          socket.emit("joinConversation", convId);

          if (likedUserAvatar) {
            setProfileImage(likedUserAvatar);
          }

          if (convId) {
            const messagesResponse = await api.get<Message[]>(
              `/api/v1/users/messages/${convId}`
            );
            if (isMounted && messagesResponse.data) {
              const uniqueMessages = Array.from(
                new Map(
                  messagesResponse.data.map((msg) => [msg._id, msg])
                ).values()
              );
              setMessages(uniqueMessages);
            }
          }
        } catch (error) {
          console.error("❌ Error fetching conversation:", error);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchConversation();

      return () => {
        isMounted = false;
        socket.off("newMessage");
      };
    }, [likedUserId, loggedInUserId]);

    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        "keyboardDidShow",
        () => {
          setKeyboardVisible(true);
        }
      );
      const keyboardDidHideListener = Keyboard.addListener(
        "keyboardDidHide",
        () => {
          setKeyboardVisible(false);
          if (conversationId) {
            socket.emit("stopTyping", {
              convId: conversationId,
              senderId: loggedInUserId,
            });
          }
        }
      );

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }, [conversationId]);

    const EmptyChatState = ({ userName }: { userName: string }) => (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          paddingTop: "60%",
        }}
      >
        <Text style={styles.emptyTitle}>
          Start chatting with {userName.split(" ")[0]}
        </Text>
        <Text style={styles.emptySubtitle}>
          Send your first message to begin your conversation
        </Text>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={60}
          color={"white"}
          style={{ opacity: 0.5 }}
        />
        <Text style={styles.aiForTips}>Check out Cupid Ai for tips</Text>
      </View>
    );

    useEffect(() => {
      const handleNewMessage = (newMessage: Message) => {
        if (newMessage.senderId === loggedInUserId) {
          return;
        }

        setMessages((prevMessages) => {
          if (prevMessages.some((msg) => msg._id === newMessage._id))
            return prevMessages;
          return [...prevMessages, newMessage];
        });

        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        );
      };

      socket.on("newMessage", handleNewMessage);

      return () => {
        socket.off("newMessage", handleNewMessage);
      };
    }, [conversationId, loggedInUserId]);

    useEffect(() => {
      if (messages.length > 0) {
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: false }),
          200
        );
      }
    }, [messages.length]);

    const handleMessageLongPress = (message: Message) => {
      setReplyingTo(message);
    };

    const cancelReply = () => {
      setReplyingTo(null);
    };

    const sendMessage = async () => {
      if (!message.trim() || !conversationId) return;

      socket.emit("stopTyping", {
        convId: conversationId,
        senderId: loggedInUserId,
      });

      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const tempMessage: Message = {
        _id: tempId,
        text: message,
        senderId: loggedInUserId,
        createdAt: new Date().toISOString(),
        replyTo: replyingTo
          ? {
              _id: replyingTo._id,
              text: replyingTo.text,
              senderId: replyingTo.senderId,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, tempMessage]);
      setMessage("");
      setReplyingTo(null);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      try {
        const response = await api.post<Message>(
          `/api/v1/users/messages`,
          {
            message,
            conversationId,
            senderId: loggedInUserId,
            replyTo: replyingTo?._id,
          }
        );

        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempId
              ? {
                  ...msg,
                  _id: response.data._id,
                  text: response.data.text, // from backend
                  replyTo: response.data.replyTo, // ✅ populate replyTo again
                }
              : msg
          )
        );
        
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      }
    };

    const handleTyping = debounce(() => {
      if (conversationId) {
        socket.emit("typing", {
          convId: conversationId,
          senderId: loggedInUserId,
        });
      }
    }, 200);

    useEffect(() => {
      socket.on("typing", ({ senderId }) => {
        if (senderId === likedUserId) {
          setIsTyping(true);
        }
      });

      socket.on("stopTyping", ({ senderId }) => {
        if (senderId === likedUserId) {
          setIsTyping(false);
        }
      });

      return () => {
        socket.off("typing");
        socket.off("stopTyping");
      };
    }, []);

    const handleOptionPress = async (option: string) => {
      setMenuVisible(false);

      switch (option) {
        case "delete":
          Alert.alert(
            "Delete All Chats",
            "Are you sure you want to delete all chats?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  if (!conversationId) return;

                  try {
                    await api.delete(
                      `/api/v1/users/deleteAllMessages/${conversationId}`
                    );
                    setMessages([]);
                    Alert.alert("Deleted", "All chats have been deleted.");
                  } catch (err) {
                    console.error("Error deleting chats:", err);
                    Alert.alert("Error", "Failed to delete chats.");
                  }
                },
              },
            ]
          );
          break;

        case "mute":
          Alert.alert(
            "Mute Notifications",
            "You will not receive notifications for this chat.",
            [{ text: "OK" }]
          );
          break;

        case "block":
          Alert.alert("Block User", "This user has been blocked.", [
            { text: "OK" },
          ]);
          break;
      }
    };

    const TypingIndicator = () => {
      const dotAnimations = useRef(
        [0, 1, 2].map(() => new Animated.Value(0))
      ).current;

      useEffect(() => {
        const animateDots = () => {
          const animations = dotAnimations.map((anim, index) => {
            return Animated.loop(
              Animated.sequence([
                Animated.delay(index * 200),
                Animated.timing(anim, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(anim, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ])
            );
          });

          Animated.parallel(animations).start();
        };

        animateDots();

        return () => {
          dotAnimations.forEach((anim) => anim.stopAnimation());
        };
      }, []);

      return (
        <View style={styles.typingContainer}>
          <View style={styles.typingContent}>
            {dotAnimations.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.typingDot,
                  {
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -6],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </View>
      );
    };

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.topBar}>
          <View style={styles.leftSection}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={"white"} />
            </TouchableOpacity>

            <View style={styles.userInfo}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("OtherProfile", {
                    userId: likedUserId,
                  })
                }
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {userName[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.chatHeader}>{userName.split(" ")[0]}</Text>
            </View>
          </View>

          <View style={styles.iconGroup}>
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Phone Call", "Call feature not implemented yet.")
              }
            >
              <Ionicons
                name="call-outline"
                size={24}
                color="white"
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Entypo
                name="dots-three-vertical"
                size={20}
                color="white"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.container}>
          {loading ? (
            <LoadingScreen description="Cupid's syncing your chats... 🏹" />
          ) : (
            <>
              <FlatList
                showsVerticalScrollIndicator={false}
                ref={flatListRef}
                data={messages}
                renderItem={({ item }) => (
                  <MessageItem
                    text={item.text}
                    isMyMessage={item.senderId === loggedInUserId}
                    createdAt={item.createdAt}
                    replyTo={item.replyTo}
                    onLongPress={() => handleMessageLongPress(item)}
                    loggedInUserId={loggedInUserId} // Pass the loggedInUserId prop
                  />
                )}
                keyExtractor={(item) => item._id}
                ListEmptyComponent={<EmptyChatState userName={userName} />}
                ListFooterComponent={isTyping ? <TypingIndicator /> : null}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: false })
                }
                onLayout={() => {
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  }, 100);
                }}
              />
            </>
          )}

{replyingTo && (
  <View style={styles.replyPreviewContainer}>
    <View style={styles.replyPreviewContent}>
      <Text style={styles.replyPreviewText}>
        Replying to{" "}
        {replyingTo.senderId === loggedInUserId ? "yourself" : userName.split(" ")[0]}
      </Text>
      <Text style={styles.replyPreviewMessage}>
        {replyingTo.text}
      </Text>
    </View>
    <TouchableOpacity
      onPress={cancelReply}
      style={styles.cancelReplyButton}
    >
      <Ionicons name="close" size={20} color="white" />
    </TouchableOpacity>
  </View>
)}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                handleTyping();
              }}
              onBlur={() => {
                if (conversationId) {
                  socket.emit("stopTyping", {
                    convId: conversationId,
                    senderId: loggedInUserId,
                  });
                }
              }}
              placeholder="Type a message..."
              placeholderTextColor="#B0B0B0"
            />
            <AiChatbot messages={messages} loggedInUserId={loggedInUserId} />
            <TouchableOpacity onPress={sendMessage}>
              <Image
                source={require("../assets/icons/send-message.png")}
                style={styles.sendIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Modal transparent visible={menuVisible} animationType="fade">
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menu}>
              <Text
                onPress={() => handleOptionPress("delete")}
                style={styles.menuItem}
              >
                Delete All Chats
              </Text>
              <Text
                onPress={() => handleOptionPress("mute")}
                style={styles.menuItem}
              >
                Mute Notifications
              </Text>
              <Text
                onPress={() => handleOptionPress("block")}
                style={styles.menuItem}
              >
                Block User
              </Text>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    );
  };

  const styles = StyleSheet.create({
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 15,
      height: 60,
      backgroundColor: "black",
      elevation: 3,
      shadowColor: "black",
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
    },
    chatHeader: {
      fontSize: 18,
      fontWeight: "bold",
      color: "white",
      marginLeft: 10,
    },
    typingContainer: {
      alignSelf: "flex-start",
      backgroundColor: "#242424",
      padding: 10,
      marginVertical: 5,
      marginLeft: 15,
      borderRadius: 14,
      maxWidth: "80%",
      elevation: 2,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: "white",
      marginBottom: 10,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 16,
      color: "#e0e0e0",
      marginBottom: 20,
      textAlign: "center",
    },
    aiForTips: {
      fontSize: 14,
      color: "#de822c",
      marginTop: 20,
    },
    typingContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 20,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "white",
      marginHorizontal: 2,
    },
    iconGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    leftSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    container: {
      flex: 1,
      backgroundColor: "black",
      paddingHorizontal: 1,
      paddingBottom: 0,
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderTopWidth: 1,
      borderColor: "#de822c",
      paddingVertical: 10,
      backgroundColor: "black",
      width: "100%",
      marginTop: 10,
    },
    input: {
      flex: 1,
      color: "white",
      backgroundColor: "black",
      paddingHorizontal: 15,
      borderRadius: 10,
      marginRight: 10,
      paddingVertical: 10,
    },
    timeText: {
      fontSize: 10,
      color: "#A0A0A0",
      alignSelf: "flex-end",
      marginTop: 2,
    },
    myMessageContainer: {
      alignSelf: "flex-end",
      marginRight: 15,
      marginVertical: 5,
      maxWidth: "80%",
    },
    otherMessageContainer: {
      alignSelf: "flex-start",
      marginLeft: 15,
      marginVertical: 5,
      maxWidth: "80%",
    },
    myMessage: {
      backgroundColor: "#de822c",
      padding: 10,
      borderRadius: 20,
      elevation: 3,
      paddingHorizontal: 15,
    },
    otherMessage: {
      backgroundColor: "#242424",
      padding: 10,
      borderRadius: 20,
      elevation: 2,
      paddingHorizontal: 15,
    },
    messageText: {
      color: "white",
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
      backgroundColor: "#de822c",
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      color: "black",
      fontWeight: "bold",
    },
    sendIcon: {
      width: 25,
      height: 25,
      tintColor: "#de822c",
      marginRight: 10,
    },
    icon: {
      marginLeft: 15,
    },
    modalBackground: {
      flex: 1,
      backgroundColor: "#000000aa",
      justifyContent: "flex-end",
    },
    menu: {
      backgroundColor: "#1E1E1E",
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    menuItem: {
      color: "white",
      fontSize: 16,
      paddingVertical: 10,
    },
    // New styles for reply functionality
    replyContainer: {
      flexDirection: "row",
      marginBottom: 4,
      paddingLeft: 8,
      borderRadius: 14,
      overflow: "hidden",
    },
    myReplyContainer: {
      backgroundColor: "rgba(93, 227, 131, 0.2)",
    },
    otherReplyContainer: {
      backgroundColor: "rgba(36, 36, 36, 0.5)",
    },
    replyLine: {
      width: 0,
      backgroundColor: "#de822c",
      marginRight: 6,
    },
    replyContent: {
      flex: 1,
      paddingVertical: 4,
    },
    replyToText: {
      color: "#de822c",
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: 2,
    },
    replyText: {
      color: "rgba(255, 255, 255, 0.7)",
      fontSize: 12,
    },
    replyPreviewContainer: {
      flexDirection: 'row',
      backgroundColor: '#242424',
      padding: 10,
      marginHorizontal: 15,
      borderRadius: 12,
      marginBottom: 8,
      alignItems: 'flex-start', // Align items to top
    },
    replyPreviewContent: {
      flex: 1, // Takes remaining space
      marginRight: 8,
    },
    replyPreviewText: {
      color: '#de822c',
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    replyPreviewMessage: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 14,
      flexWrap: 'wrap', // Allows text to wrap
    },
    cancelReplyButton: {
      padding: 4,
      marginTop: 4, // Align close button with text
    },
    
  });

  export default ChatScreen;
