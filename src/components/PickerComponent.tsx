import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface PickerComponentProps {
  label: string;
  selectedValue: string;
  options: string[];
  onValueChange: (value: string) => void;
  icon?: React.ReactNode;
}

const PickerComponent: React.FC<PickerComponentProps> = ({
  label,
  selectedValue,
  options,
  onValueChange,
  icon,
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={{ marginBottom: 18 }}>
      <TouchableOpacity
        style={styles.pickerRow}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.95}
      >
        <View style={styles.labelRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.selectedValueBox}>
          <Text style={styles.selectedValueText}>{selectedValue || "Not Set"}</Text>
          <Text style={styles.arrow}>▼</Text>
        </View>
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>{label}</Text>
            <View style={styles.bubbleContainer}>
              {options.map((option) => {
                const isSelected = selectedValue === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={styles.bubbleTouchable}
                    onPress={() => handleSelect(option)}
                    activeOpacity={0.85}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={["#ff172e", "#de822c"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.bubble}
                      >
                        <Text style={[styles.bubbleText, { color: "#fff" }]}>{option}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.bubble, styles.bubbleUnselected]}>
                        <Text style={[styles.bubbleText, { color: "#B0B0B0" }]}>{option}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: "#A0A0A0",
  },
  iconContainer: {
    marginRight: 8,
  },
  selectedValueBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "black",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  selectedValueText: {
    fontSize: 14,
    color: "#A0A0A0",
    marginRight: 10,
  },
  arrow: {
    fontSize: 10,
    color: "#BBBBBB",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#23262F",
    borderRadius: 18,
    padding: 24,
    minWidth: 260,
    maxWidth: 340,
    alignItems: "center",
  },
  modalLabel: {
    color: "#de822c",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 18,
  },
  bubbleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  bubbleTouchable: {
    marginRight: 8,
    marginBottom: 8,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleUnselected: {
    backgroundColor: "#111", // solid black
    borderWidth: 1,
    borderColor: "#444",
  },
  bubbleText: {
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default PickerComponent;
