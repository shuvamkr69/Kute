import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../utils/api";
import BackButton from "../components/BackButton";
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from '../components/CustomAlert';

type Props = NativeStackScreenProps<any, "BlockedUsersScreen">;

interface BlockedUser {
  _id: string;
  fullName: string;
  avatar1?: string;
}

const BlockedUsersScreen: React.FC<Props> = ({ navigation }) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', onConfirm: undefined, confirmText: '', cancelText: '' });

  const fetchBlockedUsers = async () => {
    try {
      const response = await api.get("/api/v1/users/blockedusers");
      setBlockedUsers(response.data);
    } catch (err) {
      console.error("Error fetching blocked users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await api.post("/api/v1/users/unblock", { userId });
      setBlockedUsers((prev) => prev.filter((user) => user._id !== userId));
      setCustomAlert({
        visible: true,
        title: 'Unblocked',
        message: 'User has been unblocked. You can now chat with them again. Go to My Chats to start a conversation.',
        confirmText: 'My Chats',
        cancelText: 'OK',
        onConfirm: () => {
          setCustomAlert((prev) => ({ ...prev, visible: false }));
          setTimeout(() => navigation.navigate('HomeTabs', { screen: 'AllChatScreen' }), 250);
        }
      });
    } catch (err) {
      console.error("Unblock failed:", err);
      setCustomAlert({
        visible: true,
        title: 'Error',
        message: 'Could not unblock user. Please try again later.',
        confirmText: '',
        cancelText: 'OK',
        onConfirm: undefined,
      });
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View style={styles.card}>
      <Image
        source={{
          uri: item.avatar1 || "https://via.placeholder.com/150",
        }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{item.fullName.split(' ')[0]}</Text>
      <TouchableOpacity onPress={() => handleUnblock(item._id)} style={styles.unblockButton}>
        <LinearGradient
          colors={['#ff8c42', '#de822c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.unblockButtonGradient}
        >
          <Text style={styles.unblockText}>Unblock</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title="Blocked Users" />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#de822c" />
        ) : blockedUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={require("../assets/icons/sarcastic-face.png")} // 🔁 Replace with your own image path
              style={styles.emptyImage}
            />
            <Text style={styles.emptyText}>Go on, block someone right now</Text>
          </View>
        ) : (
          <FlatList
            data={blockedUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        )}
        <CustomAlert
          visible={customAlert.visible}
          title={customAlert.title}
          message={customAlert.message}
          onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
          onConfirm={customAlert.onConfirm}
          confirmText={customAlert.confirmText}
          cancelText={customAlert.cancelText || 'Cancel'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContainer: {
    flex: 1,
  },
  container: { flex: 1, backgroundColor: "black", padding: 20 },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 18,
    borderWidth: 2,
    borderColor: '#de822c',
  },
  name: {
    flex: 1,
    color: "white",
    fontSize: 17,
    fontWeight: '600',
    marginRight: 10,
  },
  unblockButton: {
    borderRadius: 30,
    overflow: 'hidden',
    minWidth: 90,
    marginLeft: 6,
    shadowColor: '#de822c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  unblockButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  unblockText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    bottom: 30,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: "contain",
  },
  emptyText: {
    fontSize: 18,
    color: "#B0B0B0",
    textAlign: "center",
  },
});

export default BlockedUsersScreen;
