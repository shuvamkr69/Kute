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
import Icon from "react-native-vector-icons/FontAwesome";
import LoadingScreen from "./LoadingScreen";

const socket = io("http://192.168.18.150:3000");

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


  useEffect(() => {
  const startPolling = () => {
    const interval = setInterval(() => {
      fetchChats(); // Call your existing fetchChats function
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval); // Cleanup
  };

  const pollingCleanup = startPolling();

  return () => {
    pollingCleanup(); // Cleanup on unmount
  };
}, []);



  // ✅ Fetch userId and chats
  const fetchChats = async () => {
    try {
      const id = await getUserId();
      setUserId(id);

      const response = await api.get(`/api/v1/users/chats/${id}`);
      setChats(response.data);

      // ✅ Cache data in AsyncStorage
      await AsyncStorage.setItem("chats", JSON.stringify(response.data));
    } catch (error) {
      console.error("Error fetching chats:", error);

      // ✅ Fallback to cached data if API fails
      const storedChats = await AsyncStorage.getItem("chats");
      if (storedChats) {
        setChats(JSON.parse(storedChats));
        Alert.alert("Offline Mode", "Showing cached chats.");
      } else {
        Alert.alert(
          "Error",
          "Unable to load chats. Please check your connection."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false); // ✅ Stop refreshing after fetch
    }
  };

  useEffect(() => {
    fetchChats();
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
    // return (
    //   <View style={styles.loaderContainer}>
    //     <ActivityIndicator size="large" color="#de822c" />
    //   </View>
    // );
  }

  // ✅ Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
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

    const lastMessage = item?.lastMessage;
    const lastMessageText = lastMessage?.senderId
      ? lastMessage.senderId === userId
        ? `You: ${lastMessage.message}`
        : `${lastMessage.message}`
      : "No messages yet";

    const formattedTime = lastMessage?.createdAt
      ? moment(lastMessage.createdAt).format("hh:mm A")
      : "";

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          navigation.navigate("Chat", {
            likedUserId: otherParticipant._id,
            userName: otherParticipant.fullName,
            loggedInUserId: userId,
            likedUserAvatar: otherParticipant.avatar1,
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
            <Text style={styles.chatTime}>{formattedTime}</Text>
          </View>
          <Text
            style={[
              styles.lastMessage,
              lastMessage?.isRead === false && lastMessage.senderId !== userId
                ? styles.unreadMessage
                : {},
            ]}
            numberOfLines={1}
          >
            {/* {lastMessageText}                        last message text (disabled for now since it doesnt have all its functionalities*/}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headingText}>Chats</Text>

      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={renderChatItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#de822c"]}/>
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
    fontSize: 16,
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
    backgroundColor: "#1E1E1E",
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
});

export default ChatsScreen;
