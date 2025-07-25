const fs = require('fs');
const path = require('path');

// Function to fix Android manifest files by removing package attribute
function fixManifest(manifestPath) {
    if (!fs.existsSync(manifestPath)) return false;
    
    let content = fs.readFileSync(manifestPath, 'utf8');
    const packageRegex = /package="[^"]*"\s*/g;
    
    if (packageRegex.test(content)) {
        content = content.replace(packageRegex, '');
        // Clean up any extra whitespace or newlines
        content = content.replace(/\n\s*\n\s*>/g, '\n>');
        fs.writeFileSync(manifestPath, content);
        console.log(`Fixed: ${manifestPath}`);
        return true;
    }
    return false;
}

// Function to add namespace to build.gradle files
function addNamespace(buildGradlePath, namespace) {
    if (!fs.existsSync(buildGradlePath)) return false;
    
    let content = fs.readFileSync(buildGradlePath, 'utf8');
    
    // Check if namespace already exists
    if (content.includes('namespace =') || content.includes('namespace=')) {
        return false;
    }
    
    // Find android block and add namespace
    const androidBlockRegex = /(android\s*\{\s*)([\s\S]*?)(compileSdkVersion|buildToolsVersion|defaultConfig)/;
    const match = content.match(androidBlockRegex);
    
    if (match) {
        const replacement = `${match[1]}namespace = '${namespace}'\n  ${match[3]}`;
        content = content.replace(androidBlockRegex, replacement);
        fs.writeFileSync(buildGradlePath, content);
        console.log(`Added namespace to: ${buildGradlePath}`);
        return true;
    }
    return false;
}

// List of known React Native modules that might need fixing
const modulesToFix = [
    {
        path: 'node_modules/@react-native-masked-view/masked-view/android',
        namespace: 'org.reactnative.maskedview'
    },
    {
        path: 'node_modules/react-native-linear-gradient/android',
        namespace: 'com.BV.LinearGradient'
    },
    {
        path: 'node_modules/react-native-maps/android',
        namespace: 'com.rnmaps.maps'
    },
    {
        path: 'node_modules/react-native-gesture-handler/android',
        namespace: 'com.swmansion.gesturehandler'
    },
    {
        path: 'node_modules/react-native-reanimated/android',
        namespace: 'com.swmansion.reanimated'
    },
    {
        path: 'node_modules/react-native-safe-area-context/android',
        namespace: 'com.th3rdwave.safeareacontext'
    },
    {
        path: 'node_modules/react-native-screens/android',
        namespace: 'com.swmansion.rnscreens'
    },
    {
        path: 'node_modules/react-native-svg/android',
        namespace: 'com.horcrux.svg'
    },
    {
        path: 'node_modules/react-native-video/android',
        namespace: 'com.brentvatne.react'
    },
    {
        path: 'node_modules/react-native-webview/android',
        namespace: 'com.reactnativecommunity.webview'
    },
    {
        path: 'node_modules/react-native-geolocation-service/android',
        namespace: 'com.agontuk.RNFusedLocation'
    },
    {
        path: 'node_modules/react-native-deck-swiper/android',
        namespace: 'com.weebly.react.swiper'
    },
    {
        path: 'node_modules/react-native-draggable-flatlist/android',
        namespace: 'com.havenaninteractivellc.reactnativedraggableflatlist'
    }
];

console.log('Starting Android manifest fixes...');

let fixedCount = 0;

modulesToFix.forEach(module => {
    const manifestPath = path.join(module.path, 'src/main/AndroidManifest.xml');
    const buildGradlePath = path.join(module.path, 'build.gradle');
    
    if (fixManifest(manifestPath)) {
        fixedCount++;
    }
    
    if (addNamespace(buildGradlePath, module.namespace)) {
        fixedCount++;
    }
});

console.log(`\nFixed ${fixedCount} files.`);
console.log('Android manifest fixes completed!');
