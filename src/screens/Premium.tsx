import React, { useRef, useState } from "react";
import { Image, ScrollView } from "react-native";
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
        return require("../assets/icons/logo.png"); // fallback image
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get("/api/v1/users/premiumPlans");
        setPlans(response.data.data);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch premium plans");
      }
    };

    fetchPlans();
  }, []);

  if (plans.length === 0) {
    return (
      <View style={styles.container}>
        <BackButton title="Become a Kute-T" />
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

  const renderCarouselItem = ({ item, index }: any) => {
    const inputRange = [
      (index - 1) * width * 0.65,
      index * width * 0.65,
      (index + 1) * width * 0.65,
    ];

    const rotate = scrollX.interpolate({
      inputRange,
      outputRange: ["10deg", "0deg", "-10deg"],
      extrapolate: "clamp",
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1.05, 0.85],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: "clamp",
    });

    const isSelected = selectedIndex === index;

    const handleCardPress = () => {
      flatListRef.current?.scrollToOffset({
        offset: index * width * 0.65,
        animated: true,
      });
      setSelectedIndex(index);
    };

    return (
      <Pressable onPress={handleCardPress}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ rotate }, { scale }],
              opacity,
              borderColor: isSelected ? "#5de383" : "white",
              shadowOpacity: isSelected ? 0.6 : 0.2,
              elevation: isSelected ? 10 : 4,
            },
          ]}
        >
          <Text style={styles.planName}>{item.name}</Text>
          <Image source={getImage(item.image)} style={styles.planImage} />
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <BackButton title="Become a Kute-T" />

      <View style={styles.upperSection}>
        <View style={styles.planDetailsBox}>
          <Text style={styles.selectedPlanTitle}>
            {plans[selectedIndex].name}
          </Text>
          <Text style={styles.selectedPlanPrice}>
            {plans[selectedIndex].price}
          </Text>

          <View style={styles.featureScrollContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {plans[selectedIndex].features.map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <Image
                    source={require("../assets/icons/check.png")}
                    style={styles.tickIcon}
                  />
                  <Text style={styles.feature}>{feature}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      <View style={styles.carouselContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={plans}
          keyExtractor={(_, i) => i.toString()}
          horizontal
          pagingEnabled={false}
          snapToInterval={width * 0.65}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: (width - width * 0.65) / 2,
            alignItems: "center",
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: false,
              listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / (width * 0.65)
                );
                setSelectedIndex(index);
              },
            }
          )}
          renderItem={renderCarouselItem}
        />
      </View>

      <CustomButton
        title={`Subscribe`}
        onPress={() => handleSubscribe(plans[selectedIndex].name)}
        style={styles.subscribeButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  planDetailsBox: {
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 24,
    height: "100%",
    alignItems: "center", // Centers horizontally
    justifyContent: "center", // Centers vertically
    shadowColor: "black",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
  },
  featureScrollContainer: {
    maxHeight: height * 0.15, // or adjust to how much you want visible
    width: "100%",
    paddingTop: 10,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // centers the row as a whole
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  feature: {
    color: "#C0C0C0",
    fontSize: 13,
    textAlign: "left", // keep it left-aligned next to the icon
  },
  
  
  selectedPlanTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#5de383",
    marginBottom: 12,
  },
  selectedPlanPrice: {
    fontSize: 22,
    color: "white",
    marginBottom: 16,
    fontWeight: "700",
  },
  upperSection: {
    height: height * 0.43, // was 0.35
    paddingHorizontal: 20,
    justifyContent: "flex-end",
  },
  
  carouselContainer: {
    height: height * 0.35,
    justifyContent: "center",
    marginTop: 30, // was 70 before, reduced to make it sit just below the box
  },
  card: {
    width: width * 0.6,
    height: height * 0.29,
    backgroundColor: "#2E2E2E",
    borderRadius: 24,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderWidth: 2,
    shadowColor: "black",
    marginBottom: 20,
  },
  planName: {
    fontSize: 27,
    fontWeight: "800",
    color: "#E0E0E0",
  },
  planPrice: {
    fontSize: 18,
    color: "white",
    marginTop: 10,
  },
  subscribeButton: {
    backgroundColor: "#5de383",
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
    width: "100%",
  },
  
  tickIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    resizeMode: "contain",
  },
  
  
  planImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginTop: 12,
  },
});

export default PremiumScreen;
