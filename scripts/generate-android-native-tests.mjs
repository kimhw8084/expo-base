import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourcePath = join(root, 'tests', 'native', 'android', 'ExpoBaseAndroidNativeTest.java');
const androidDir = join(root, 'apps', 'reference', 'android');
const testRelativePath = join('app', 'src', 'androidTest', 'java', 'com', 'expobase', 'reference', 'certification', 'ExpoBaseAndroidNativeTest.java');

export function prepareAndroidNativeTests(projectDir = androidDir, sourceFile = sourcePath) {
  const gradlePath = join(projectDir, 'app', 'build.gradle');
  if (!existsSync(gradlePath)) throw new Error(`Generated Android application module not found at ${gradlePath}. Run fresh Expo CNG prebuild first.`);
  if (!existsSync(sourceFile)) throw new Error(`Repository-owned Android instrumentation source is missing at ${sourceFile}.`);

  let gradle = readFileSync(gradlePath, 'utf8');
  const runnerLine = '        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"';
  if (!gradle.includes("applicationId 'com.expobase.reference'")) throw new Error('Generated Android package identity is not com.expobase.reference.');
  if (!gradle.includes('defaultConfig {')) throw new Error('Generated Android app module has no defaultConfig block.');
  const existingRunner = gradle.match(/testInstrumentationRunner\s+["']([^"']+)["']/)?.[1];
  if (existingRunner && existingRunner !== 'androidx.test.runner.AndroidJUnitRunner') throw new Error(`Generated Android app uses unsupported instrumentation runner ${existingRunner}.`);
  if (!existingRunner) {
    gradle = gradle.replace('defaultConfig {', `defaultConfig {\n${runnerLine}`);
  }
  const testBuildTypeLine = '    testBuildType "release"';
  const existingTestBuildType = gradle.match(/testBuildType\s+["']([^"']+)["']/)?.[1];
  if (existingTestBuildType && existingTestBuildType !== 'release') throw new Error(`Generated Android app uses unsupported testBuildType ${existingTestBuildType}.`);
  if (!existingTestBuildType) {
    if (!gradle.includes('android {')) throw new Error('Generated Android app module has no android block.');
    gradle = gradle.replace('android {', `android {\n${testBuildTypeLine}`);
  }

  const instrumentationDependencies = [
    '    androidTestImplementation("androidx.test:runner:1.6.2")',
    '    androidTestImplementation("androidx.test.ext:junit:1.2.1")',
    '    androidTestImplementation("androidx.test.uiautomator:uiautomator:2.3.0")',
  ];
  for (const line of instrumentationDependencies) {
    const coordinate = line.match(/"([^"]+)"/)?.[1];
    const artifact = coordinate?.split(':').slice(0, 2).join(':');
    const existingCoordinate = artifact && gradle.match(new RegExp(`androidTestImplementation\\s*\\(?["'](${artifact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:[^"']+)["']`))?.[1];
    if (existingCoordinate && existingCoordinate !== coordinate) throw new Error(`Generated Android project pins ${existingCoordinate}; expected ${coordinate}.`);
  }
  const missingDependencies = instrumentationDependencies.filter((line) => !gradle.includes(line));
  if (missingDependencies.length) {
    const dependenciesStart = gradle.lastIndexOf('\ndependencies {');
    if (dependenciesStart < 0 || !gradle.trimEnd().endsWith('}')) throw new Error('Could not locate the generated Android app dependencies block.');
    const finalBrace = gradle.lastIndexOf('}');
    gradle = `${gradle.slice(0, finalBrace)}${missingDependencies.join('\n')}\n${gradle.slice(finalBrace)}`;
  }

  const testDestination = join(projectDir, testRelativePath);
  mkdirSync(dirname(testDestination), { recursive: true });
  copyFileSync(sourceFile, testDestination);
  writeFileSync(gradlePath, gradle);
  return { gradlePath, testDestination, runner: 'androidx.test.runner.AndroidJUnitRunner', testBuildType: 'release' };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  try {
    const generated = prepareAndroidNativeTests();
    console.log(`Generated Android instrumentation test source at ${generated.testDestination}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
