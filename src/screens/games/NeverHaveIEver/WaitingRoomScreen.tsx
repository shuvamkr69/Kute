import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../../utils/api";
import { LinearGradient } from "expo-linear-gradient";

type Props = NativeStackScreenProps<any, "WaitingRoomScreen">;

const { width } = Dimensions.get("window");

const WaitingRoomScreen: React.FC<Props> = ({ navigation }) => {
  const [playersJoined, setPlayersJoined] = useState<number>(1);
  const [requiredPlayers, setRequiredPlayers] = useState<number>(2);

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

  const fetchTurnInfo = async () => {
    try {
      const res = await api.get("/api/v1/users/neverhaveiever/current-turn");
console.log("📥 /current-turn result:", res.data);

      const { userId, chanceHolderId, promptSubmitted } = res.data;

      if (userId === chanceHolderId) {
        if (promptSubmitted) {
          navigation.navigate("NHIEWaitingForAnswersScreen");
        } else {
          navigation.navigate("SubmitPromptScreen");
        }
      } else {
        if (promptSubmitted) {
          navigation.navigate("AnswerPromptScreen");
        } else {
          navigation.navigate("WaitingForPromptScreen");
        }
      }
      

    } catch (err) {
      console.error("Failed to fetch turn info:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get("/api/v1/users/neverhaveiever/waiting-room-status");
        setPlayersJoined(res.data.playersJoined);
        setRequiredPlayers(res.data.requiredPlayers);

        if (res.data.readyToStart) {
          fetchTurnInfo();
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <LinearGradient colors={["#ff172e", "#de822c"]} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.title}>Waiting Room</Text>
        <Text style={styles.subtitle}>Waiting for all players to join...</Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            {playersJoined} / {requiredPlayers} players joined
          </Text>
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
          <Text style={styles.loadingHint}>Game will start automatically once all players are ready</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Make sure everyone is ready to play 🎮</Text>
        </View>
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
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 30,
    textAlign: "center",
  },
  statusCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 28,
    borderRadius: 18,
    width: width * 0.85,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  statusText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  loadingHint: {
    marginTop: 20,
    fontSize: 14,
    color: "#fbe6e6",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 40,
  },
  footerText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
});

export default WaitingRoomScreen;
