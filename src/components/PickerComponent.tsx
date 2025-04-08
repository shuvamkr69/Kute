import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  Animated,
  Easing,
} from "react-native";

const { height } = Dimensions.get("window");

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
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const OPTION_HEIGHT = 60;
  const MAX_VISIBLE_OPTIONS = Math.floor(height * 0.5 / OPTION_HEIGHT);
  const targetHeight = Math.min(options.length, MAX_VISIBLE_OPTIONS) * OPTION_HEIGHT + 100;

  const openModal = () => {
    setModalVisible(true);
    
    Animated.timing(slideAnim, {
      toValue: height - targetHeight,
      duration: 300,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 200,
      easing: Easing.in(Easing.linear),
      useNativeDriver: false,
    }).start(() => setModalVisible(false));
  };

  const handleSelect = (value: string) => {
    onValueChange(value);
    closeModal();
  };

  return (
    <View>
      <TouchableOpacity style={styles.pickerRow} onPress={openModal}>
  <View style={styles.labelContainer}>
    {icon && <View style={styles.iconContainer}>{icon}</View>}
    <Text style={styles.label}>{label}</Text>
  </View>
  <View style={styles.selectedValueBox}>
    <Text style={styles.selectedValueText}>{selectedValue || "Not Set"}</Text>
    {!modalVisible && <Text style={styles.arrow}>▼</Text>}
  </View>
</TouchableOpacity>


      <Modal visible={modalVisible} transparent animationType="none">
  <View style={styles.modalOverlay}>
    <TouchableOpacity style={styles.backgroundDismissArea} activeOpacity={1} onPress={closeModal} />
    <Animated.View style={[styles.bottomSheet, { top: slideAnim }]}>
      <View style={styles.handleBar} />
      <FlatList
          style={{ maxHeight: MAX_VISIBLE_OPTIONS * OPTION_HEIGHT }}
          showsVerticalScrollIndicator={false}
          data={options}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.optionBox} onPress={() => handleSelect(item)}>
              <Text style={styles.optionText}>{item}</Text>
            </TouchableOpacity>
          )}
        />

    </Animated.View>
  </View>
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
  label: {
    fontSize: 16,
    color: "#A0A0A0",
  },
  selectedValueBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1f1f",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  selectedValueText: {
    fontSize: 16,
    color: "#A0A0A0",
    marginRight: 10,
  },
  arrow: {
    fontSize: 10,
    color: "#BBBBBB",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  iconContainer: {
    marginRight: 8,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#2A2A2A",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 40,
  },
  backgroundDismissArea: {
    flex: 1,
  },
  
  
  handleBar: {
    width: 50,
    height: 6,
    backgroundColor: "#666",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  optionBox: {
    backgroundColor: "#3A3A3A",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  optionText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
  },
  
});

export default PickerComponent;
