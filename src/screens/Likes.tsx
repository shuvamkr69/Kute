import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/FontAwesome";
import api from "../utils/api";
import { getUserId } from "../utils/constants";
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<any, "Likes">;

interface LikedUser {
  _id: string;
  fullName: string;
  profileImage: string;
}

interface ViewedByUser {
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
  const [isOffline, setIsOffline] = useState(false);
  const [tab, setTab] = useState<'matches' | 'viewedBy'>('matches');
  const [viewedBy, setViewedBy] = useState<ViewedByUser[]>([]);
  const [premiumPlan, setPremiumPlan] = useState<string | null>(null);
  const [viewedLoading, setViewedLoading] = useState(false);

  const fetchLikedUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get("/api/v1/users/userLiked");
      const formattedUsers = response.data.map((user: any) => ({
        _id: user._id,
        fullName: user.fullName,
        profileImage: user.profileImage || "https://via.placeholder.com/150",
      }));
      setLikedUsers(formattedUsers);
      setIsOffline(false); // ✅ Reset offline status if successful
    } catch (error) {
      console.error("Error fetching liked users:", error);
      setIsOffline(true); // ✅ Set offline if it fails
      setLikedUsers([]); // Clear liked users to avoid rendering errors
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch premium status
  useEffect(() => {
    const fetchPremium = async () => {
      try {
        const res = await api.get('/api/v1/users/me');
        setPremiumPlan(res.data.ActivePremiumPlan || null);
      } catch (e) {
        setPremiumPlan(null);
      }
    };
    fetchPremium();
  }, []);

  // Fetch viewed by users
  useEffect(() => {
    if (tab === 'viewedBy') {
      setViewedLoading(true);
      api.get('/api/v1/users/viewedBy') // <-- Replace with your actual endpoint
        .then(res => {
          setViewedBy(res.data.map((user: any) => ({
            _id: user._id,
            fullName: user.fullName,
            profileImage: user.profileImage || 'https://via.placeholder.com/150',
          })));
        })
        .catch(() => setViewedBy([]))
        .finally(() => setViewedLoading(false));
    }
  }, [tab]);

  // Add focus effect to refresh viewedBy when returning to Likes screen
  useFocusEffect(
    React.useCallback(() => {
      if (tab === 'viewedBy') {
        setViewedLoading(true);
        api.get('/api/v1/users/viewedBy')
          .then(res => {
            setViewedBy(res.data.map((user: any) => ({
              _id: user._id,
              fullName: user.fullName,
              profileImage: user.profileImage || 'https://via.placeholder.com/150',
            })));
          })
          .catch(() => setViewedBy([]))
          .finally(() => setViewedLoading(false));
      }
    }, [tab])
  );

  useEffect(() => {
  fetchLikedUsers(); // Initial fetch

  const interval = setInterval(() => {
    fetchLikedUsers(true); // Silent polling
  }, 2000); // ✅ every 2 seconds

  return () => clearInterval(interval); // Cleanup on unmount
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

  // Custom render function for matches (full-width, chat button, long-press)
  const renderMatchesItem = ({ item }: { item: LikedUser }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={() => {
        setSelectedUser(item);
        setShowOptions(true);
      }}
      style={styles.viewedByCard}
    >
      <Image source={{ uri: item.profileImage }} style={styles.viewedByImage} />
      <Text style={styles.viewedByName} numberOfLines={1} ellipsizeMode="tail">
        {item.fullName}
      </Text>
      <TouchableOpacity
        onPress={async () => {
          try {
            const userId = await getUserId();
            navigation.navigate("Chat", {
              likedUserId: item._id,
              userName: item.fullName,
              loggedInUserId: userId,
              likedUserAvatar: item.profileImage,
            });
          } catch (err) {
            Alert.alert("Error", "Could not open chat. Please try again later.");
          }
        }}
        style={styles.chatButton}
      >
        <Icon name="comments" size={20} color="#de822c" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Add a custom render function for viewed by cards
  const renderViewedByItem = ({ item }: { item: ViewedByUser }) => (
    <View style={styles.viewedByCard}>
      <Image source={{ uri: item.profileImage }} style={styles.viewedByImage} />
      <Text style={styles.viewedByName} numberOfLines={1} ellipsizeMode="tail">
        {item.fullName}
      </Text>
    </View>
  );

  // Render fallback UI if offline or error
  if (isOffline) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#181A20' }}>
        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 12 }}>Could not load liked users.</Text>
        <TouchableOpacity onPress={() => fetchLikedUsers(false)} style={{ backgroundColor: '#de822c', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'matches' && styles.tabActive]}
          onPress={() => setTab('matches')}
        >
          <Text style={[styles.tabText, tab === 'matches' && styles.tabTextActive]}>Matches</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'viewedBy' && styles.tabActive]}
          onPress={() => setTab('viewedBy')}
        >
          <Text style={[styles.tabText, tab === 'viewedBy' && styles.tabTextActive]}>Viewed By</Text>
        </TouchableOpacity>
      </View>
  
      {/* Tab Content */}
      {tab === 'matches' ? (
        <FlatList
          data={likedUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderMatchesItem}
          numColumns={1}
          contentContainerStyle={[
            styles.list,
            likedUsers.length === 0 && { flex: 1, justifyContent: 'center' },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#de822c']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Image
                source={require('../assets/icons/broken-heart.png')}
                style={{ width: 150, height: 150, marginBottom: 20 }}
              />
              <Text style={styles.noLikes}>
                No likes? The algorithm must be jealous
              </Text>
            </View>
          }
          key="matches-list"
        />
      ) : (
        <View style={{ flex: 1 }}>
          {premiumPlan === 'Standard' || premiumPlan === 'Diamond' ? (
            viewedLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#fff' }}>Loading...</Text>
              </View>
            ) : (
              <FlatList
                data={viewedBy}
                keyExtractor={(item) => item._id}
                renderItem={renderViewedByItem}
                numColumns={1}
                contentContainerStyle={[
                  styles.list,
                  viewedBy.length === 0 && { flex: 1, justifyContent: 'center' },
                ]}
                refreshControl={
                  <RefreshControl
                    refreshing={viewedLoading}
                    onRefresh={() => {
                      setViewedLoading(true);
                      api.get('/api/v1/users/viewedBy')
                        .then(res => {
                          setViewedBy(res.data.map((user: any) => ({
                            _id: user._id,
                            fullName: user.fullName,
                            profileImage: user.profileImage || 'https://via.placeholder.com/150',
                          })));
                        })
                        .catch(() => setViewedBy([]))
                        .finally(() => setViewedLoading(false));
                    }}
                    colors={['#de822c']}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyStateContainer}>
                    <Image
                      source={require('../assets/icons/surprised.png')}
                      style={{ width: 150, height: 150, marginBottom: 20 }}
                    />
                    <Text style={styles.noLikes}>
                      No one has viewed your profile yet!
                    </Text>
                  </View>
                }
                key="viewed-by-list"
              />
            )
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
                <View style={styles.blurOverlay}>
                  <Image
                    source={require('../assets/icons/surprised.png')}
                    style={{ width: 150, height: 150, marginBottom: 20 }}
                  />
                  <Text style={styles.blurTitle}>See Who Viewed You</Text>
                  <Text style={styles.blurDesc}>
                    See everyone who checked out your profile. Upgrade to Standard or Diamond Premium to unlock!
                  </Text>
                  <TouchableOpacity
                    style={styles.premiumButton}
                    onPress={() => navigation.navigate('BuyPremium')}
                  >
                    <Text style={styles.premiumButtonText}>Unlock with Premium</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          )}
        </View>
      )}

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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noLikes: {
    color: '#B0B0B0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 90,
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
  headingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  offlineBadge: {
    fontSize: 16,
    color: "#ff4d4d",
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 28,
    backgroundColor: '#181A20',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#23262F',
  },
  tabText: {
    color: '#B0B0B0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#de822c',
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderRadius: 20,
    padding: 30,
    marginTop: 30,
  },
  blurTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  blurDesc: {
    color: '#B0B0B0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  premiumButton: {
    backgroundColor: '#de822c',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#de822c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  premiumButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewedByCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 12,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    width: '100%',
    minHeight: 64,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  viewedByImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: '#333',
  },
  viewedByName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
  },
});
