import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import BackButton from "../components/BackButton";
import api from "../utils/api";

type RootStackParamList = {
  HelpScreen: { initialTab?: "help" | "report" };
};

type Props = NativeStackScreenProps<RootStackParamList, "HelpScreen">;

const HelpScreen: React.FC<Props> = ({ route, navigation }) => {
  const [activeTab, setActiveTab] = useState<"help" | "report">("help");
  const [reportMessage, setReportMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (route.params?.initialTab === "report") {
      setActiveTab("report");
    } else {
      setActiveTab("help");
    }

    navigation.setOptions({ title: "Support" });
  }, [route.params, navigation]);

  const renderHelpCenter = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Help Center</Text>

      <Text style={styles.paragraph}>
        Welcome to our Help Center! Here you’ll find answers to common questions
        about using our app and tips to make the most of your experience.
      </Text>

      <Text style={styles.subTitle}>Getting Started</Text>

      <View style={styles.list}>
        <Text style={styles.listItem}>
          • Complete your profile with photos and a bio to increase your chances
          of matching.
        </Text>
        <Text style={styles.listItem}>
          • Keep your location services enabled for better matches near you.
        </Text>
        <Text style={styles.listItem}>
          • Be respectful when chatting with other users.
        </Text>
      </View>

      <Text style={styles.subTitle}>Frequently Asked Questions</Text>

      <View style={styles.faq}>
        <Text style={styles.faqQuestion}>How do I edit my profile?</Text>
        <Text style={styles.faqAnswer}>
          Go to Settings → Edit Profile to update your bio, photos, and other
          details.
        </Text>

        <Text style={styles.faqQuestion}>How do I reset my password?</Text>
        <Text style={styles.faqAnswer}>
          On the login screen, tap ‘Forgot your password?’ and follow the
          instructions sent to your email.
        </Text>

        <Text style={styles.faqQuestion}>
          Why am I not getting any matches?
        </Text>
        <Text style={styles.faqAnswer}>
          Make sure your profile is complete and try updating your bio and
          photos to attract more attention.
        </Text>

        <Text style={styles.faqQuestion}>
          How can I block or report someone?
        </Text>
        <Text style={styles.faqAnswer}>
          Open the user’s profile, tap the menu, and select ‘Block’ or ‘Report’.
        </Text>

        <Text style={styles.faqQuestion}>How do I delete my account?</Text>
        <Text style={styles.faqAnswer}>
          Go to Settings → Delete Account. Please note that deleting your
          account is permanent.
        </Text>

        <Text style={styles.faqQuestion}>
          Why is my boost or premium plan not active?
        </Text>
        <Text style={styles.faqAnswer}>
          Check your subscription status in Settings → Premium. If you’ve paid
          but don’t see it active, contact support.
        </Text>
      </View>

      <Text style={styles.subTitle}>Still need help?</Text>
      <Text style={styles.paragraph}>
        If you didn’t find the answer you were looking for, you can contact our
        support team by using the ‘Report a Problem’ tab.
      </Text>
    </ScrollView>
  );

  const submitReport = async () => {
    if (!reportMessage.trim()) {
      Alert.alert("Error", "Please describe the problem.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/api/v1/users/report-problem", {
        message: reportMessage,
      });
      Alert.alert("Success", "Your report has been sent. Thank you!");
      setReportMessage("");
    } catch (err) {
      console.error("Report error", err);
      Alert.alert("Error", "Failed to send your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReportProblem = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Report a Problem</Text>
      <Text style={styles.paragraph}>
        Please describe the issue you’re facing. Our team will review it as soon
        as possible.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Describe your problem..."
        placeholderTextColor="#888"
        multiline
        numberOfLines={6}
        value={reportMessage}
        onChangeText={setReportMessage}
      />

      <TouchableOpacity
        style={[styles.button, isSubmitting && { opacity: 0.6 }]}
        onPress={submitReport}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "Sending..." : "Submit"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.backButtonContainer}>
      <BackButton title={"Support"} />
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "help" && styles.activeTab]}
            onPress={() => setActiveTab("help")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "help" && styles.activeTabText,
              ]}
            >
              Help Center
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "report" && styles.activeTab]}
            onPress={() => setActiveTab("report")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "report" && styles.activeTabText,
              ]}
            >
              Report a Problem
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === "help" ? renderHelpCenter() : renderReportProblem()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1E1E1E",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#de822c",
  },
  tabText: {
    color: "#B0B0B0",
    fontSize: 16,
  },
  activeTabText: {
    color: "#de822c",
    fontWeight: "bold",
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    color: "#de822c",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subTitle: {
    color: "white",
    fontSize: 16,
    marginTop: 15,
    marginBottom: 5,
    fontWeight: "bold",
  },
  text: {
    color: "#B0B0B0",
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    borderColor: "#de822c",
    borderWidth: 1,
    color: "white",
    padding: 10,
    marginTop: 15,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#de822c",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  paragraph: {
    color: "#B0B0B0",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  list: {
    marginBottom: 20,
  },

  listItem: {
    color: "#B0B0B0",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },

  faq: {
    marginBottom: 20,
  },

  faqQuestion: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 4,
  },

  faqAnswer: {
    color: "#B0B0B0",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
});

export default HelpScreen;
