import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const predefinedPrompts = [
  "My ideal weekend starts with",
  "The way to my heart is",
  "A fun fact about me is",
  "I'm overly competitive about",
  "My love language is",
  "My biggest pet peeve is",
];

type PromptModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (prompts: string[]) => void;
};

const PromptModal: React.FC<PromptModalProps> = ({ visible, onClose, onSave }) => {
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(Array(3).fill(''));
  const [answers, setAnswers] = useState<string[]>(Array(3).fill(''));

  const handleSelectPrompt = (index: number, prompt: string) => {
    const updatedPrompts = [...selectedPrompts];
    updatedPrompts[index] = prompt;
    setSelectedPrompts(updatedPrompts);
  };

  const handleAnswerChange = (index: number, text: string) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = text;
    setAnswers(updatedAnswers);
  };

  const handleSave = () => {
    const formattedPrompts = selectedPrompts.map((prompt, index) => `${prompt}~${answers[index]}`);
    onSave(formattedPrompts);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose Your Prompts</Text>
          {selectedPrompts.map((prompt, index) => (
            <View key={index} style={styles.promptBox}>
              <TouchableOpacity onPress={() => handleSelectPrompt(index, '')} style={styles.promptSelection}>
                <Text style={styles.promptText}>{prompt || "Select a prompt"}</Text>
                <Icon name="plus" size={16} color="#de822c" />
              </TouchableOpacity>
              <TextInput
                style={styles.answerInput}
                placeholder="Complete the sentence..."
                placeholderTextColor="#B0B0B0"
                value={answers[index]}
                onChangeText={(text) => handleAnswerChange(index, text)}
              />
            </View>
          ))}
          
          <FlatList
            data={predefinedPrompts}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelectPrompt(selectedPrompts.indexOf(''), item)} style={styles.promptOption}>
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Prompts</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PromptModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    color: '#de822c',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  promptBox: {
    marginBottom: 20,
  },
  promptSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'black',
    borderRadius: 10,
    padding: 10,
    borderColor: '#de822c',
    borderWidth: 1,
  },
  promptText: {
    color: '#B0B0B0',
  },
  answerInput: {
    marginTop: 10,
    color: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#de822c',
  },
  promptOption: {
    padding: 10,
    borderBottomColor: '#de822c',
    borderBottomWidth: 0.5,
  },
  optionText: {
    color: '#FFF',
  },
  saveButton: {
    backgroundColor: '#de822c',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  saveButtonText: {
    color: 'black',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 15,
  },
  closeButtonText: {
    color: '#FFF',
    textAlign: 'center',
  },
});
