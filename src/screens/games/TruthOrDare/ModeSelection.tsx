import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../../navigation/AuthContext";
import { getUserId } from "../../../utils/constants";

type RootStackParamList = {
  ModeSelection: undefined;
  SinglePlayerGame: undefined;
  MultiplayerGame: undefined;
};

type Props = NativeStackScreenProps<any, "TruthOrDareModeSelection">;

const userId = getUserId();
console.log("user id is: ", userId);

const ModeSelection: React.FC<Props> = ({ navigation }) => {
  const handleMultiplayerPress = async () => {
    const userId = await getUserId();
    if (userId) {
      navigation.navigate("MultiPlayerGame", { currentUserId: userId });
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    color: "#FF6F61",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#FF6F61",
    padding: 16,
    marginVertical: 10,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
