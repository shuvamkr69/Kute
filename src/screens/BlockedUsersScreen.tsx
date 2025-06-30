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

type Props = NativeStackScreenProps<any, "BlockedUsersScreen">;

interface BlockedUser {
  _id: string;
  fullName: string;
  avatar1?: string;
}

const BlockedUsersScreen: React.FC<Props> = ({ navigation }) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlockedUsers = async () => {
    try {
      const response = await api.get("/api/v1/users/blockedusers");
      setBlockedUsers(response.data);
    } catch (err) {
      console.error("Error fetching blocked users:", err);
      Alert.alert("Error", "Failed to load blocked users.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await api.post("/api/v1/users/unblock", { userId });
      setBlockedUsers((prev) => prev.filter((user) => user._id !== userId));
      Alert.alert("Unblocked", "User has been unblocked.");
    } catch (err) {
      console.error("Unblock failed:", err);
      Alert.alert("Error", "Could not unblock user.");
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
      <Text style={styles.name}>{item.fullName}</Text>
      <TouchableOpacity
        onPress={() => handleUnblock(item._id)}
        style={styles.unblockButton}
      >
        <Text style={styles.unblockText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title="Blocked Users" />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#de822c" />
        ) : (
          <FlatList
            data={blockedUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        )}
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
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  name: {
    flex: 1,
    color: "white",
    fontSize: 16,
  },
  unblockButton: {
    backgroundColor: "#de822c",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  unblockText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default BlockedUsersScreen;
