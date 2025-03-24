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

const Likes: React.FC<Props> = ({ navigation }) => {
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
      <View style={styles.info}>
        <Text style={styles.name}>{item.fullName}</Text>
        <TouchableOpacity onPress={async () => {
          const userId = await getUserId();
          navigation.navigate('Chat', { loggedInUserId: userId, likedUserId: item._id, userName: item.fullName })
          }}>
          <Icon name="comments" size={20} color="#5de383" />
        </TouchableOpacity>
      </View>
    </View>
  );
  

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>People Who Liked You 💕</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#5de383" />
      ) : likedUsers.length === 0 ? (
        <Text style={styles.noLikes}>No one has liked you yet.</Text>
      ) : (
        <FlatList
          data={likedUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
};

export default Likes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5de383',
    marginBottom: 20,
    textAlign: 'center',
  },
  noLikes: {
    fontSize: 18,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 20,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    color: '#B0B0B0',
  },
});
