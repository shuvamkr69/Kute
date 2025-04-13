import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import api from '../utils/api';
import { getUserId } from '../utils/constants';

type Props = NativeStackScreenProps<any, 'Likes'>;

interface LikedUser {
  _id: string;
  fullName: string;
  profileImage: string;
}

const Likes: React.FC<Props> = ({ navigation}) => {
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchLikedUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/users/userLiked');
      const formattedUsers = response.data.map((user: any) => ({
        _id: user._id,
        fullName: user.fullName,
        profileImage: user.profileImage || 'https://via.placeholder.com/150',
      }));
      setLikedUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching liked users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedUsers();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLikedUsers();
    setRefreshing(false);
  }, []);

  const renderItem = ({ item }: { item: LikedUser }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {item.fullName}
      </Text>
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={async () => {
          const userId = await getUserId();
          navigation.navigate('Chat', { 
            loggedInUserId: userId, 
            likedUserId: item._id, 
            userName: item.fullName,
            likedUserAvatar: item.profileImage,
          });
        }}
      >
        <Icon name="comments" size={20} color="#de822c" />
      </TouchableOpacity>
    </View>
  );
  

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Matches</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#de822c" />
      ) : likedUsers.length === 0 ? (
        <View style ={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Image source={require('../assets/icons/broken-heart.png')} style={{ width: 150, height: 150, alignSelf: 'center' }} />
            <Text style={styles.noLikes}>No likes? The algorithm must be jealous</Text>
        </View>
        
      ) : (
        <FlatList
  data={likedUsers}
  keyExtractor={(item) => item._id}
  renderItem={renderItem}
  numColumns={2}
  columnWrapperStyle={styles.columnWrapper}
  contentContainerStyle={styles.list}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
  key="two-columns" // Add this to prevent the invariant violation
/>
      )}
    </View>
  );
};

export default Likes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 10, // Reduced padding for better grid spacing
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    paddingHorizontal: 10, // Added horizontal padding
  },
  noLikes: {
    fontSize: 18,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 90,
  },
  list: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  card: {
    width: '48%', // Takes up slightly less than half to allow spacing
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center', // Center items vertically
    shadowColor: '#000',
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
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10, // Space between name and button
    textAlign: 'center',
    width: '100%', // Ensure text takes full width for proper centering
  },
  chatButton: {
    backgroundColor: '#242424',
    padding: 8,
    borderRadius: 20,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  info: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
});
