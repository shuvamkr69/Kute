import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import api from "../../../utils/api";

type Props = NativeStackScreenProps<any, "WYRLobbyScreen">;

const POLL_INTERVAL = 3000;

interface DecodedToken {
  _id: string;
  exp?: number;
}

const WYRLobbyScreen: React.FC<Props> = ({ navigation }) => {
  const [polling, setPolling] = useState(true);
  const [message, setMessage] = useState("Joining the matchmaking queue...");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const getUserId = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) return null;
        const decoded: DecodedToken = jwtDecode(token);
        return decoded._id ?? null;
      } catch (err) {
        console.error("Failed to decode JWT:", err);
        return null;
      }
    };

    const joinQueue = async (userId: string) => {
      try {
        const res = await api.post("/api/v1/users/wyr/join-queue", {
          userId,
        });

        if (res.status === 200 && res.data.gameId) {
          handleMatch(res.data, userId);
        } else {
          setMessage("Waiting for an opponent...");
          intervalId = setInterval(() => pollQueue(userId), POLL_INTERVAL);
        }
      } catch (err) {
        console.log("Join queue error:", err.message);
      }
    };

    const pollQueue = async (userId: string) => {
      try {
        const res = await api.post("/api/v1/users/wyr/join-queue", {
          userId,
        });

        if (res.status === 200 && res.data.gameId) {
          clearInterval(intervalId);
          handleMatch(res.data, userId);
        }
      } catch (err) {
        console.log("Polling error:", err.message);
      }
    };

    const handleMatch = (data: any, userId: string) => {
      setPolling(false);
      setMessage("Opponent found!");

      const isChanceHolder = data.turnHolder === userId;

      setTimeout(() => {
        if (isChanceHolder) {
          navigation.replace("PromptInputScreen", {
            gameId: data.gameId,
            currentUserId: userId,
          });
        } else {
          navigation.replace("WaitingForPromptScreen", {
            gameId: data.gameId,
            currentUserId: userId,
          });
        }
      }, 1000);
    };

    (async () => {
      const uid = await getUserId();
      if (!uid) {
        setMessage("User not authenticated.");
        return;
      }
      setCurrentUserId(uid);
      joinQueue(uid);
    })();

    return () => clearInterval(intervalId);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {polling && <ActivityIndicator size="large" color="#de822c" style={{ marginTop: 20 }} />}
    </View>
  );
};

export default WYRLobbyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
});
