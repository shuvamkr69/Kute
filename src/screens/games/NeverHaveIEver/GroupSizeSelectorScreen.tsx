import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  BackHandler,
  Pressable,
  Dimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

type Props = NativeStackScreenProps<any, "GroupSizeSelectorScreen">;

const { width } = Dimensions.get("window");

const GroupSizeSelectorScreen: React.FC<Props> = ({ navigation }) => {
  const [waitingCounts, setWaitingCounts] = useState({ 2: 0, 3: 0, 4: 0 });

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "Leave Waiting Room?",
          "Do you want to leave the waiting room?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Leave",
              style: "destructive",
              onPress: async () => {
                try {
                  await api.post("/api/v1/users/neverhaveiever/leave");
                } catch (err) {
                  console.error("Failed to leave waiting room:", err);
                }
                navigation.navigate("HomeTabs");
              },
            },
          ]
        );
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await api.get("/api/v1/users/neverhaveiever/waiting-counts");
        setWaitingCounts(res.data.waitingCounts);
      } catch (err) {
        console.error("Failed to fetch waiting counts:", err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 3000);
    return () => clearInterval(interval);
  }, []);

  const joinRoom = async (size: number) => {
    try {
      await api.post("/api/v1/users/neverhaveiever/join", { groupSize: size });
      navigation.navigate("WaitingRoomScreen", { groupSize: size });
    } catch (err) {
      console.error("Failed to join waiting room:", err);
    }
  };

  return (
    <LinearGradient
      colors={["#ff9a5a", "#ff6e40"]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Select Group Size</Text>

        {[2, 3, 4].map((size) => (
          <Pressable
            key={size}
            onPress={() => joinRoom(size)}
            style={({ pressed }) => [
              styles.button,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={styles.buttonInner}>
              <Text style={styles.buttonText}>{size} Players</Text>
              <Text style={styles.countText}>
                {waitingCounts?.[size] ?? 0} waiting
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: width * 0.85,
    marginBottom: 20,
    elevation: 5,
  },
  buttonInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 20,
    color: "#333",
    fontWeight: "600",
  },
  countText: {
    fontSize: 16,
    color: "#ff6e40",
    fontWeight: "500",
  },
});

export default GroupSizeSelectorScreen;
