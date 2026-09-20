import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const androidRoot = join(root, 'apps', 'reference', 'android');
const appGradle = join(androidRoot, 'app', 'build.gradle');
const sourceDir = join(root, 'tests', 'native', 'android');
const packagePath = join(androidRoot, 'app', 'src', 'androidTest', 'java', 'com', 'expobase', 'reference');
const dependencyMarker = '// Expo Base Android native certification dependencies';
const runnerMarker = '// Expo Base Android native certification runner';
const releaseBuildMarker = '// Expo Base Android native certification release test build';

if (!existsSync(appGradle)) {
  throw new Error(`Generated Android project not found at ${appGradle}. Run Expo prebuild --platform android --clean first.`);
}

const sourceFiles = readdirSync(sourceDir).filter((file) => file.endsWith('.java')).sort();
if (sourceFiles.length === 0) throw new Error(`No first-party Android instrumentation sources found in ${sourceDir}.`);
mkdirSync(packagePath, { recursive: true });
for (const sourceFile of sourceFiles) copyFileSync(join(sourceDir, sourceFile), join(packagePath, sourceFile));

let gradle = readFileSync(appGradle, 'utf8');
if (!gradle.includes(dependencyMarker)) {
  const dependencies = `${dependencyMarker}\n  androidTestImplementation 'androidx.test.ext:junit:1.2.1'\n  androidTestImplementation 'androidx.test:runner:1.6.2'\n  androidTestImplementation 'androidx.test:rules:1.6.1'\n  androidTestImplementation 'androidx.test.uiautomator:uiautomator:2.3.0'\n`;
  const dependencyIndex = gradle.indexOf('dependencies {');
  if (dependencyIndex === -1) throw new Error(`Could not find dependencies block in ${appGradle}.`);
  const insertionPoint = dependencyIndex + 'dependencies {'.length;
  gradle = `${gradle.slice(0, insertionPoint)}\n${dependencies}${gradle.slice(insertionPoint)}`;
}
if (!gradle.includes(runnerMarker)) {
  const runnerConfig = `${runnerMarker}\n    testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"\n`;
  const defaultConfigIndex = gradle.indexOf('defaultConfig {');
  if (defaultConfigIndex === -1) throw new Error(`Could not find defaultConfig block in ${appGradle}.`);
  const insertionPoint = defaultConfigIndex + 'defaultConfig {'.length;
  gradle = `${gradle.slice(0, insertionPoint)}\n${runnerConfig}${gradle.slice(insertionPoint)}`;
}
if (!gradle.includes(releaseBuildMarker)) {
  const releaseConfig = `${releaseBuildMarker}\n  testBuildType "release"\n`;
  const androidIndex = gradle.indexOf('android {');
  if (androidIndex === -1) throw new Error(`Could not find android block in ${appGradle}.`);
  const insertionPoint = androidIndex + 'android {'.length;
  gradle = `${gradle.slice(0, insertionPoint)}\n${releaseConfig}${gradle.slice(insertionPoint)}`;
}
writeFileSync(appGradle, gradle);

console.log(`Generated Android instrumentation sources (${sourceFiles.join(', ')}) and release runner configuration.`);
