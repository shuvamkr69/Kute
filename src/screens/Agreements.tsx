import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import BackButton from '../components/BackButton';

const TABS = [
    { label: 'Privacy Policy', key: 'privacy' },
    { label: 'Terms & Conditions', key: 'terms' },
    { label: 'AI Consent', key: 'ai' },
];

const PrivacyContent = () => (
  <View>
    <Text style={styles.heading}>Privacy Policy</Text>
    <Text style={styles.subheading}>Effective Date: June 2024</Text>
    <Text style={styles.sectionTitle}>Your privacy is our top priority at Kute. We are committed to protecting your personal information and being transparent about how we use it. Please read the following carefully:</Text>

    <Text style={styles.sectionHeading}>1. Information We Collect</Text>
    <Text style={styles.bodyText}>• Profile details (name, age, gender, photos, bio, preferences)</Text>
    <Text style={styles.bodyText}>• Contact information (email, phone number)</Text>
    <Text style={styles.bodyText}>• Location data (for matching and safety features)</Text>
    <Text style={styles.bodyText}>• Usage data (app activity, device info, log data)</Text>
    <Text style={styles.bodyText}>• Messages and interactions (for moderation and safety)</Text>

    <Text style={styles.sectionHeading}>2. How We Use Your Information</Text>
    <Text style={styles.bodyText}>• To provide and improve our matching and chat services</Text>
    <Text style={styles.bodyText}>• To personalize your experience and show relevant matches</Text>
    <Text style={styles.bodyText}>• For safety, security, and fraud prevention</Text>
    <Text style={styles.bodyText}>• To send notifications and updates</Text>
    <Text style={styles.bodyText}>• For customer support and troubleshooting</Text>

    <Text style={styles.sectionHeading}>3. Sharing & Disclosure</Text>
    <Text style={styles.bodyText}>We do NOT sell your data to third parties.</Text>
    <Text style={styles.bodyText}>We may share data with trusted partners for analytics, hosting, and payment processing.</Text>
    <Text style={styles.bodyText}>We may disclose information if required by law or to protect user safety.</Text>

    <Text style={styles.sectionHeading}>4. Data Security</Text>
    <Text style={styles.bodyText}>We use encryption and secure servers to protect your data.</Text>
    <Text style={styles.bodyText}>Access to your data is restricted to authorized personnel only.</Text>

    <Text style={styles.sectionHeading}>5. Your Choices</Text>
    <Text style={styles.bodyText}>You can edit or delete your profile at any time.</Text>
    <Text style={styles.bodyText}>You can opt out of marketing communications.</Text>
    <Text style={styles.bodyText}>You can request access to or deletion of your data by contacting support.</Text>

    <Text style={styles.sectionHeading}>6. Children’s Privacy</Text>
    <Text style={styles.bodyText}>Kute is for users 18 and older. We do not knowingly collect data from children under 18.</Text>

    <Text style={styles.sectionHeading}>7. Updates</Text>
    <Text style={styles.bodyText}>We may update this policy. We will notify you of significant changes via the app or email.</Text>

    <Text style={styles.sectionHeading}>Contact</Text>
    <Text style={styles.bodyText}>For questions, contact: <Text style={styles.link}>support.kutedating@gmail.com</Text></Text>
  </View>
);

const TermsContent = () => (
  <View>
    <Text style={styles.heading}>Terms & Conditions</Text>
    <Text style={styles.sectionTitle}>Welcome to Kute! By using our app, you agree to the following terms:</Text>

    <Text style={styles.sectionHeading}>1. Eligibility</Text>
    <Text style={styles.bodyText}>You must be at least 18 years old to use Kute.</Text>
    <Text style={styles.bodyText}>You are responsible for the accuracy of your profile information.</Text>

    <Text style={styles.sectionHeading}>2. User Conduct</Text>
    <Text style={styles.bodyText}>Be respectful and kind to others.</Text>
    <Text style={styles.bodyText}>Do not harass, abuse, or impersonate anyone.</Text>
    <Text style={styles.bodyText}>Do not post offensive, illegal, or explicit content.</Text>
    <Text style={styles.bodyText}>Do not use the app for commercial purposes or spam.</Text>

    <Text style={styles.sectionHeading}>3. Safety</Text>
    <Text style={styles.bodyText}>Never share sensitive personal or financial information.</Text>
    <Text style={styles.bodyText}>Report suspicious users or behavior to our support team.</Text>
    <Text style={styles.bodyText}>We may remove content or suspend accounts that violate our guidelines.</Text>

    <Text style={styles.sectionHeading}>4. Content</Text>
    <Text style={styles.bodyText}>You grant Kute a license to use content you upload (photos, bio) for app functionality.</Text>
    <Text style={styles.bodyText}>You are responsible for the content you share.</Text>

    <Text style={styles.sectionHeading}>5. Subscriptions & Payments</Text>
    <Text style={styles.bodyText}>Premium features are available via in-app purchases.</Text>
    <Text style={styles.bodyText}>All purchases are final and non-refundable, except as required by law.</Text>

    <Text style={styles.sectionHeading}>6. Limitation of Liability</Text>
    <Text style={styles.bodyText}>Kute is provided “as is.” We are not liable for damages resulting from app use, matches, or user interactions.</Text>

    <Text style={styles.sectionHeading}>7. Account Termination</Text>
    <Text style={styles.bodyText}>We reserve the right to suspend or terminate accounts for violations of these terms.</Text>

    <Text style={styles.sectionHeading}>8. Changes to Terms</Text>
    <Text style={styles.bodyText}>We may update these terms. Continued use of Kute means you accept the new terms.</Text>

    <Text style={styles.sectionHeading}>Contact</Text>
    <Text style={styles.bodyText}>For questions, contact: <Text style={styles.link}>support.kutedating@gmail.com</Text></Text>
  </View>
);

const AIContent = () => (
  <View>
    <Text style={styles.heading}>AI Consent</Text>
    <Text style={styles.sectionTitle}>Kute uses artificial intelligence (AI) to enhance your experience, including:</Text>
    <Text style={styles.bodyText}>• Suggesting matches and conversation starters</Text>
    <Text style={styles.bodyText}>• Moderating content for safety</Text>
    <Text style={styles.bodyText}>• Providing AI-powered chat features</Text>

    <Text style={styles.sectionHeading}>By using Kute, you consent to:</Text>
    <Text style={styles.bodyText}>1. The processing of your data (profile, messages, activity) by AI systems</Text>
    <Text style={styles.bodyText}>2. The use of AI-generated suggestions, responses, and moderation</Text>
    <Text style={styles.bodyText}>3. The storage and analysis of your data to improve AI features</Text>

    <Text style={styles.sectionHeading}>Important</Text>
    <Text style={styles.bodyText}>Do not share sensitive personal, financial, or health information with AI features.</Text>
    <Text style={styles.bodyText}>AI responses are generated for assistance and entertainment; always use your own judgment.</Text>
    <Text style={styles.bodyText}>You can opt out of AI features by contacting support.</Text>

    <Text style={styles.sectionHeading}>Transparency & Responsible AI</Text>
    <Text style={styles.bodyText}>We are committed to transparency and responsible AI use. For more details, contact: <Text style={styles.link}>support.kutedating@gmail.com</Text></Text>
  </View>
);

const Agreements: React.FC = () => {
    const route = useRoute<RouteProp<Record<string, { initialTab?: number }>, string>>();
    const initialTab = route.params?.initialTab ?? 0;
    const [selectedTab, setSelectedTab] = useState<number>(initialTab);

    let content = <PrivacyContent />;
    if (selectedTab === 1) content = <TermsContent />;
    if (selectedTab === 2) content = <AIContent />;

    return (
        <View style={styles.backButtonContainer}>
            <BackButton title="Agreements" />
            <View style={styles.container}>
                <View style={styles.tabBar}>
                    {TABS.map((tab, idx) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, selectedTab === idx && styles.activeTab]}
                            onPress={() => setSelectedTab(idx)}
                        >
                            <Text style={[styles.tabText, selectedTab === idx && styles.activeTabText]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <ScrollView style={styles.contentContainer} contentContainerStyle={{ padding: 20 }}>
                    {content}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    backButtonContainer:
    {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#181818',
        borderBottomWidth: 1,
        borderBottomColor: '#23242a',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#de822c',
        backgroundColor: '#181818',
    },
    tabText: {
        color: '#888',
        fontSize: 15,
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    heading: {
        color: '#de822c',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 8,
        textAlign: 'center',
    },
    subheading: {
        color: '#de822c',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 18,
        textAlign: 'center',
    },
    sectionHeading: {
        color: '#de822c',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 18,
        marginBottom: 6,
    },
    bodyText: {
        color: '#fff',
        fontSize: 15,
        marginBottom: 6,
        lineHeight: 22,
    },
    link: {
        color: '#de822c',
        textDecorationLine: 'underline',
    },
});

export default Agreements; 