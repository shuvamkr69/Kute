import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from "react-native";
import CustomAlert from "../components/CustomAlert";
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
  viewCount: number;
}

interface LikedMeUser {
  _id: string;
  fullName: string;
  profileImage: string;
  superLiked: boolean;
  likedAt: string;
}

const Likes: React.FC<Props> = ({ navigation }) => {
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<LikedUser | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [tab, setTab] = useState<'matches' | 'viewedBy' | 'likedMe'>('matches');
  const [viewedBy, setViewedBy] = useState<ViewedByUser[]>([]);
  const [likedMe, setLikedMe] = useState<LikedMeUser[]>([]);
  const [premiumPlan, setPremiumPlan] = useState<string | null>(null);
  const [viewedLoading, setViewedLoading] = useState(false);
  const [likedMeLoading, setLikedMeLoading] = useState(false);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', onConfirm: undefined as undefined | (() => void), confirmText: '', cancelText: '' });
  const [showUnmatchAlert, setShowUnmatchAlert] = useState(false);
  const [pendingUnmatchUser, setPendingUnmatchUser] = useState<LikedUser | null>(null);

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
      api.get('/api/v1/users/viewedBy')
        .then(res => {
          setViewedBy(res.data.map((user: any) => ({
            _id: user._id,
            fullName: user.fullName,
            profileImage: user.profileImage || 'https://via.placeholder.com/150',
            viewCount: user.viewCount || 1,
          })));
        })
        .catch(() => setViewedBy([]))
        .finally(() => setViewedLoading(false));
    }
  }, [tab]);

  // Fetch users who liked me
  useEffect(() => {
    if (tab === 'likedMe') {
      setLikedMeLoading(true);
      api.get('/api/v1/users/usersWhoLikedMe')
        .then(res => {
          setLikedMe(res.data.map((user: any) => ({
            _id: user._id,
            fullName: user.fullName,
            profileImage: user.profileImage || 'https://via.placeholder.com/150',
            superLiked: user.superLiked || false,
            likedAt: user.likedAt,
          })));
        })
        .catch(() => setLikedMe([]))
        .finally(() => setLikedMeLoading(false));
    }
  }, [tab]);

  // Add focus effect to refresh data when returning to Likes screen
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
              viewCount: user.viewCount || 1,
            })));
          })
          .catch(() => setViewedBy([]))
          .finally(() => setViewedLoading(false));
      } else if (tab === 'likedMe') {
        setLikedMeLoading(true);
        api.get('/api/v1/users/usersWhoLikedMe')
          .then(res => {
            setLikedMe(res.data.map((user: any) => ({
              _id: user._id,
              fullName: user.fullName,
              profileImage: user.profileImage || 'https://via.placeholder.com/150',
              superLiked: user.superLiked || false,
              likedAt: user.likedAt,
            })));
          })
          .catch(() => setLikedMe([]))
          .finally(() => setLikedMeLoading(false));
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
      setCustomAlert({ visible: true, title: "Error", message: "Failed to refresh likes.", onConfirm: undefined, confirmText: '', cancelText: 'OK' });
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
        {item.fullName.split(' ')[0]}
      </Text>
      <TouchableOpacity
        onPress={async () => {
          try {
            const userId = await getUserId();
            navigation.navigate("Chat", {
              likedUserId: item._id,
              userName: item.fullName.split(' ')[0],
              loggedInUserId: userId,
              likedUserAvatar: item.profileImage,
            });
          } catch (err) {
            setCustomAlert({ visible: true, title: "Error", message: "Could not open chat. Please try again later.", onConfirm: undefined, confirmText: '', cancelText: 'OK' });
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
        {item.fullName.split(' ')[0]}
      </Text>
      <View style={styles.viewCountContainer}>
        <Icon name="eye" size={16} color="#de822c" />
        <Text style={styles.viewCountText}>{item.viewCount}</Text>
      </View>
    </View>
  );

  // Render function for users who liked me
  const renderLikedMeItem = ({ item }: { item: LikedMeUser }) => {
    const hasPremium = premiumPlan && premiumPlan !== 'null' && premiumPlan !== '';
    
    return (
      <View style={styles.likedMeCard}>
        <View style={styles.likedMeImageContainer}>
          <Image 
            source={{ uri: item.profileImage }} 
            style={[
              styles.likedMeImage,
              !hasPremium && styles.blurredImage
            ]} 
          />
          {!hasPremium && (
            <BlurView intensity={80} tint="dark" style={styles.imageBlur}>
              <View style={styles.blurOverlayImage} />
            </BlurView>
          )}
          {item.superLiked && (
            <View style={styles.superLikeBadge}>
              <Icon name="star" size={12} color="#00B4FF" />
            </View>
          )}
        </View>
        <View style={styles.likedMeContent}>
          <Text style={styles.likedMeName} numberOfLines={1} ellipsizeMode="tail">
            {hasPremium ? item.fullName.split(' ')[0] : '•••••'}
          </Text>
          {hasPremium ? (
            <TouchableOpacity 
              style={styles.likeBackButton}
              onPress={async () => {
                try {
                  await api.post('/api/v1/users/userLiked', { likedUserId: item._id });
                  // Remove from likedMe list since they're now matched
                  setLikedMe(prev => prev.filter(user => user._id !== item._id));
                  // Optionally add to matches or show success message
                  setCustomAlert({ 
                    visible: true, 
                    title: "It's a Match!", 
                    message: `You matched with ${item.fullName.split(' ')[0]}!`,
                    onConfirm: undefined,
                    confirmText: '',
                    cancelText: 'Great!'
                  });
                } catch (error) {
                  setCustomAlert({ 
                    visible: true, 
                    title: "Error", 
                    message: "Failed to like back. Please try again.",
                    onConfirm: undefined,
                    confirmText: '',
                    cancelText: 'OK'
                  });
                }
              }}
            >
              <Text style={styles.likeBackText}>Like them back?</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.premiumText}>Get Premium to see</Text>
          )}
        </View>
      </View>
    );
  };

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
          style={[styles.tab, tab === 'likedMe' && styles.tabActive]}
          onPress={() => setTab('likedMe')}
        >
          <Text style={[styles.tabText, tab === 'likedMe' && styles.tabTextActive]}>Liked You</Text>
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
                style={{ width: 200, height: 200, marginBottom: 20 }}
              />
              <Text style={styles.noLikes}>
                No likes? The algorithm must be jealous
              </Text>
            </View>
          }
          key="matches-list"
        />
      ) : tab === 'likedMe' ? (
        <View style={{ flex: 1 }}>
          {premiumPlan && premiumPlan !== 'null' && premiumPlan !== '' ? (
            likedMeLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#fff' }}>Loading...</Text>
              </View>
            ) : (
              <FlatList
                data={likedMe}
                keyExtractor={(item) => item._id}
                renderItem={renderLikedMeItem}
                numColumns={1}
                contentContainerStyle={[
                  styles.list,
                  likedMe.length === 0 && { flex: 1, justifyContent: 'center' },
                ]}
                refreshControl={
                  <RefreshControl
                    refreshing={likedMeLoading}
                    onRefresh={() => {
                      setLikedMeLoading(true);
                      api.get('/api/v1/users/usersWhoLikedMe')
                        .then(res => {
                          setLikedMe(res.data.map((user: any) => ({
                            _id: user._id,
                            fullName: user.fullName,
                            profileImage: user.profileImage || 'https://via.placeholder.com/150',
                            superLiked: user.superLiked || false,
                            likedAt: user.likedAt,
                          })));
                        })
                        .catch(() => setLikedMe([]))
                        .finally(() => setLikedMeLoading(false));
                    }}
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
                      No one has liked you yet. Keep swiping!
                    </Text>
                  </View>
                }
                key="liked-me-list"
              />
            )
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
                <View style={styles.blurOverlay}>
                  <Image
                    source={require('../assets/icons/heart-white.png')}
                    style={{ width: 150, height: 150, marginBottom: 20, tintColor: '#de822c' }}
                  />
                  <Text style={styles.blurTitle}>See Who Likes You</Text>
                  <Text style={styles.blurDesc}>
                    Discover who's interested in you! Upgrade to Premium to see everyone who liked your profile.
                  </Text>
                  <TouchableOpacity
                    style={styles.premiumButton}
                    onPress={() => navigation.navigate('Premium')}
                  >
                    <Text style={styles.premiumButtonText}>Unlock with Premium</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          )}
        </View>
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
                            viewCount: user.viewCount || 1,
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
                    onPress={() => navigation.navigate('Premium')}
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
            <Text style={styles.optionTitle}>{selectedUser?.fullName?.split(' ')[0]}</Text>

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: "#400" }]}
              onPress={() => {
                setPendingUnmatchUser(selectedUser);
                setShowUnmatchAlert(true);
              }}
            >
              <Text style={[styles.optionText, { color: "#fff" }]}>Unmatch</Text>
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
      {/* CustomAlert for errors */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
        cancelText={customAlert.cancelText || 'OK'}
      />
      {/* CustomAlert for Unmatch confirmation */}
      <CustomAlert
        visible={showUnmatchAlert}
        title="Unmatch?"
        message={`Are you sure you want to unmatch with ${pendingUnmatchUser?.fullName?.split(' ')[0] || ''}?`}
        onClose={() => setShowUnmatchAlert(false)}
        onConfirm={async () => {
          if (!pendingUnmatchUser) return;
          try {
            await api.delete(`/api/v1/users/unmatch/${pendingUnmatchUser._id}`);
            setLikedUsers((prev) => prev.filter((user) => user._id !== pendingUnmatchUser._id));
          } catch (error) {
            setCustomAlert({ visible: true, title: "Error", message: "Failed to unmatch.", onConfirm: undefined, confirmText: '', cancelText: 'OK' });
          } finally {
            setShowUnmatchAlert(false);
            setShowOptions(false);
          }
        }}
        confirmText="Unmatch"
        cancelText="Cancel"
      />
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
  viewCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(222, 130, 44, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  viewCountText: {
    color: '#de822c',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // Liked Me styles
  likedMeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 12,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    width: '100%',
    minHeight: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  likedMeImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  likedMeImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
  },
  blurredImage: {
    opacity: 0.3,
  },
  imageBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    overflow: 'hidden',
  },
  blurOverlayImage: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  superLikeBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#00B4FF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#181A20',
  },
  likedMeContent: {
    flex: 1,
    justifyContent: 'center',
  },
  likedMeName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  likeBackButton: {
    backgroundColor: '#de822c',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  likeBackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  premiumText: {
    color: '#B0B0B0',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
