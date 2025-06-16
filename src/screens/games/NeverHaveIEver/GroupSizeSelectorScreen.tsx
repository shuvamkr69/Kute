// GroupSizeSelectorScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import axios from "axios";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import api from "../../../utils/api";
import { Alert, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';


type Props = NativeStackScreenProps<any, "GroupSizeSelectorScreen">;

const GroupSizeSelectorScreen: React.FC<Props> = ({ navigation }) => {
  const [waitingCounts, setWaitingCounts] = useState({ 2: 0, 3: 0, 4: 0 });

  

  useFocusEffect(          //leave waiing room if back button clicked
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
      return true; // Block default behavior
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
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
      navigation.navigate("WaitingRoomScreen");
    } catch (err) {
      console.error("Failed to join waiting room:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Group Size</Text>
      {[2, 3, 4].map((size) => (
        <View key={size} style={styles.buttonContainer}>
          <Button
            title={`${size} Players (${waitingCounts?.[size] ?? 0} waiting)`}
            onPress={() => joinRoom(size)}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: { fontSize: 24, marginBottom: 24 },
  buttonContainer: { marginBottom: 12, width: "80%" },
});

export default GroupSizeSelectorScreen;
