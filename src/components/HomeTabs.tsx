import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, Text, StyleSheet } from "react-native";
import { BlurView } from 'expo-blur';

// Import screens
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import LikesScreen from "../screens/Likes";
import GamesScreen from "../screens/GameScreens";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import ChatsScreen from "../screens/AllChats";
import api from "../utils/api";

type Props = NativeStackScreenProps<any, "HomeTabs">;

const Tab = createBottomTabNavigator();

const HomeTabs: React.FC<Props> = ({ navigation }) => {

  const [superLikes, setSuperLikes] = useState(0);
  const [boosts, setBoosts] = useState(0);
  const [boostActive, setBoostActive] = useState(false);
  const [boostTimeLeft, setBoostTimeLeft] = useState('');
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [boostActiveUntil, setBoostActiveUntil] = useState(null);
  const [premiumActive, setPremiumActive] = useState(false);

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const response = await api.get('/api/v1/users/powerUps');
        setSuperLikes(response.data.superLike);
        setBoosts(response.data.boost);
      } catch (error) {
        console.error('Error fetching counters:', error);
      }
    };
    fetchCounters();
  }, []);

  useEffect(() => {
    const fetchPremium = async () => {
      try {
        const res = await api.get('/api/v1/users/me');
        const active = res.data.ActivePremiumPlan && res.data.ActivePremiumPlan !== 'null' && res.data.ActivePremiumPlan !== '';
        setPremiumActive(!!active);
      } catch (e) {
        setPremiumActive(false);
      }
    };
    fetchPremium();
  }, []);

  useEffect(() => {
    // Fetch boostActiveUntil from backend
    const fetchBoost = async () => {
      try {
        const res = await api.get('/api/v1/users/me');
        const until = res.data.boostActiveUntil ? new Date(res.data.boostActiveUntil) : null;
        setBoostActiveUntil(until);
        if (until && until > new Date()) {
          setBoostActive(true);
        } else {
          setBoostActive(false);
        }
      } catch (e) {
        setBoostActive(false);
      }
    };
    fetchBoost();
  }, []);

  useEffect(() => {
    if (!boostActiveUntil || boostActiveUntil <= new Date()) {
      setBoostActive(false);
      setBoostTimeLeft('');
      return;
    }
    setBoostActive(true);
    const interval = setInterval(() => {
      const now = new Date();
      const diff = boostActiveUntil.getTime() - now.getTime();
      if (diff <= 0) {
        setBoostActive(false);
        setBoostTimeLeft('');
        clearInterval(interval);
        return;
      }
      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setBoostTimeLeft(`${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [boostActiveUntil]);

  return (
    <View style={{ flex: 1, backgroundColor: "#181818" }}>
      {/* Custom Top Bar */}
      <SafeAreaView>
        <View
          style={{
            height: 55,
            backgroundColor: "#0a0000",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            position: 'relative',
            zIndex: 100,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={require('../assets/icons/logo.webp')} style={{ width: 56, height: 56, left: -15 }}/>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Image
              source={require("../assets/icons/premium.png")}
              style={{
                width: 22,
                height: 22,
                marginRight: 18,
                tintColor: premiumActive ? undefined : '#888',
                opacity: premiumActive ? 1 : 0.6,
              }}
              resizeMode="contain"
            />
            <View>
              <Image
                source={require("../assets/icons/popularity.png")}
                style={{
                  width: 19,
                  height: 19,
                  marginRight: 18,
                  tintColor: boostActive ? undefined : '#888',
                  opacity: boostActive ? 1 : 0.6,
                }}
                resizeMode="contain"
              />
            </View>
            <Ionicons
              name="search-outline"
              size={23}
              color="white"
              style={{ marginRight: 15 }}
              onPress={() => navigation.navigate("AdvancedFiltering")}
            />
            <Ionicons
              name="notifications-outline"
              size={23}
              color="white"
              style={{ marginRight: 15 }}
              onPress={() => navigation.navigate("Notifications")}
            />
            <Ionicons
              name="settings-outline"
              size={23}
              color="white"
              onPress={() => navigation.navigate("Settings")}
            />
          </View>
        </View>
      </SafeAreaView>
      {/* Boost Modal rendered outside the top bar */}
      {showBoostModal && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowBoostModal(false)}
          style={{ position: 'absolute', top: 65, right: 140, zIndex: 9999, elevation: 9999 }}
        >
          <BlurView intensity={60} tint="dark" style={{ borderRadius: 12, overflow: 'hidden' }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.95)', padding: 16, borderRadius: 12, minWidth: 140, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Boost is Active</Text>
              <Text style={{ color: '#de822c', marginTop: 6, fontSize: 14 }}>{boostTimeLeft} left</Text>
            </View>
          </BlurView>
        </TouchableOpacity>
      )}
      {/* Bottom Tab Navigator */}
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIcon: ({ focused }) => {
            // Explicitly typing icons to match Ionicons name values
            const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
              Home: "home",
              Games: "game-controller-outline",
              Matches: "heart-outline",
              Chats: "chatbubbles-outline",
              Profile: "person-outline",
            };

            return (
              <Ionicons
                name={icons[route.name]}
                size={28}
                color={focused ? "#de822c" : "#8F8F8F"}
              />
            );
          },
          tabBarStyle: {
            backgroundColor: "#0a0000",
            height: Platform.OS === "ios" ? 70 : 55,
            borderTopWidth: 0,
            shadowOpacity: 0.1,
            shadowRadius: 5,
            shadowColor: "#000",
            elevation: 5,
          },

        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Games" component={GamesScreen} />
        <Tab.Screen name="Matches" component={LikesScreen} />
        <Tab.Screen name="Chats" component={ChatsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
};


const styles = StyleSheet.create({
  uteText: {
    color: '#81e8e0',
    fontSize: 25,
    fontWeight: 'bold',
  },
  
  })
;

export default HomeTabs;
