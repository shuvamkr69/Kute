const fs = require('fs');
const path = require('path');

// Function to recursively find all AndroidManifest.xml files with package attributes
function findManifestsWithPackages(dir, results = []) {
    if (!fs.existsSync(dir)) return results;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        
        let stat;
        try {
            stat = fs.statSync(filePath);
        } catch (err) {
            continue; // Skip files we can't stat
        }
        
        if (stat.isDirectory() && !file.startsWith('.')) {
            findManifestsWithPackages(filePath, results);
        } else if (file === 'AndroidManifest.xml') {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes('package="')) {
                    results.push(filePath);
                }
            } catch (err) {
                // Ignore read errors
            }
        }
    }
    
    return results;
}

// Function to extract package name from manifest
function extractPackageName(manifestPath) {
    const content = fs.readFileSync(manifestPath, 'utf8');
    const match = content.match(/package="([^"]*)"/);
    return match ? match[1] : null;
}

// Function to fix manifest
function fixManifest(manifestPath) {
    let content = fs.readFileSync(manifestPath, 'utf8');
    const packageRegex = /package="[^"]*"\s*/g;
    
    if (packageRegex.test(content)) {
        content = content.replace(packageRegex, '');
        content = content.replace(/\n\s*\n\s*>/g, '\n>');
        fs.writeFileSync(manifestPath, content);
        return true;
    }
    return false;
}

// Function to find corresponding build.gradle
function findBuildGradle(manifestPath) {
    const dir = path.dirname(path.dirname(path.dirname(manifestPath))); // Go up from src/main/AndroidManifest.xml
    const buildGradlePath = path.join(dir, 'build.gradle');
    return fs.existsSync(buildGradlePath) ? buildGradlePath : null;
}

// Function to add namespace to build.gradle
function addNamespace(buildGradlePath, namespace) {
    let content = fs.readFileSync(buildGradlePath, 'utf8');
    
    if (content.includes('namespace =') || content.includes('namespace=')) {
        return false;
    }
    
    const androidBlockRegex = /(android\s*\{\s*)([\s\S]*?)(compileSdkVersion|buildToolsVersion|defaultConfig)/;
    const match = content.match(androidBlockRegex);
    
    if (match) {
        const replacement = `${match[1]}namespace = '${namespace}'\n  ${match[3]}`;
        content = content.replace(androidBlockRegex, replacement);
        fs.writeFileSync(buildGradlePath, content);
        return true;
    }
    return false;
}

console.log('Scanning for AndroidManifest.xml files with package attributes...');

const nodeModulesPath = 'node_modules';
const manifestsWithPackages = findManifestsWithPackages(nodeModulesPath);

console.log(`Found ${manifestsWithPackages.length} manifests with package attributes:`);

let fixedCount = 0;

manifestsWithPackages.forEach(manifestPath => {
    const packageName = extractPackageName(manifestPath);
    const buildGradlePath = findBuildGradle(manifestPath);
    
    console.log(`\nFixing: ${manifestPath}`);
    console.log(`Package: ${packageName}`);
    console.log(`Build.gradle: ${buildGradlePath || 'NOT FOUND'}`);
    
    if (fixManifest(manifestPath)) {
        console.log('✓ Fixed manifest');
        fixedCount++;
    }
    
    if (buildGradlePath && packageName && addNamespace(buildGradlePath, packageName)) {
        console.log('✓ Added namespace to build.gradle');
        fixedCount++;
    }
});

console.log(`\nFixed ${fixedCount} files total.`);
console.log('All Android manifest fixes completed!');
