import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Platform } from "react-native";
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

type Props = NativeStackScreenProps<any, "HomeTabs">;

const Tab = createBottomTabNavigator();

const HomeTabs: React.FC<Props> = ({ navigation }) => {
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
            borderBottomWidth: 1,
            borderColor: "#2A2A2A",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={require('../assets/icons/logo.png')} style={{ width: 28, height: 28 }}/> 
              <Text style = {styles.uteText}>ute</Text>
          </View>
        <View style={{ flexDirection: "row" }}>
            <Ionicons
              name="notifications-outline"
              size={26}
              color="white"
              style={{ marginRight: 20 }}
              onPress={() => navigation.navigate("Notifications")}
            />
            <Ionicons
              name="settings-outline"
              size={26}
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
                color={focused ? "#5de383" : "#8F8F8F"}
              />
            );
          },
          tabBarStyle: {
            backgroundColor: "#0a0000",
            height: Platform.OS === "ios" ? 70 : 55,
            borderTopWidth: 0.2,
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
  }
  })
;

export default HomeTabs;
