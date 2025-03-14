import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome';

type Props = NativeStackScreenProps<any, 'Likes'>;

const mockLikes = [
  { id: '1', name: 'Sophia', image: 'https://via.placeholder.com/150' },
  { id: '2', name: 'Olivia', image: 'https://via.placeholder.com/150' },
  { id: '3', name: 'Liam', image: 'https://via.placeholder.com/150' },
];

const Likes: React.FC<Props> = ({ navigation }) => {
  const renderItem = ({ item }: { item: typeof mockLikes[0] }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.profileImage} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
          <Icon name="comments" size={20} color="#FFA62B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>People Who Liked You 💕</Text>
      <FlatList
        data={mockLikes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
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
    color: '#FFA62B',
    marginBottom: 20,
    textAlign: 'center',
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
