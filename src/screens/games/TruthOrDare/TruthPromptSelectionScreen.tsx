// TruthPromptSelectionScreen.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

// Define inline param list
export type RootStackParamList = {
  MultiPlayerGame: { currentUserId: string };
  TruthAnswerScreen: { matchId: string; currentUserId: string };
  TruthPromptSelectionScreen: { matchId: string; currentUserId: string };
  TruthReviewScreen: { matchId: string; currentUserId: string; answer: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "TruthPromptSelectionScreen">;

const sampleTruths = [
  "What's your biggest fear?",
  "Have you ever lied to your best friend?",
  "What's the most embarrassing thing you've done?",
];

const TruthPromptSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { matchId, currentUserId } = route.params;

  const handleSelect = (question: string) => {
    navigation.navigate("TruthReviewScreen", {
      matchId,
      currentUserId,
      answer: question,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Choose a truth to ask</Text>
      {sampleTruths.map((q, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => handleSelect(q)}
        >
          <Text style={styles.buttonText}>{q}</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.or}>or type your own</Text>
      <TextInput
        placeholder="Type a truth..."
        placeholderTextColor="#aaa"
        style={styles.input}
        onSubmitEditing={(e) => handleSelect(e.nativeEvent.text)}
      />
    </View>
  );
};

export default TruthPromptSelectionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 20 },
  header: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  button: {
    backgroundColor: "#1e1e1e",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderColor: "#444",
    borderWidth: 1,
  },
  buttonText: { color: "#fff", fontSize: 16 },
  or: { color: "#aaa", marginTop: 20, marginBottom: 8, textAlign: "center" },
  input: {
    borderColor: "#555",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    backgroundColor: "#1e1e1e",
  },
});
