import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import Constants from "expo-constants";
import api from "../utils/api";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/FontAwesome";
import Header from "../components/BackButton";

type Props = NativeStackScreenProps<any, "PhotoVerification">;

const PhotoVerificationScreen: React.FC<Props> = ({ navigation }) => {
  const [image1, setImage1] = useState<{ uri: string; base64: string } | null>(
    null
  );
  const [image2, setImage2] = useState<{ uri: string; base64: string } | null>(
    null
  );
  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);

  const FACE_API_KEY = Constants?.expoConfig?.extra?.FACE_API_KEY;
  const FACE_API_SECRET = Constants?.expoConfig?.extra?.FACE_API_SECRET;

  useEffect(() => {
    getProfilePhoto();
  }, []);

  

const getProfilePhoto = async () => {
  try {
    const response = await api.get(`/api/v1/users/me`);
    if (response.status === 200) {
      const profilePhotoUrl = response.data.avatar1;
      if (profilePhotoUrl) {
        setProcessingImage(true);

        try {
          // Fetch the image from the URL
          const photoResponse = await fetch(profilePhotoUrl);
          const blob = await photoResponse.blob();

          // Convert blob to local URI
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];

            // Resize and compress image to ensure it's < 2MB
            const manipResult = await ImageManipulator.manipulateAsync(
              profilePhotoUrl,
              [{ resize: { width: 800 } }], // Resize to smaller width (adjust as needed)
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            const estimatedSize = (manipResult.base64.length * 3) / 4 / 1024 / 1024; // MB
            if (estimatedSize > 2) {
              Alert.alert("Error", "Image is still too large even after compression.");
            } else {
              setImage1({
                uri: manipResult.uri,
                base64: manipResult.base64,
              });
            }
          };

          reader.readAsDataURL(blob);

        } catch (error) {
          console.error("Image processing error:", error);
          Alert.alert("Error", "Failed to process profile photo");
        } finally {
          setProcessingImage(false);
        }
      } else {
        Alert.alert("Error", "No profile photo found.");
      }
    }
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Failed to fetch profile photo.");
    setProcessingImage(false);
  }
};


  const takeSelfieWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Camera permission is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].uri) {
      setProcessingImage(true);
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 600 } }],
          {
            compress: 0.6,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

        const base64Clean = manipulated.base64?.replace(
          /^data:image\/\w+;base64,/,
          ""
        );

        setImage2({
          uri: manipulated.uri,
          base64: base64Clean,
        });
        
        
        setVerified(null);
      } catch (error) {
        console.error("Image processing error:", error);
        Alert.alert("Error", "Failed to process image");
      } finally {
        setProcessingImage(false);
      }
    }
  };

  const compareFaces = async () => {
    if (!image1?.base64 || !image2?.base64) {
      Alert.alert("Error", "Both images are required for verification.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("api_key", FACE_API_KEY);
      formData.append("api_secret", FACE_API_SECRET);
      formData.append("image_base64_1", image1.base64);
      formData.append("image_base64_2", image2.base64);

      const response = await fetch(
        "https://api-us.faceplusplus.com/facepp/v3/compare",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Face++ response:", data);

      if (data.error_message) {
        Alert.alert("API Error", data.error_message);
        setVerified(false);
        return;
      }

      if (!data.faces2) {
        Alert.alert("Error", "Both images must contain visible faces.");
        setVerified(false);
        return;
      }

      if (data.confidence > 75) {
        // Call the hand gesture verification function
        const gestureVerified = await verifyHandGesture(image2.base64);
        if (gestureVerified) {
          setVerified(true);
          await api.patch("/api/v1/users/me", {
            isVerified: true,
          });
        } else {
          setVerified(false);
        }
      } else {
        setVerified(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to verify face.");
      setVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const verifyHandGesture = async (imageBase64: string) => {
    try {
      const formData = new FormData();
      formData.append("api_key", FACE_API_KEY);
      formData.append("api_secret", FACE_API_SECRET);
      formData.append("image_base64", imageBase64);

      const response = await fetch(
        "https://api-us.faceplusplus.com/humanbodypp/v1/gesture",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Gesture verification response:", data.hands[0]);

      if (data.error_message) {
        Alert.alert("Gesture API Error", data.error_message);
        return false;
      }

      // Check if the gesture is a victory sign
      if (data.hands[0].gesture && data.hands[0].gesture.victory>75) {
        return true;
      } else {
        Alert.alert("Gesture Verification Failed", "Please show a victory sign.");
        return false;
      }
    } catch (error) {
      console.error("Gesture verification error:", error);
      Alert.alert("Error", "Failed to verify hand gesture.");
      return false;
    }
  };

  return (
    <View style={styles.backButtonContainer}>
      <Header title="Photo Verification" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Show them you're real</Text>
        <Text style={styles.subtitle}>
          Verify your identity to increase matches
        </Text>

        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Text style={styles.imageLabel}>Profile Photo</Text>
            {image1 ? (
              <Image source={{ uri: image1.uri }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="small" color="#de822c" />
              </View>
            )}
          </View>

          <View style={styles.imageWrapper}>
            <Text style={styles.imageLabel}>Your Selfie</Text>
            {image2 ? (
              <Image source={{ uri: image2.uri }} style={styles.image} />
            ) : (
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={takeSelfieWithCamera}
                disabled={processingImage}
              >
                <Icon name="camera" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {processingImage && (
          <ActivityIndicator
            size="large"
            color="#de822c"
            style={styles.loader}
          />
        )}

        {verified !== null && (
          <View
            style={[
              styles.resultContainer,
              verified ? styles.successResult : styles.errorResult,
            ]}
          >
            <Icon
              name={verified ? "check-circle" : "times-circle"}
              size={24}
              color={verified ? "#4CAF50" : "#F44336"}
            />
            <Text style={styles.resultText}>
              {verified ? "Verification Successful!" : "Verification Failed"}
            </Text>
            {!verified && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={takeSelfieWithCamera}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.infoBox}>
          <Icon name="info-circle" size={20} color="#de822c" />
          <Text style={styles.infoText}>
            Verified profiles get 3x more matches. Make sure both photos clearly
            show your face.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={compareFaces}
          disabled={loading || !image1 || !image2 || processingImage}
        >
          <LinearGradient
            colors={["#de822c", "#ff172e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? "Verifying..." : "Verify Identity"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContainer: {
    flexGrow: 1,
    backgroundColor: "#000",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#000",
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#B0B0B0",
    textAlign: "center",
    marginBottom: 30,
  },
  imageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  imageWrapper: {
    alignItems: "center",
    width: "48%",
  },
  imageLabel: {
    color: "#de822c",
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "500",
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#de822c",
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
  },
  cameraButton: {
    width: 150,
    height: 150,
    borderRadius: 10,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  verifyButton: {
    position: "absolute",
    alignSelf: "center",
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 20,
    marginTop: 40,
    elevation: 5,
    shadowColor: "#de822c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    bottom:0,

  },
  gradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loader: {
    marginVertical: 20,
  },
  resultContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "#1E1E1E",
  },
  successResult: {
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
  },
  errorResult: {
    borderLeftWidth: 5,
    borderLeftColor: "#F44336",
  },
  resultText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  infoText: {
    color: "#B0B0B0",
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  gestureContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  gesturePrompt: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default PhotoVerificationScreen;
