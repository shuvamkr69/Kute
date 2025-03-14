// PickerComponent.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';

interface PickerComponentProps {
  label: string;
  selectedValue: string;
  options: string[];
  onValueChange: (value: string) => void;
}

const PickerComponent: React.FC<PickerComponentProps> = ({ label, selectedValue, options, onValueChange }) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.picker} onPress={() => setModalVisible(true)}>
        <Text style={styles.selectedValue}>{selectedValue || 'Select an option'}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.option} onPress={() => handleSelect(item)}>
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#E0E0E0', // Light text for dark mode
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E', // Dark mode friendly
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFA62B', // Orange accent for contrast
    minHeight: 56,
    color: 'white', // Text color
    justifyContent: 'space-between', // Ensures proper spacing
  },
  selectedValue: {
    color: '#BBBBBB', // Soft gray for contrast
    fontSize: 16,
    flex: 1, // Allows the text to take available space
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark semi-transparent overlay
  },
  modalContent: {
    backgroundColor: '#2A2A2A', // Dark modal background
    borderRadius: 12,
    margin: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444444', // Subtle divider
  },
  optionText: {
    fontSize: 16,
    color: '#FFFFFF', // White for high contrast
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFA62B', // Vibrant orange button for visibility
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});



export default PickerComponent;