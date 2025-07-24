import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Platform } from 'react-native';
import api from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';


const LeaderboardScreen = ({ navigation }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myUser, setMyUser] = useState(null);

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
          setMyUser(me || null);
        }
      } catch (e) {
        setLeaderboard([]);
        setMyUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const renderMyProfile = () => {
    if (!myUser) return null;
    
    // Find my position in the leaderboard
    const myPosition = leaderboard.findIndex(user => user._id === myUser._id) + 1;
    
    return (
      <View style={styles.myProfileCard}>
        <View style={styles.myProfileHeader}>
          <Text style={styles.myProfileTitle}>Your Ranking</Text>
        </View>
        <View style={styles.myProfileContent}>
          <View style={styles.myAvatarWrapper}>
            <Image
              source={myUser.avatar1 ? { uri: myUser.avatar1 } : require('../assets/icons/user-white.png')}
              style={styles.myAvatar}
            />
          </View>
          <View style={styles.myProfileInfo}>
            <Text style={styles.myName} numberOfLines={1}>{myUser.fullName?.split(' ')[0] || myUser.fullName}</Text>
            <View style={styles.myStatsContainer}>
              <View style={styles.myScoreContainer}>
                <Ionicons name="star" size={16} color="#de822c" style={{ marginRight: 4 }} />
                <Text style={styles.myScore}>{myUser.leaderboardScore}</Text>
              </View>
            </View>
          </View>
          <View style={styles.myPositionContainer}>
            <Text style={styles.myPositionLabel}>Position</Text>
            <Text style={styles.myPosition}>{myPosition}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    const isTopPlayer = index === 0;
    const isTop3 = index < 3;
    const rank = index + 1;
    
    const getBorderColor = () => {
      if (index === 0) return '#FFD700'; // Gold
      if (index === 1) return '#C0C0C0'; // Silver
      if (index === 2) return '#CD7F32'; // Bronze
      return '#333';
    };
    
    return (
      <View style={[
        styles.row, 
        isTopPlayer && styles.topRow,
        isTop3 && { borderColor: getBorderColor(), borderWidth: 2 }
      ]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, isTopPlayer && styles.topRankText]}>
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
          </Text>
        </View>
        <View style={styles.avatarWrapper}>
          
          <Image
            source={item.avatar1 ? { uri: item.avatar1 } : require('../assets/icons/user-white.png')}
            style={[styles.avatar, isTopPlayer && styles.topAvatar]}
          />
        </View>
        <Text style={[styles.name, isTopPlayer && styles.topName]} numberOfLines={1}>
          {item.fullName?.split(' ')[0] || item.fullName}
        </Text>
        <View style={[styles.scoreBox, isTopPlayer && styles.topScoreBox]}>
          <Ionicons 
            name="star" 
            size={16} 
            color={isTopPlayer ? "#de822c" : "#de822c"} 
            style={{ marginRight: 3 }} 
          />
          <Text style={[styles.score, isTopPlayer && styles.topScore]}>
            {item.leaderboardScore}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style = {styles.backButtonContainer}>
      <BackButton title = {""}/>
    <View style={styles.bg}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Top performers this month</Text>
      </View>
      {renderMyProfile()}
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
  backButtonContainer: {
    flex: 1,
  },
  bg: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#de822c',
    fontSize: 24,
    marginBottom: 4,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  loading: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  
  // My Profile Card Styles
  myProfileCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#de822c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  myProfileHeader: {
    backgroundColor: '#de822c',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  myProfileTitle: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
    letterSpacing: 0.5,
  },
  myProfileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  myAvatarWrapper: {
    marginRight: 12,
  },
  myAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#ffffffff',
  },
  myProfileInfo: {
    flex: 1,
  },
  myName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  myStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  myScore: {
    color: '#ffffffff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  myPositionContainer: {
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#ff820eff',
  },
  myPositionLabel: {
    color: '#888',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
    marginBottom: 1,
  },
  myPosition: {
    color: '#ffffffff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  
  // Leaderboard Row Styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    marginBottom: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  topRow: {
    backgroundColor: '#1a1a1a',
    shadowColor: '#1a1a1a',
    elevation: 8,
    borderColor: '#fff',
    borderWidth: 2,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: {
    color: '#eeeeeeff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  topRankText: {
    color: '#000',
    fontSize: 16,
  },
  avatarWrapper: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#444',
    borderWidth: 2,
    borderColor: '#ffffffff',
  },
  topAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  topName: {
    color: 'white',
    fontSize: 16,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  topScoreBox: {
    backgroundColor: '#000',
  },
  score: {
    color: '#ffffffff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Comic Sans MS' : 'monospace',
  },
  topScore: {
    color: '#ffffffff',
    fontSize: 17,
  },
});

export default LeaderboardScreen; 