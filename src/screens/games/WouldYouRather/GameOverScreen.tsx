import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";

type Props = NativeStackScreenProps<any, "GameOverScreen">;

const GameOverScreen: React.FC<Props> = ({ navigation, route }) => {
  const { gameId } = route.params;
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get(`/api/v1/users/wyr/poll/${gameId}`);
        const game = res.data;

        let likeCount = 0;
        let dislikeCount = 0;

        for (const round of game.rounds) {
          if (round.feedback === "like") likeCount++;
          else if (round.feedback === "dislike") dislikeCount++;
        }

        setLikes(likeCount);
        setDislikes(dislikeCount);
      } catch (err) {
        console.error("Failed to load game summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const handleBack = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Games" }],
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#de822c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Game Over</Text>
      <Text style={styles.subtext}>Thanks for playing Would You Rather!</Text>

      <Text style={styles.stat}>👍 Likes: {likes}</Text>
      <Text style={styles.stat}>👎 Dislikes: {dislikes}</Text>

      <TouchableOpacity style={styles.button} onPress={handleBack}>
        <Text style={styles.buttonText}>Back to Games</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GameOverScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#de822c",
    marginBottom: 16,
  },
  subtext: {
    fontSize: 18,
    color: "#ccc",
    marginBottom: 32,
    textAlign: "center",
  },
  stat: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 12,
  },
  button: {
    marginTop: 40,
    paddingVertical: 14,
    paddingHorizontal: 40,
    backgroundColor: "#de822c",
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
});
