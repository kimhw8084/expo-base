import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const root = resolve(import.meta.dirname, '..');
const iosRoot = join(root, 'apps', 'reference', 'ios');
const projectName = 'ExpoBaseReference';
const testTargetName = 'ExpoBaseReferenceUITests';
const projectPath = join(iosRoot, `${projectName}.xcodeproj`, 'project.pbxproj');
const sourceDir = join(root, 'tests', 'native', 'ios');
const generatedTestDir = join(iosRoot, testTargetName);
const schemeDir = join(iosRoot, `${projectName}.xcodeproj`, 'xcshareddata', 'xcschemes');
const schemePath = join(schemeDir, `${testTargetName}.xcscheme`);

if (!existsSync(projectPath)) {
  throw new Error(`Generated iOS project not found at ${projectPath}. Run the repository prebuild first.`);
}
// Full Release certification recreates the ignored native project, so the generated
// UI-test target directory must exist before source files are copied into it.
mkdirSync(generatedTestDir, { recursive: true });

const require = createRequire(import.meta.url);
const xcode = require('xcode');
const project = xcode.project(projectPath);
project.parseSync();

const appTargetUuid = findTargetUuid(project, projectName);
const appTarget = appTargetUuid ? project.pbxNativeTargetSection()[appTargetUuid] : null;
if (!appTarget) throw new Error(`Could not find native application target ${projectName}.`);

let testTargetUuid = findTargetUuid(project, testTargetName);
if (!testTargetUuid) {
  const addedTarget = project.addTarget(
    testTargetName,
    'unit_test_bundle',
    testTargetName,
    'com.expobase.reference.uitests',
  );
  testTargetUuid = addedTarget.uuid;
  const nativeTarget = project.pbxNativeTargetSection()[testTargetUuid];
  nativeTarget.productType = '"com.apple.product-type.bundle.ui-testing"';

  // xcode's generic target helper adds the new target as an app dependency.
  // A UI-test bundle is a consumer of the app, not a product dependency of it.
  const appNativeTarget = project.pbxNativeTargetSection()[appTargetUuid];
  appNativeTarget.dependencies = (appNativeTarget.dependencies ?? []).filter((entry) => entry.value !== testTargetUuid);
  project.addTargetAttribute('TestTargetID', appTargetUuid, { uuid: testTargetUuid });

  project.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', testTargetUuid);
  project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', testTargetUuid);
  project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', testTargetUuid);

  const mainGroup = project.getFirstProject().firstProject.mainGroup;
  const testGroup = project.pbxCreateGroup(testTargetName, testTargetName);
  project.addToPbxGroup(testGroup, mainGroup);
  for (const sourceName of nativeTestSources()) project.addSourceFile(sourceName, { target: testTargetUuid }, testGroup);
  project.addFramework('XCTest.framework', { target: testTargetUuid });
}

const nativeTarget = project.pbxNativeTargetSection()[testTargetUuid];
for (const [fileUuid, fileReference] of Object.entries(project.pbxFileReferenceSection())) {
  if (fileUuid.endsWith('_comment') || !fileReference || typeof fileReference !== 'object') continue;
  const fileName = String(fileReference.name ?? '').replace(/^"|"$/g, '');
  if (!nativeTestSources().includes(fileName)) continue;
  fileReference.name = fileName;
  fileReference.path = fileName;
}

const testGroup = findGroupUuid(project, testTargetName);
if (testGroup) {
  const references = project.pbxFileReferenceSection();
  for (const sourceName of nativeTestSources()) {
    const generatedSourcePath = join(generatedTestDir, sourceName);
    copyFileSync(join(sourceDir, sourceName), generatedSourcePath);
    const alreadyInProject = Object.values(references).some((reference) => reference && typeof reference === 'object' && String(reference.path ?? '').replace(/^"|"$/g, '') === sourceName);
    if (!alreadyInProject) project.addSourceFile(sourceName, { target: testTargetUuid }, testGroup);
  }
}
const productReference = project.pbxFileReferenceSection()[nativeTarget.productReference];
if (productReference) {
  productReference.name = `${testTargetName}.xctest`;
  productReference.path = `${testTargetName}.xctest`;
  productReference.explicitFileType = '"wrapper.cfbundle"';
  delete productReference.lastKnownFileType;
  nativeTarget.productReference_comment = `${testTargetName}.xctest`;
  const productsGroup = project.pbxGroupByName('Products');
  for (const child of productsGroup?.children ?? []) {
    if (child.value === nativeTarget.productReference) child.comment = `${testTargetName}.xctest`;
  }
  for (const buildFile of Object.values(project.pbxBuildFileSection())) {
    if (buildFile && typeof buildFile === 'object' && buildFile.fileRef === nativeTarget.productReference) {
      buildFile.fileRef_comment = `${testTargetName}.xctest`;
    }
  }
}
const configurationLists = project.pbxXCConfigurationList();
for (const [listUuid, list] of Object.entries(configurationLists)) {
  if (listUuid.endsWith('_comment') || !list || typeof list !== 'object' || listUuid !== nativeTarget.buildConfigurationList) continue;
  for (const configuration of list.buildConfigurations ?? []) {
    const settings = project.pbxXCBuildConfigurationSection()[configuration.value].buildSettings;
    delete settings.INFOPLIST_FILE;
    Object.assign(settings, {
      PRODUCT_BUNDLE_IDENTIFIER: 'com.expobase.reference.uitests',
      PRODUCT_NAME: testTargetName,
      GENERATE_INFOPLIST_FILE: 'YES',
      SWIFT_VERSION: '5.0',
      TEST_TARGET_NAME: projectName,
      CODE_SIGNING_ALLOWED: 'NO',
      CODE_SIGNING_REQUIRED: 'NO',
      TARGETED_DEVICE_FAMILY: '1',
    });
  }
}

mkdirSync(schemeDir, { recursive: true });
writeFileSync(schemePath, renderScheme({ appTargetUuid, testTargetUuid }));
writeFileSync(projectPath, project.writeSync());

console.log(`Generated ${testTargetName} in ${projectName}.xcodeproj`);

function nativeTestSources() {
  return readdirSync(sourceDir).filter((fileName) => fileName.endsWith('.swift')).sort();
}

function findGroupUuid(xcodeProject, groupName) {
  const groups = xcodeProject.hash.project.objects.PBXGroup ?? {};
  for (const [uuid, group] of Object.entries(groups)) {
    if (uuid.endsWith('_comment') || !group || typeof group !== 'object') continue;
    const name = String(group.name ?? '').replace(/^"|"$/g, '');
    if (name === groupName) return uuid;
  }
  return null;
}

function findTargetUuid(xcodeProject, targetName) {
  const section = xcodeProject.pbxNativeTargetSection();
  for (const [uuid, target] of Object.entries(section)) {
    if (uuid.endsWith('_comment')) continue;
    const normalized = String(target.name ?? '').replace(/^"|"$/g, '');
    if (normalized === targetName) return uuid;
  }
  return null;
}

function renderScheme({ appTargetUuid, testTargetUuid }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="2660" version="1.7">
  <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES">
    <BuildActionEntries>
      <BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">
        <BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="${appTargetUuid}" BuildableName="${projectName}.app" BlueprintName="${projectName}" ReferencedContainer="container:${projectName}.xcodeproj"/>
      </BuildActionEntry>
      <BuildActionEntry buildForTesting="YES" buildForRunning="NO" buildForProfiling="NO" buildForArchiving="NO" buildForAnalyzing="YES">
        <BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="${testTargetUuid}" BuildableName="${testTargetName}.xctest" BlueprintName="${testTargetName}" ReferencedContainer="container:${projectName}.xcodeproj"/>
      </BuildActionEntry>
    </BuildActionEntries>
  </BuildAction>
  <TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.DebuggerFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES" codeCoverageEnabled="NO" disableMainThreadChecker="YES">
    <Testables>
      <TestableReference skipped="NO">
        <BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="${testTargetUuid}" BuildableName="${testTargetName}.xctest" BlueprintName="${testTargetName}" ReferencedContainer="container:${projectName}.xcodeproj"/>
      </TestableReference>
    </Testables>
    <MacroExpansion>
      <BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="${appTargetUuid}" BuildableName="${projectName}.app" BlueprintName="${projectName}" ReferencedContainer="container:${projectName}.xcodeproj"/>
    </MacroExpansion>
  </TestAction>
  <LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.DebuggerFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" debugServiceExtension="internal" allowLocationSimulation="YES">
    <BuildableProductRunnable runnableDebuggingMode="0">
      <BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="${appTargetUuid}" BuildableName="${projectName}.app" BlueprintName="${projectName}" ReferencedContainer="container:${projectName}.xcodeproj"/>
    </BuildableProductRunnable>
  </LaunchAction>
  <ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES">
    <BuildableProductRunnable runnableDebuggingMode="0">
      <BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="${appTargetUuid}" BuildableName="${projectName}.app" BlueprintName="${projectName}" ReferencedContainer="container:${projectName}.xcodeproj"/>
    </BuildableProductRunnable>
  </ProfileAction>
  <AnalyzeAction buildConfiguration="Debug"/>
  <ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>
`;
}
