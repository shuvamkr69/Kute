import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

interface HeaderProps {
  title: string;
  color?: string;
  size?: number;
}

const Header: React.FC<HeaderProps> = ({ title, color = "#FFFFFF", size = 24 }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={size} color={color} />
      </TouchableOpacity>
      <Text style={[styles.title, { color }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 60,
    backgroundColor: "#000000", // Pure black background
    flexDirection: "row",
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Header;