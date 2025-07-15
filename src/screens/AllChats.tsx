import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl, // ✅ Import RefreshControl
} from "react-native";
import moment from "moment";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../utils/api";
import { getUserId } from "../utils/constants";
import { io } from "socket.io-client";
import LoadingScreen from "./LoadingScreen";
import { useFocusEffect } from "@react-navigation/native";

const socket = io("http://10.21.36.128:3000");

type Props = NativeStackScreenProps<any, "AllChatScreen">;

interface Participant {
  _id: string;
  fullName: string;
  avatar1: string;
}

interface Chat {
  _id: string;
  participants: Participant[];
  lastMessage?: {
    message: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
  };
  otherParticipant?: Participant;
}

const ChatsScreen: React.FC<Props> = ({ navigation }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false); // ✅ Refreshing state
  const [userId, setUserId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchBlockedUsers(); // Always refresh when screen gains focus
      return () => {}; // Cleanup if needed
    }, [])
  );

  useEffect(() => {
    const startPolling = () => {
      const interval = setInterval(() => {
        fetchChats(true); // mark as silent refresh
      }, 10000); // every 10 seconds
      return () => clearInterval(interval);
    };

    const cleanup = startPolling();
    return () => cleanup();
  }, []);

  // ✅ Fetch userId and chats
  const fetchChats = async (silent = false) => {
    try {
      const id = await getUserId();
      setUserId(id);

      const response = await api.get(`/api/v1/users/chats/${id}`);
      setChats(response.data);
      setIsOffline(false); // ✅ we're online

      await AsyncStorage.setItem("chats", JSON.stringify(response.data));
    } catch (error) {
      console.error("Fetch error:", error);

      const cached = await AsyncStorage.getItem("chats");
      if (cached) {
        setChats(JSON.parse(cached));
        setIsOffline(true); // ✅ offline mode active
      } else {
        setChats([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await api.get("/api/v1/users/blockedusers");
      setBlockedUsers(response.data.map((user: { _id: string }) => user._id)); // just extract IDs
    } catch (err) {
      console.error("Error fetching blocked users:", err);
    }
  };

  useEffect(() => {
    fetchChats();
    fetchBlockedUsers(); // Fetch blocked users on mount
    if (userId) {
      socket.emit("join", userId); // Join the chat room based on userId

      socket.on("newMessage", (newMessage) => {
        setChats((prevChats) => {
          return prevChats.map((chat) =>
            chat._id === newMessage.conversationId
              ? {
                  ...chat,
                  lastMessage: {
                    message: newMessage.message,
                    senderId: newMessage.senderId,
                    createdAt: newMessage.createdAt,
                    isRead: false,
                  },
                  updatedAt: newMessage.createdAt,
                }
              : chat
          );
        });
      });
    }

    return () => {
      socket.off("newMessage");
    };
  }, [userId]);

  if (loading) {
    return <LoadingScreen description="Fetching your chats" />;
  }

  // ✅ Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
  };

  const onChatPress = async (
    otherUserId: string,
    otherUserName: string,
    avatar: string
  ) => {
    try {
      const response = await api.get(`/api/v1/users/is-blocked/${otherUserId}`);
      const { isBlockedByMe, hasBlockedMe } = response.data;

      if (hasBlockedMe) {
        Alert.alert("Access Denied", "You cannot view this user's profile.");
        return;
      }

      navigation.navigate("Chat", {
        likedUserId: otherUserId,
        userName: otherUserName,
        loggedInUserId: userId,
        likedUserAvatar: avatar,
        isBlockedByMe,
      });
    } catch (err) {
      console.error("Error checking block status", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  // ✅ Render each chat item
  const renderChatItem = ({ item }: { item: Chat }) => {
    if (!userId) return null;

    const otherParticipant =
      item?.otherParticipant ||
      item?.participants?.find((p) => p._id !== userId);
    if (!otherParticipant) {
      console.warn("Invalid chat data: No participants available", item);
      return null;
    }

    const isBlocked = blockedUsers.includes(otherParticipant._id);

    const lastMessage = item?.lastMessage;
    const lastMessageText = isBlocked
      ? "You have blocked this user"
      : lastMessage?.senderId
      ? lastMessage.senderId === userId
        ? `You: ${lastMessage.message}`
        : `${lastMessage.message}`
      : "No messages yet";

    const formattedTime = lastMessage?.createdAt
      ? moment(lastMessage.createdAt).format("hh:mm A")
      : "";

    return (
      <TouchableOpacity
        style={[styles.chatItem, isBlocked && { opacity: 0.4 }]} // grey out
        onPress={() =>
          isBlocked
            ? Alert.alert("Blocked", "You have blocked this user.")
            : navigation.navigate("Chat", {
                likedUserId: otherParticipant._id,
                userName: otherParticipant.fullName,
                loggedInUserId: userId,
                likedUserAvatar: otherParticipant.avatar1,
                isBlockedByMe: true, // optional if you want to pass this flag to ChatScreen
              })
        }
      >
        <Image
          source={{
            uri: otherParticipant?.avatar1 || "https://via.placeholder.com/150",
          }}
          style={styles.chatAvatar}
        />
        <View style={styles.chatDetails}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.chatName}>{otherParticipant?.fullName}</Text>
            {!isBlocked && <Text style={styles.chatTime}>{formattedTime}</Text>}
          </View>
          <Text
            style={[
              styles.lastMessage,
              isBlocked && { color: "#888", fontStyle: "italic" },
              lastMessage?.isRead === false && lastMessage.senderId !== userId
                ? styles.unreadMessage
                : {},
            ]}
            numberOfLines={1}
          >
            {lastMessageText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headingContainer}>
        <Text style={styles.headingText}>Chats</Text>
        {isOffline && <Text style={styles.noInternetBadge}>No Internet</Text>}
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={renderChatItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#de822c"]}
          />
        }
        contentContainerStyle={[
          chats.length === 0 && { flex: 1, justifyContent: "center" },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Image
              source={require("../assets/icons/koala.png")}
              style={{ width: 150, height: 150, marginBottom: 20 }}
            />
            <Text style={styles.noChatsText}>
              No DMs? Clearly, they fear the power of the perfect reply
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 20,
  },
  headingText: {
    marginLeft: 2,
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  chatTime: {
    color: "#B0B0B0",
    fontSize: 12,
    marginLeft: 10,
  },
  emptyStateContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
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
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  lastMessage: {
    color: "#B0B0B0",
    fontSize: 12,
  },
  unreadMessage: {
    color: "#de822c",
    fontWeight: "bold",
  },
  noChatsText: {
    color: "#B0B0B0",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 90,
  },
  backButton: {
    color: "#de822c",
  },
  headingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },

  noInternetBadge: {
    backgroundColor: "#ff4d4d",
    color: "white",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
    overflow: "hidden",
    fontWeight: "600",
  },
});

export default ChatsScreen;
