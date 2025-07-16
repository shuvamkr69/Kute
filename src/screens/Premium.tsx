import React, { useRef, useState } from "react";
import { Image, ScrollView, TouchableOpacity } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  FlatList,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import CustomButton from "../components/Button";
import api from "../utils/api";
import BackButton from "../components/BackButton";
import { Pressable } from "react-native";
import { useEffect } from "react";

const { width, height } = Dimensions.get("window");
type Props = NativeStackScreenProps<any, "Premium">;

const PremiumScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [plans, setPlans] = useState<any[]>([]);

  const getImage = (imageName: string) => {
    switch (imageName) {
      case "rubber-duck.png":
        return require("../assets/icons/rubber-duck.png");
      case "mango.png":
        return require("../assets/icons/mango.png");
      case "shiny-diamond.png":
        return require("../assets/icons/shiny-diamond.png");
      default:
        return require("../assets/icons/logo.webp"); // fallback image
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get("/api/v1/users/premiumPlans");
        setPlans(response.data.data);
        console.log("Plans fetched successfully:", response.data.data); // Debug log
      } catch (error) {
        Alert.alert("Error", "Failed to fetch premium plans");
      }
    };

    fetchPlans();
  }, []);

  if (plans.length === 0) {
    return (
      <View style={styles.container}>
        <BackButton title="Kute Premium" />
        <Text style={{ color: "white", textAlign: "center", marginTop: 50 }}>
          Loading plans...
        </Text>
      </View>
    );
  }

  const handleSubscribe = async (planName: string) => {
    try {
      await api.post("/api/v1/users/premiumActivated", {
        ActivePremiumPlan: planName,
      });
      Alert.alert(
        "Success",
        `You have successfully subscribed to the ${planName} Plan!`
      );
    } catch (error) {
      Alert.alert("Error", `Failed to subscribe to the ${planName} Plan!`);
    }
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP));
    setSelectedIndex(index);
  };

  const CARD_WIDTH = 340;
  const CARD_HEIGHT = 540;
  const CARD_GAP = 20;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <BackButton title="Kute Premium" />
      <Text style={styles.unlockTitle}>Unlock the best of Kute</Text>
      <Text style={styles.unlockDesc}>See who likes you, boost your profile, and more.</Text>
      {/* Carousel */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <FlatList
          ref={flatListRef}
          data={plans}
          keyExtractor={(_, idx) => idx.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: (Dimensions.get('window').width - CARD_WIDTH) / 2 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          pagingEnabled
          renderItem={({ item, index }) => (
            <View style={[styles.planCardCarousel, { marginRight: index === plans.length - 1 ? 0 : CARD_GAP }]}>
              <View style={{ flexDirection: 'column', gap: 4 }}>
                <Text style={styles.planCardTitle}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={styles.planCardPrice}>{item.price}</Text>
                </View>
              </View>
              <Image source={getImage(item.image)} style={styles.planCardImageLarge} />
              <View style={{ flexDirection: 'column', gap: 6, marginTop: 8, flex: 1 }}>
                {item.features.map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Image
                      source={require("../assets/icons/check.png")}
                      style={styles.tickIcon}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.continueBtnBottom}
                onPress={() => handleSubscribe(item.name)}
              >
                <Text style={styles.continueBtnText}>Get Now</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        {/* Dot indicator */}
        <View style={styles.dotContainer}>
          {plans.map((_, idx) => (
            <View
              key={idx}
              style={[styles.dot, selectedIndex === idx && styles.dotActive]}
            />
          ))}
        </View>
      </View>
      <Text style={styles.renewalText}>
        Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period. You can manage your subscriptions and turn off auto-renewal by going to your Account Settings after purchase.
      </Text>
      <View style={styles.bottomLinks}>
        <TouchableOpacity style={styles.linkBtn}><Text style={styles.linkBtnText}>Terms of Service</Text></TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn}><Text style={styles.linkBtnText}>Privacy Policy</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    minHeight: '100%',
    paddingBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#211b12',
    padding: 16,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
  premiumTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  unlockTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  unlockDesc: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  planGrid: {
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  planCardWide: {
    display: 'none', // hide old style
  },
  planCardCarousel: {
    width: 340,
    height: 540,
    backgroundColor: '#32281b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#635036',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  planCardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  planCardPrice: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  planCardPer: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  planCardImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginVertical: 8,
  },
  planCardImageLarge: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginVertical: 16,
  },
  continueBtn: {
    backgroundColor: '#de822c',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 16,
    alignSelf: 'center',
  },
  continueBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  continueBtnBottom: {
    backgroundColor: '#de822c',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  tickIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
    tintColor: 'white',
  },
  featureText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '400',
  },
  renewalText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    opacity: 0.8,
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  linkBtn: {
    backgroundColor: '#463825',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginHorizontal: 4,
  },
  linkBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#635036',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#de822c',
    width: 18,
  },
});

export default PremiumScreen;
