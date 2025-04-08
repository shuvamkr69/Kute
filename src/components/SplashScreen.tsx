import React, { useEffect, useRef } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { Video, ResizeMode } from "expo-av"; // Import ResizeMode
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any, 'SplashScreen'>;

const SplashScreenComponent: React.FC<Props> = ({ navigation }) => {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (navigation) {
      setTimeout(() => {
        navigation.navigate("Home");
      }, 2000);
    }
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent"
        translucent={true}
      />
      
      <Video
        ref={videoRef}
        source={require("../assets/splashScreen/splashScreen.mp4")}
        style={styles.video}
        shouldPlay
        isLooping={false}
        onError={(error) => console.error("Video Error: ", error)}
        resizeMode={ResizeMode.COVER} // Use enum value
        rate={1.0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  video: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    height: '100%',
  },
});

export default SplashScreenComponent;