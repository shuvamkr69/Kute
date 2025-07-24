import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VerificationModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height } = Dimensions.get('window');

export default function VerificationModal({ visible, onClose }: VerificationModalProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Photo Verification Guidelines</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Remove eyeglasses, hats, or masks</Text>
            <Text style={styles.listItem}>• Show victory sign while taking the photo</Text>
            <Text style={styles.listItem}>• Ensure your face is fully visible in your main profile photo</Text>
          </View>
          <Text style={styles.note}>
            Note: If any of the above points are not followed, verification will fail.
          </Text>
          <Text style={styles.note}>
            Changing your main profile photo will remove your verification badge.
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    marginBottom: 16,
  },
  listItem: {
    fontSize: 16,
    marginVertical: 4,
  },
  note: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
});
