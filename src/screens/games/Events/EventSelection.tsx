import React from 'react';
import { View, StyleSheet, Image, Dimensions, FlatList, Text, TouchableOpacity, ImageBackground } from 'react-native';
import BackButton from '../../../components/BackButton';
import { BlurView } from 'expo-blur';
import AppNavigation from '../../../navigation/AppNavigation';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width * 0.38; // Slightly less than half width for spacing
const IMAGE_HEIGHT = IMAGE_WIDTH * 16 / 9; // 9:16 aspect ratio
const SPACING = width * 0.05;

// Placeholder images (replace with your own images in assets/gameScreenImages)
const eventImages = [
    require('../../../../assets/gameScreenImages/chamber-of-secrets.png'),
    null, // Placeholder for user to add
    null, // Placeholder for user to add
    null, // Placeholder for user to add
];

// List of available images for blurred backgrounds
const BLUR_IMAGES = [
  require('../../../../assets/gameScreenImages/event-game-screen.png'),
  require('../../../../assets/gameScreenImages/truth-or-dare_orig.png'),
  require('../../../../assets/gameScreenImages/never-have-i-ever.png'),
  require('../../../../assets/gameScreenImages/couples-quiz.png'),
];

const renderImage = (img: any, idx: number, navigation: any) => (
  <TouchableOpacity
    key={idx}
    style={styles.imageContainer}
    activeOpacity={0.8}
    onPress={idx === 0 && img ? () => navigation.navigate('ChamberOfSecrets') : undefined}
    disabled={!(idx === 0 && img)}
  >
    {img ? (
      <Image
        source={img}
        style={styles.image}
        resizeMode="cover"
      />
    ) : (
      <View style={styles.image}>
        <Image
          source={BLUR_IMAGES[idx % BLUR_IMAGES.length]}
          style={styles.image}
          resizeMode="cover"
          blurRadius={18}
        />
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </BlurView>
      </View>
    )}
  </TouchableOpacity>
);

const chunkArray = (arr: any[], size: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
};

const EventSelection = () => {
    const navigation = useNavigation();
    // Split images into pages of 4
    const pages = chunkArray(eventImages, 4);

    return (
        <ImageBackground 
            source={require('../../../../assets/gameScreenImages/events-screen-dark-stone-bg.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.backButtonContainer}>
                <View style={styles.backButtonOverlay}>
                    <BackButton title="Events" />
                </View>
                <FlatList
                    data={pages}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.page}>
                            {/* 2x2 grid */}
                            <View style={styles.row}>
                                {renderImage(item[0], 0, navigation)}
                                {renderImage(item[1], 1, navigation)}
                            </View>
                            <View style={styles.row}>
                                {renderImage(item[2], 2, navigation)}
                                {renderImage(item[3], 3, navigation)}
                            </View>
                        </View>
                    )}
                />
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButtonContainer: {
        flex: 1,
    },
    backButtonOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Subtle dark overlay for visibility
        paddingBottom: 10,
    },
    page: {
        width,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent', // Make transparent to show background image
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: SPACING,
    },
    imageContainer: {
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        marginHorizontal: SPACING / 2,
        marginVertical: SPACING / 2,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#23262F',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
        backgroundColor: '#23262F',
    },
    placeholder: {
        borderWidth: 2,
        borderColor: '#444',
        backgroundColor: '#23262F',
        opacity: 0.5,
    },
    comingSoonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    comingSoonText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
        opacity: 0.95,
    },
});

export default EventSelection;
