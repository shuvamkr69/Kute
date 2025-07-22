import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Platform } from 'react-native';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';

const trophyIcon = require('../assets/icons/most-popular.png');

const LeaderboardScreen = ({ navigation }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myScore, setMyScore] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/api/v1/users/leaderboard');
        setLeaderboard(res.data.leaderboard || []);
        // Get my user id from AsyncStorage (if available)
        const userString = await AsyncStorage.getItem('user');
        const user = userString ? JSON.parse(userString) : null;
        if (user && user._id) {
          const me = res.data.leaderboard.find(u => u._id === user._id);
          setMyScore(me ? me.leaderboardScore : null);
        }
      } catch (e) {
        setLeaderboard([]);
        setMyScore(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const renderMyScore = () => (
    myScore !== null && (
      <View style={styles.myScoreBox}>
        <Ionicons name="trophy-outline" size={24} color="#ffd54f" style={{ marginRight: 8 }} />
        <Text style={styles.myScoreText}>Your Score: <Text style={{ color: '#ffd54f' }}>{myScore}</Text></Text>
      </View>
    )
  );

  const renderItem = ({ item, index }) => (
    <View style={[styles.row, index === 0 && styles.topRow]}>
      <View style={styles.avatarWrapper}>
        {index === 0 ? (
          <Image source={trophyIcon} style={styles.trophy} />
        ) : null}
        <Image
          source={item.avatar1 ? { uri: item.avatar1 } : require('../assets/icons/user-white.png')}
          style={[styles.avatar, index === 0 && styles.topAvatar]}
        />
      </View>
      <Text style={[styles.name, index === 0 && styles.topName]} numberOfLines={1}>{item.fullName}</Text>
      <View style={styles.scoreBox}>
        <Ionicons name="star" size={22} color="#ffd54f" style={{ marginRight: 4 }} />
        <Text style={[styles.score, index === 0 && styles.topScore]}>{item.leaderboardScore}</Text>
      </View>
    </View>
  );

  return (
    <View style = {styles.backButtonContainer}>
      <BackButton title = {"Leader Board"}/>
    <View style={styles.bg}>
      <View style={styles.header}>
      </View>
      {renderMyScore()}
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContainer:{
    flex:1,
  },
  bg: {
    flex: 1,
    backgroundColor: '#181818',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 18,
  },
  backBtn: {
    marginRight: 10,
    backgroundColor: '#222',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#444',
  },
  title: {
    color: '#ffd54f',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  loading: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 18,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  topRow: {
    backgroundColor: '#ffd54f',
    shadowColor: '#ffd54f',
    elevation: 10,
  },
  avatarWrapper: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  trophy: {
    width: 36,
    height: 36,
    position: 'absolute',
    top: -28,
    left: 10,
    zIndex: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#444',
    borderWidth: 2,
    borderColor: '#ffd54f',
  },
  topAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  topName: {
    color: '#222',
    fontSize: 22,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 10,
  },
  score: {
    color: '#ffd54f',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  topScore: {
    color: '#222',
    fontSize: 22,
  },
  myScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginHorizontal: 18,
    marginBottom: 40,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  myScoreText: {
    color: '#ffd54f',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
});

export default LeaderboardScreen; 