import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../../navigation/AuthContext";
import { getUserId } from "../../../utils/constants";

type RootStackParamList = {
  ModeSelection: undefined;
  SinglePlayerGame: undefined;
  MultiplayerGame: { currentUserId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "ModeSelection">;

const userId = getUserId();
console.log("user id is: ", userId);

const ModeSelection: React.FC<Props> = ({ navigation }) => {
  const handleMultiplayerPress = async () => {
    const userId = await getUserId();
    if (userId) {
      navigation.navigate('MultiplayerGame', { currentUserId: userId });
    } else {
      console.warn("No user ID found");
    }
    console.log("user id is: ", userId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Mode</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("SinglePlayerGame")}
      >
        <Text style={styles.buttonText}>Single Player</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={handleMultiplayerPress} // ✅ use async function
      >
        <Text style={styles.buttonText}>Multiplayer</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ModeSelection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#de822c",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 18,
    marginVertical: 16,
    width: 260,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
}); 