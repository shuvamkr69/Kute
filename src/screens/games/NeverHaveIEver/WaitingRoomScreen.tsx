import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Dimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../../utils/api";
import { LinearGradient } from "expo-linear-gradient";
import CustomAlert from "../../../components/CustomAlert";
import { getSocket } from '../../../utils/socket';
import { getUserId } from '../../../utils/constants';

type Props = NativeStackScreenProps<any, "WaitingRoomScreen">;

const { width } = Dimensions.get("window");

const WaitingRoomScreen: React.FC<Props> = ({ navigation, route }) => {
  const [playersJoined, setPlayersJoined] = useState<number>(1);
  const [requiredPlayers, setRequiredPlayers] = useState<number>(2);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', onConfirm: null });

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        setCustomAlert({
          visible: true,
          title: "Leave Waiting Room?",
          message: "Do you want to leave the waiting room?",
          onConfirm: async () => {
            try {
              await api.post("/api/v1/users/neverhaveiever/leave");
            } catch (err) {
              console.error("Failed to leave waiting room:", err);
            }
            setCustomAlert((prev) => ({ ...prev, visible: false }));
            navigation.navigate("HomeTabs");
          }
        });
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  useEffect(() => {
    getUserId().then(uid => {
      setUserId(uid);
      if (!uid) return;
      const socket = getSocket();
      const groupSize = route?.params?.groupSize || 2;
      socket.emit('nhie:joinRoom', { userId: uid, groupSize });
      socket.on('nhie:roomUpdate', (room) => {
        setPlayersJoined(room.players.length);
        setRequiredPlayers(room.groupSize);
        setRoomId(room.roomId);
        if (room.state === 'in_progress') {
          const idx = room.players.findIndex(p => p.userId === uid);
          if (idx === room.chanceIndex) {
            navigation.navigate('SubmitPromptScreen', { roomId: room.roomId });
          } else {
            navigation.navigate('WaitingForPromptScreen', { roomId: room.roomId });
          }
        }
      });
    });
    return () => {
      const socket = getSocket();
      socket.off('nhie:roomUpdate');
    };
  }, [navigation, route]);

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
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
        onConfirm={customAlert.onConfirm}
        confirmText="Leave"
        cancelText="Cancel"
      />
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
