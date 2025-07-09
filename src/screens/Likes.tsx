import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/FontAwesome";
import api from "../utils/api";
import { getUserId } from "../utils/constants";

type Props = NativeStackScreenProps<any, "Likes">;

interface LikedUser {
  _id: string;
  fullName: string;
  profileImage: string;
}

const Likes: React.FC<Props> = ({ navigation }) => {
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<LikedUser | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const fetchLikedUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/users/userLiked");
      const formattedUsers = response.data.map((user: any) => ({
        _id: user._id,
        fullName: user.fullName,
        profileImage: user.profileImage || "https://via.placeholder.com/150",
      }));
      setLikedUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching liked users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedUsers();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchLikedUsers();
    } catch (error) {
      console.error("Error refreshing likes:", error);
      Alert.alert("Error", "Failed to refresh likes.");
    } finally {
      setRefreshing(false);
    }
  }, [fetchLikedUsers]);

  const renderItem = ({ item }: { item: LikedUser }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={() => {
        setSelectedUser(item);
        setShowOptions(true);
      }}
      style={styles.card}
    >
      <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {item.fullName}
      </Text>
      <TouchableOpacity
        onPress={async () => {
          const userId = await getUserId();
          console.log("User ID:", userId);
          navigation.navigate("OtherProfile", {
            userId: selectedUser?._id,
          });
        }}
        style={styles.chatButton}
      >
        <Icon name="comments" size={20} color="#de822c" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Matches</Text>

      <FlatList
        data={likedUsers}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.list,
          likedUsers.length === 0 && { flex: 1, justifyContent: "center" },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#de822c"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Image
              source={require("../assets/icons/broken-heart.png")}
              style={{ width: 150, height: 150, marginBottom: 20 }}
            />
            <Text style={styles.noLikes}>
              No likes? The algorithm must be jealous
            </Text>
          </View>
        }
        key="two-columns"
      />

      <Modal
        animationType="fade"
        transparent
        visible={showOptions}
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPressOut={() => setShowOptions(false)}
        >
          <View style={styles.optionContainer}>
            <Text style={styles.optionTitle}>{selectedUser?.fullName}</Text>

            {/* <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                // TODO: Navigate to profile if you want
                setShowOptions(false);
                navigation.navigate("OtherProfile", {
                  likedUserId: selectedUser?._id,
                });
              }}
            >
              <Text style={styles.optionText}>View Profile</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: "#400" }]}
              onPress={() => {
                Alert.alert(
                  "Unmatch?",
                  `Are you sure you want to unmatch with ${selectedUser?.fullName}?`,
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Unmatch",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await api.delete(
                            `/api/v1/users/unmatch/${selectedUser?._id}`
                          );
                          setLikedUsers((prev) =>
                            prev.filter(
                              (user) => user._id !== selectedUser?._id
                            )
                          );
                        } catch (error) {
                          Alert.alert("Error", "Failed to unmatch.");
                        } finally {
                          setShowOptions(false);
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={[styles.optionText, { color: "#fff" }]}>
                Unmatch
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.optionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Likes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 10,
  },

  list: {
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
    paddingHorizontal: 10, // Added horizontal padding
  },
  emptyStateContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  noLikes: {
    fontSize: 18,
    color: "#B0B0B0",
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },

  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  card: {
    width: "48%", // Takes up slightly less than half to allow spacing
    backgroundColor: "#0f0f0f",
    borderRadius: 10,
    padding: 15,
    alignItems: "center", // Center items vertically
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImage: {
    width: 80, // Slightly larger image
    height: 80,
    borderRadius: 40,
    marginBottom: 10, // Space between image and name
  },
  name: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
    marginBottom: 10, // Space between name and button
    textAlign: "center",
    width: "100%", // Ensure text takes full width for proper centering
  },
  chatButton: {
    backgroundColor: "transparent",
    padding: 8,
    borderRadius: 20,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  info: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  optionContainer: {
    width: 250,
    backgroundColor: "#1c1c1c",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },

  optionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
  },

  optionButton: {
    width: "100%",
    padding: 10,
    backgroundColor: "#2c2c2c",
    borderRadius: 6,
    marginVertical: 5,
    alignItems: "center",
  },

  optionText: {
    color: "white",
    fontSize: 16,
  },
});
