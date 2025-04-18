import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, Text, StyleSheet } from "react-native";

// Import screens
import HomeScreen from "../screens/HomeScreen";
import ChatScreen from "../screens/ChatScreen";
import ProfileScreen from "../screens/ProfileScreen";
import LikesScreen from "../screens/Likes";
import GamesScreen from "../screens/GameScreens";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import ChatsScreen from "../screens/AllChats";
import { LinearGradient } from "expo-linear-gradient";
import api from "../utils/api";

type Props = NativeStackScreenProps<any, "HomeTabs">;

const Tab = createBottomTabNavigator();

const HomeTabs: React.FC<Props> = ({ navigation }) => {

  const [superLikes, setSuperLikes] = useState(0);
  const [boosts, setBoosts] = useState(0);

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
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={require('../assets/icons/logo.webp')} style={{ width: 56, height: 56, left: -15 }}/> 
              
          </View>

          

          <View style={{ flexDirection: "row"}}>
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
