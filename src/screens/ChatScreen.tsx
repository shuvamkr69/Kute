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
import CustomAlert from "../components/CustomAlert";

type RootStackParamList = {
  Chat: {
    likedUserId: string;
    userName: string;
    loggedInUserId: string;
    likedUserAvatar?: string;
    isBlockedByMe ?: boolean;
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
  isRead?: boolean; // <-- add this
};

type Props = NativeStackScreenProps<any, "Chat">;

const socket = io("http://10.21.36.128:3000");

const MessageItem = memo(
  (props: {
    text: string;
    isMyMessage: boolean;
    createdAt?: string;
    replyTo?: {
      _id: string;
      text: string;
      senderId: string;
    };
    onLongPress: () => void;
    onPress: () => void;
    onReply: () => void; // ✅ Add this
    loggedInUserId: string;
    isSelected: boolean;
    isLastMyMessage: boolean; // <-- new prop
    isRead: boolean | undefined; // <-- new prop
    otherUserAvatar?: string; // <-- new prop
    style?: any;
    selectionMode: boolean;
  }) => {
    const {
      text,
      isMyMessage,
      createdAt,
      replyTo,
      onLongPress,
      onPress,
      loggedInUserId,
      isSelected,
      onReply, // ✅
      isLastMyMessage, // <-- new
      isRead, // <-- new
      otherUserAvatar, // <-- new
      style,
      selectionMode,
    } = props;

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
      <View style={{ position: 'relative' }}>
        {isSelected && <View style={styles.selectedMessageOverlay} />}
        <Pressable
          onLongPress={() => {
            if (!selectionMode) {
              onLongPress();
            }
          }}
          onPress={() => {
            if (selectionMode) {
              onPress();
            }
          }}
          delayLongPress={selectionMode ? undefined : 150}
          style={[
            isMyMessage
              ? styles.myMessageContainer
              : styles.otherMessageContainer,
            style,
          ]}
        >
          {!isSelected && (
            <TouchableOpacity
              onPress={onReply}
              style={[
                styles.replyButton,
                isMyMessage ? { right: -25 } : { left: -25 },
              ]}
            >
              <Ionicons
                name="return-up-back-outline"
                size={20}
                color={isMyMessage ? "#fff" : "#de822c"}
                style={{
                  transform: isMyMessage ? [] : [{ scaleX: -1 }], // ✅ Flip horizontally
                }}
              />
            </TouchableOpacity>
          )}

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
                <Text style={styles.replyText}>{replyTo.text}</Text>
              </View>
            </View>
          )}

          <View style={isMyMessage ? styles.myMessage : styles.otherMessage}>
            <Text style={styles.messageText}>{text}</Text>
            {createdAt && (
              <Text style={styles.timeText}>{formatTime(createdAt)}</Text>
            )}
          </View>
          {/* Move Seen indicator below the bubble */}
          {isMyMessage && isLastMyMessage && isRead && (
            <Text style={styles.seenTextBelow}>Seen</Text>
          )}
        </Pressable>
      </View>
    );
  }
);

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { likedUserId, userName, loggedInUserId, likedUserAvatar } = route.params;
  const [isBlockedByMe, setIsBlockedByMe] = useState<boolean>(false);


  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set()
  );
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });
  const [searchText, setSearchText] = useState("");
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [searchResultsModalVisible, setSearchResultsModalVisible] = useState(false);
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);
  const menuAnim = useRef(new Animated.Value(400)).current; // Start off-screen right
  useEffect(() => {
    if (menuVisible) {
      menuAnim.setValue(400);
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(menuAnim, {
        toValue: 400,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [menuVisible]);


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
    //check for realtime deleted for everyone messages
    socket.on("messageDeleted", ({ messageIds }) => {
      console.log("Messages deleted:", messageIds);
      setMessages((prev) =>
        prev.filter((msg) => !messageIds.includes(msg._id))
      );
    });

    return () => {
      socket.off("messageDeleted");
    };
  }, []);

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

  useEffect(() => {
    // Emit messageRead when chat is opened or new messages arrive
    if (conversationId && messages.length > 0) {
      // Find the last message not sent by the current user and not read
      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== loggedInUserId && !msg.isRead
      );
      if (unreadMessages.length > 0) {
        socket.emit("messageRead", {
          conversationId,
          receiverId: loggedInUserId,
        });
      }
    }
  }, [conversationId, messages.length, loggedInUserId]);

  useEffect(() => {
    // Listen for messageRead event from socket
    const handleMessageRead = ({ conversationId: seenConvId, seenBy }) => {
      if (conversationId !== seenConvId) return;
      setMessages((prevMessages) =>
        prevMessages.map((msg, idx, arr) => {
          // Mark all messages from the other user as read
          if (msg.senderId !== loggedInUserId && !msg.isRead) {
            return { ...msg, isRead: true };
          }
          // Optionally, mark the last message as read for the sender
          if (
            msg.senderId === loggedInUserId &&
            idx === arr.length - 1 &&
            arr[idx].isRead !== true
          ) {
            return { ...msg, isRead: true };
          }
          return msg;
        })
      );
    };
    socket.on("messageRead", handleMessageRead);
    return () => {
      socket.off("messageRead", handleMessageRead);
    };
  }, [conversationId, loggedInUserId]);

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
      const response = await api.post<Message>(`/api/v1/users/messages`, {
        message,
        conversationId,
        senderId: loggedInUserId,
        replyTo: replyingTo?._id,
      });

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

    await api.post("/api/v1/users/block", {
  blockedUserId: likedUserId,
});
setIsBlockedByMe(true); // ⬅️ Update state here
setCustomAlert({ visible: true, title: "Blocked", message: "This user has been blocked." });
navigation.goBack();


    switch (option) {
      case "delete":
        setCustomAlert({ visible: true, title: "Delete All Chats", message: "All chats will only be deleted for you. The other user will still be able to view your conversations." });
        break;

      case "mute":
        setCustomAlert({ visible: true, title: "Mute Notifications", message: "You will not receive notifications for this chat." });
        break;

      case "block":
        setCustomAlert({ visible: true, title: "Block User", message: "Are you sure you want to block this user? You will no longer see their messages." });
        break;
    }
  };

  const handleLongPress = (messageId: string) => {
    setSelectionMode(true);
    setSelectedMessages((prev) => new Set(prev).add(messageId));
  };

  const handlePress = (messageId: string) => {
    if (selectionMode) {
      setSelectedMessages((prev) => {
        const updated = new Set(prev);
        if (updated.has(messageId)) {
          updated.delete(messageId);
          if (updated.size === 0) {
            setSelectionMode(false);
          }
        } else {
          updated.add(messageId);
        }
        return updated;
      });
    }
  };

  const confirmDelete = () => {
    const hasOwnMessages = Array.from(selectedMessages).some((id) => {
      const msg = messages.find((m) => m._id === id);
      return msg?.senderId === loggedInUserId;
    });

    const hasOthersMessages = Array.from(selectedMessages).some((id) => {
      const msg = messages.find((m) => m._id === id);
      return msg?.senderId !== loggedInUserId;
    });

    const options: Array<any> = [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => setSelectedMessages(new Set()),
      },
      {
        text: "Delete for Me",
        onPress: deleteForMe,
      },
    ];

    if (hasOwnMessages && !hasOthersMessages) {
      options.push({
        text: "Delete for Everyone",
        style: "destructive",
        onPress: deleteForEveryone,
      });
    }

    setCustomAlert({ visible: true, title: "Delete Message", message: hasOthersMessages && !hasOwnMessages ? "You can only delete these messages for yourself." : "Do you want to delete for yourself or everyone?" });
  };

  const deleteForMe = async () => {
    try {
      await api.post("/api/v1/users/messages/delete-for-me", {
        messageIds: Array.from(selectedMessages),
      });
      setMessages((prev) =>
        prev.filter((msg) => !selectedMessages.has(msg._id))
      );
    } catch (err) {
      console.error(err);
      setCustomAlert({ visible: true, title: "Error", message: "Failed to delete message." });
    } finally {
      setSelectedMessages(new Set());
      setSelectionMode(false);
    }
  };

  const deleteForEveryone = async () => {
    try {
      await api.post("/api/v1/users/messages/delete-for-everyone", {
        messageIds: Array.from(selectedMessages),
        conversationId: conversationId, // ✅ Add this
      });
      setMessages((prev) =>
        prev.filter((msg) => !selectedMessages.has(msg._id))
      );
    } catch (err) {
      console.error(err);
      setCustomAlert({ visible: true, title: "Error", message: "Failed to delete message." });
    } finally {
      setSelectedMessages(new Set());
      setSelectionMode(false);
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

  // Filter messages based on searchText
  const filteredMessages = searchBarVisible && searchText.trim().length > 0
    ? messages.filter((msg) => msg.text.toLowerCase().includes(searchText.toLowerCase()))
    : messages;

  // Scroll to first search result
  useEffect(() => {
    if (searchBarVisible && searchText.trim().length > 0 && filteredMessages.length > 0) {
      const firstIndex = messages.findIndex((msg) => msg.text.toLowerCase().includes(searchText.toLowerCase()));
      if (firstIndex !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: firstIndex, animated: true });
      }
    }
  }, [searchText, searchBarVisible]);

  // Show scroll-to-bottom button logic
  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    // Show button if user is more than 100px away from the bottom
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    setShowScrollToBottom(contentSize.height - (layoutMeasurement.height + contentOffset.y) > 100);
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      // Try scrollToEnd first
      flatListRef.current.scrollToEnd({ animated: true });
      // Fallback: ensure scroll to last index after a short delay
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({ index: messages.length - 1, animated: true });
        } catch (e) {
          // ignore out of range
        }
      }, 100);
    }
  };

  // Replace onPress for closing the menu with a function that animates out first
  const closeMenuWithAnimation = () => {
    Animated.timing(menuAnim, {
      toValue: 400,
      duration: 350,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  // Show search results modal when searching
  const matchingMessages = searchSubmitted && searchText.trim().length > 0
    ? messages.filter((msg) => msg.text.toLowerCase().includes(searchText.toLowerCase()))
    : [];

  // Handler to jump to a message
  const jumpToMessage = (msgId: string) => {
    const idx = messages.findIndex((msg) => msg._id === msgId);
    if (idx !== -1 && flatListRef.current) {
      setSearchResultsModalVisible(false);
      setSearchBarVisible(false);
      setSearchText("");
      setSearchSubmitted(false);
      setTimeout(() => {
        // Only scroll if index is valid for the FlatList data
        if (idx < messages.length) {
          try {
            flatListRef.current.scrollToIndex({ index: idx, animated: true });
          } catch (e) {
            // fallback: scroll to end
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }
      }, 350); // Wait for modal to close and FlatList to re-render
    }
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
              activeOpacity={1}
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
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("OtherProfile", {
                  userId: likedUserId,
                })
              }
              activeOpacity={1}
            >
              <Text style={styles.chatBackButton}>
                {userName.split(" ")[0]}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.iconGroup}>
          {selectionMode ? (
            <>
              {/* Reply button when only one message is selected */}
              {selectedMessages.size === 1 && (
                <TouchableOpacity
                  onPress={() => {
                    const selectedId = Array.from(selectedMessages)[0];
                    const msg = messages.find((m) => m._id === selectedId);
                    if (msg) {
                      setReplyingTo(msg);
                    }
                    setSelectedMessages(new Set());
                    setSelectionMode(false);
                  }}
                  style={{ marginRight: 2 }}
                >
                  <Ionicons name="return-up-back-outline" size={22} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={confirmDelete}>
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color="white"
                  style={{ marginLeft: 2, marginRight: 2 }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSelectedMessages(new Set());
                  setSelectionMode(false);
                }}
              >
                <Ionicons
                  name="close-outline"
                  size={22}
                  color="white"
                  style={{ marginLeft: 2 }}
                />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("CallScreen", {
                    conversationId,
                    loggedInUserId,
                    likedUserId,
                    userName,
                  });
                }}
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
            </>
          )}
        </View>
      </View>

      <View style={styles.container}>
        {loading ? (
          <LoadingScreen description="Cupid's syncing your chats... 🏹" />
        ) : (
          <>
            {/* Search Bar */}
            {/* Search Bar Overlay */}
            {searchBarVisible && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Search messages..."
                  placeholderTextColor="#B0B0B0"
                  value={searchText}
                  onChangeText={setSearchText}
                  returnKeyType="search"
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => {
                    setSearchResultsModalVisible(true);
                    setSearchSubmitted(true);
                  }}
                  style={{ marginLeft: 6, marginRight: 2 }}
                >
                  <Ionicons name="search" size={24} color="#de822c" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setSearchBarVisible(false); setSearchText(""); setSearchSubmitted(false); }}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            {/* Search Results Modal */}
            <Modal
              visible={searchResultsModalVisible && searchBarVisible && searchSubmitted && searchText.trim().length > 0}
              transparent
              animationType="fade"
              onRequestClose={() => setSearchResultsModalVisible(false)}
            >
              <View style={styles.searchResultsModalBg}>
                <View style={styles.searchResultsModalCard}>
                  <Text style={styles.searchResultsTitle}>Search Results</Text>
                  <FlatList
                    data={matchingMessages}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.searchResultItem}
                        onPress={() => jumpToMessage(item._id)}
                      >
                        <Text style={styles.searchResultText}>{item.text}</Text>
                        <Text style={styles.searchResultTime}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.searchResultEmpty}>No results found.</Text>}
                    style={{ maxHeight: 350 }}
                  />
                  <TouchableOpacity style={styles.searchResultsCloseBtn} onPress={() => setSearchResultsModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            {/* Messages List */}
            <FlatList
              showsVerticalScrollIndicator={false}
              ref={flatListRef}
              data={filteredMessages}
              renderItem={({ item, index }) => (
                <MessageItem
                  text={item.text}
                  isMyMessage={item.senderId === loggedInUserId}
                  createdAt={item.createdAt}
                  replyTo={item.replyTo}
                  loggedInUserId={loggedInUserId} // Pass the loggedInUserId prop
                  onLongPress={() => handleLongPress(item._id)}
                  onPress={() => handlePress(item._id)}
                  isSelected={selectedMessages.has(item._id)}
                  onReply={() => setReplyingTo(item)} // ✅ For reply
                  isLastMyMessage={item.senderId === loggedInUserId && item._id === messages[messages.length - 1]?._id}
                  isRead={item.isRead ?? false}
                  otherUserAvatar={item.senderId === loggedInUserId ? profileImage : undefined}
                  style={index === 0 ? { marginTop: 24 } : undefined}
                  selectionMode={selectionMode}
                />
              )}
              keyExtractor={(item) => item._id}
              getItemLayout={(data, index) => ({ length: 70, offset: 70 * index, index })}
              ListEmptyComponent={<EmptyChatState userName={userName} />}
              ListFooterComponent={isBlockedByMe ? null : isTyping ? <TypingIndicator /> : null}
              initialScrollIndex={messages.length > 0 ? messages.length - 1 : 0}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />
            {/* Scroll to Bottom Button */}
            {showScrollToBottom && (
              <TouchableOpacity
                onPress={scrollToBottom}
                style={{
                  position: 'absolute',
                  right: 20,
                  bottom: 90,
                  backgroundColor: '#23242a',
                  borderRadius: 22,
                  padding: 10,
                  elevation: 6,
                  zIndex: 20,
                }}
              >
                <Ionicons name="arrow-down" size={20} color="#de822c" />
              </TouchableOpacity>
            )}
          </>
        )}

        {!isBlockedByMe && replyingTo && (
          <View style={styles.replyPreviewContainer}>
            <View style={styles.replyPreviewContent}>
              <Text style={styles.replyPreviewText}>
                Replying to{" "}
                {replyingTo.senderId === loggedInUserId
                  ? "yourself"
                  : userName.split(" ")[0]}
              </Text>
              <Text style={styles.replyPreviewMessage}>{replyingTo.text}</Text>
            </View>
            <TouchableOpacity
              onPress={cancelReply}
              style={styles.cancelReplyButton}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {isBlockedByMe ? (
  <TouchableOpacity
    style={[
      styles.inputContainer,
      { backgroundColor: "#1c1c1c", opacity: 0.5 },
    ]}
    onPress={() =>
      setCustomAlert({ visible: true, title: "Blocked", message: "Unblock this user to send messages." })
    }
    activeOpacity={1}
  >
    <Text style={{ color: "#888", marginLeft: 16 }}>
      You have blocked this user
    </Text>
  </TouchableOpacity>
) : (
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
    <TouchableOpacity onPress={sendMessage} style={{ marginLeft: 18 }}>
      <Image
        source={require("../assets/icons/send-message.png")}
        style={styles.sendIcon}
      />
    </TouchableOpacity>
  </View>
)}

      </View>

      <Modal transparent visible={menuVisible} animationType="none">
        <TouchableOpacity
          style={[styles.modalBackground, { justifyContent: 'center', alignItems: 'flex-end' }]}
          activeOpacity={1}
          onPress={closeMenuWithAnimation}
        >
          <Animated.View style={[styles.menuCard, { transform: [{ translateX: menuAnim }] }]}>
            <View style={{ justifyContent: 'center' }}>
              <TouchableOpacity
                style={styles.menuItemRow}
                activeOpacity={0.7}
                onPress={() => handleOptionPress("mute")}
              >
                <Ionicons name="notifications-off-outline" size={20} color="#de822c" style={{ marginRight: 14 }} />
                <Text style={styles.menuItemText}>Mute Notifications</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItemRow}
                activeOpacity={0.7}
                onPress={() => handleOptionPress("block")}
              >
                <Ionicons name="remove-circle-outline" size={20} color="#de822c" style={{ marginRight: 14 }} />
                <Text style={styles.menuItemText}>Block User</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItemRow}
                activeOpacity={0.7}
                onPress={() => {
                 closeMenuWithAnimation();
                  setSearchBarVisible(true);
                }}
              >
                <Ionicons name="search" size={20} color="#de822c" style={{ marginRight: 14 }} />
                <Text style={styles.menuItemText}>Search</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={[styles.menuItemRow, { marginBottom: 0 }]}
                activeOpacity={0.7}
                onPress={() => handleOptionPress("delete")}
              >
                <Ionicons name="trash-outline" size={20} color="#ff4d4f" style={{ marginRight: 14 }} />
                <Text style={[styles.menuItemText, { color: '#ff4d4f' }]}>Delete All Chats</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      />
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
  chatBackButton: {
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
  selectedMessageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(222, 130, 44, 0.25)", // Orange with low opacity
    zIndex: 0, // Keep it behind the message bubble
  },
  replyButton: {
    position: "absolute",
    top: 5,
    paddingVertical: 5,
    paddingHorizontal: 12,
    zIndex: 5,
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
    justifyContent: "center",
    alignItems: "center",
  },
  menuCard: {
    backgroundColor: '#181A20',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginRight: 0,
    marginLeft: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
    width: '80%',
    maxWidth: 400,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 2,
  },
  menuItemText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#23242a',
    marginHorizontal: 18,
    opacity: 0.18,
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
    flexDirection: "row",
    backgroundColor: "#242424",
    padding: 10,
    marginHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: "flex-start", // Align items to top
  },
  replyPreviewContent: {
    flex: 1, // Takes remaining space
    marginRight: 8,
  },
  replyPreviewText: {
    color: "#de822c",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  replyPreviewMessage: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    flexWrap: "wrap", // Allows text to wrap
  },
  cancelReplyButton: {
    padding: 4,
    marginTop: 4, // Align close button with text
  },
  readAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 1,
    borderColor: '#fff',
  },
  readCheck: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  searchResultsModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  searchResultsModalCard: {
    backgroundColor: '#181A20',
    borderRadius: 18,
    padding: 18,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  searchResultsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  searchResultItem: {
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#23242a',
    paddingHorizontal: 4,
  },
  searchResultText: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 2,
  },
  searchResultTime: {
    color: '#de822c',
    fontSize: 12,
    opacity: 0.7,
  },
  searchResultEmpty: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  searchResultsCloseBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
    zIndex: 10,
  },
  seenText: {
    color: '#de2222',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 2,
    marginRight: 2,
  },
  // Add new style for below bubble
  seenTextBelow: {
    color: '#fff',
    fontSize: 11, // smaller
    fontWeight: '400', // less bold
    textAlign: 'right',
    marginTop: 2,
    marginRight: 2,
    marginBottom: 4,
  },
});

export default ChatScreen;
