// WaitingRoomScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import axios from "axios";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";

type Props = NativeStackScreenProps<any, "WaitingRoomScreen">;

const WaitingRoomScreen: React.FC<Props> = ({ navigation }) => {
  const [playersJoined, setPlayersJoined] = useState<number>(1);
  const [requiredPlayers, setRequiredPlayers] = useState<number>(2);

  const fetchTurnInfo = async () => {
    try {
      const res = await api.get("/api/v1/users/neverhaveiever/current-turn");
      const { userId, chanceHolderId } = res.data;

      if (userId === chanceHolderId) {
        navigation.navigate("SubmitPromptScreen");
      } else {
        navigation.navigate("WaitingForPromptScreen");
      }
    } catch (err) {
      console.error(
        "Failed to fetch turn info:",
        err.response?.data || err.message
      );
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(
          "/api/v1/users/neverhaveiever/waiting-room-status"
        );
        setPlayersJoined(res.data.playersJoined);
        setRequiredPlayers(res.data.requiredPlayers);
        if (res.data.readyToStart) {
          if (res.data.readyToStart) {
            fetchTurnInfo(); // ✅ Determines if user is chance holder
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waiting for players...</Text>
      <Text>
        {playersJoined} / {requiredPlayers} joined
      </Text>
      <ActivityIndicator size="large" style={{ marginTop: 20 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, marginBottom: 10 },
});

export default WaitingRoomScreen;
