export function resolveAndroidProfile(manifest, requestedId) {
  const profiles = manifest?.profiles;
  if (!Array.isArray(profiles) || profiles.length === 0) throw new Error('Android certification manifest has no emulator profiles.');
  const ids = profiles.map((profile) => profile?.id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) throw new Error('Android certification profile IDs must be present and unique.');
  const selectedId = requestedId ?? profiles[0].id;
  const profile = profiles.find((candidate) => candidate.id === selectedId);
  if (!profile) throw new Error(`Unknown Android certification profile: ${selectedId}`);
  return profile;
}

export function validateAndroidDevice(profile, device) {
  const failures = [];
  if (device.apiLevel !== String(profile.apiLevel)) failures.push(`Emulator API ${device.apiLevel || '<missing>'} does not match profile API ${profile.apiLevel}.`);
  if (device.avdName !== profile.avdName) failures.push(`Emulator AVD ${device.avdName || '<missing>'} does not match ${profile.avdName}.`);
  if (normalizeProfileName(device.configuredDeviceProfile) !== normalizeProfileName(profile.deviceProfile)) failures.push(`AVD device profile ${device.configuredDeviceProfile || '<missing>'} does not match ${profile.deviceProfile}.`);
  if (normalizeProfileName(device.manufacturer) !== normalizeProfileName(profile.manufacturer)) failures.push(`Emulator manufacturer ${device.manufacturer || '<missing>'} does not match ${profile.manufacturer}.`);
  const expectedImage = profile.systemImage.replaceAll(';', '/');
  if (!device.configuredSystemImage?.includes(expectedImage)) failures.push(`AVD system image ${device.configuredSystemImage || '<missing>'} does not match ${profile.systemImage}.`);
  if (device.isEmulator !== '1') failures.push(`Connected target is not an Android emulator (ro.kernel.qemu=${device.isEmulator || '<missing>'}).`);
  if (device.cpuAbi !== profile.architecture) failures.push(`Emulator ABI ${device.cpuAbi || '<missing>'} does not match ${profile.architecture}.`);
  if (!device.locale) failures.push('Android system locale could not be established.');
  else if (!device.locale.split(',').includes(profile.locale)) failures.push(`Emulator locale ${device.locale} does not include ${profile.locale}.`);
  return failures;
}

export function parseAvdConfigIdentity(configText) {
  return {
    configuredDeviceProfile: readAvdProperty(configText, 'hw.device.name'),
    configuredSystemImage: readAvdProperty(configText, 'image.sysdir.1'),
  };
}

export function resolveAndroidLocale({ persistedLocale, systemLocales, productLocale }) {
  const candidates = [persistedLocale, systemLocales, productLocale];
  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim();
    if (!value || value.toLowerCase() === 'null') continue;
    const firstLocale = value.split(',').map((locale) => locale.trim()).find(Boolean);
    if (firstLocale) return firstLocale;
  }
  return '';
}

export function ensureGradleMetaspace(properties, minimumMetaspaceMb) {
  if (!Number.isInteger(minimumMetaspaceMb) || minimumMetaspaceMb < 1) throw new Error('Gradle minimum metaspace must be a positive integer in megabytes.');
  const jvmArgs = properties.match(/^org\.gradle\.jvmargs=(.*)$/m);
  if (!jvmArgs) throw new Error('Fresh CNG gradle.properties has no org.gradle.jvmargs setting.');
  const size = jvmArgs[1].match(/(?:^|\s)-XX:MaxMetaspaceSize=(\d+)([kmg])(?=\s|$)/i);
  if (!size) throw new Error('Fresh CNG org.gradle.jvmargs has no explicit MaxMetaspaceSize limit.');
  const value = Number(size[1]);
  const unit = size[2].toLowerCase();
  const currentMetaspaceMb = unit === 'g' ? value * 1024 : unit === 'k' ? value / 1024 : value;
  if (currentMetaspaceMb >= minimumMetaspaceMb) return { properties, metaspaceMb: currentMetaspaceMb };
  const configuredArgs = jvmArgs[1].replace(size[0].trim(), `-XX:MaxMetaspaceSize=${minimumMetaspaceMb}m`);
  return {
    properties: properties.replace(jvmArgs[0], `org.gradle.jvmargs=${configuredArgs}`),
    metaspaceMb: minimumMetaspaceMb,
  };
}

export function parseJUnitReports(reports) {
  const totals = { tests: 0, failures: 0, errors: 0, skipped: 0, cases: [], failureDetails: [], errorDetails: [], skippedCases: [], reportCount: reports.length };
  for (const report of reports) {
    const suites = [...report.matchAll(/<testsuite\b([^>]*)>/g)].map((match) => match[1]);
    if (suites.length === 0) throw new Error('Instrumentation JUnit report contains no testsuite element.');
    for (const attributes of suites) {
      totals.tests += Number(readAttribute(attributes, 'tests') ?? 0);
      totals.failures += Number(readAttribute(attributes, 'failures') ?? 0);
      totals.errors += Number(readAttribute(attributes, 'errors') ?? 0);
      totals.skipped += Number(readAttribute(attributes, 'skipped') ?? 0);
    }
    const testcasePattern = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
    for (const match of report.matchAll(testcasePattern)) {
      const testCase = { name: readAttribute(match[1], 'name'), className: readAttribute(match[1], 'classname') };
      totals.cases.push(testCase);
      const body = match[2] ?? '';
      for (const [tag, destination] of [['failure', totals.failureDetails], ['error', totals.errorDetails]]) {
        for (const outcome of body.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>|<${tag}\\b([^>]*)\\s*/>`, 'g'))) {
          const attributes = outcome[1] ?? outcome[3] ?? '';
          destination.push({ ...testCase, message: readAttribute(attributes, 'message') ?? null, details: outcome[2]?.trim() ?? '' });
        }
      }
      if (/<skipped\b/.test(body)) totals.skippedCases.push(testCase);
    }
  }
  return totals;
}

export function classifyAndroidRun({
  buildExitCode,
  junitReports,
  expectedTests,
  logcat = '',
  identityErrors = [],
  missingEvidence = [],
}) {
  const failures = [];
  const junit = junitReports.length ? parseJUnitReports(junitReports) : { tests: 0, failures: 0, errors: 0, skipped: 0, cases: [], failureDetails: [], errorDetails: [], skippedCases: [], reportCount: 0 };
  if (buildExitCode !== 0) failures.push({ layer: 'android-build-or-instrumentation', reason: `Gradle exited with status ${buildExitCode}.` });
  if (junit.reportCount === 0) failures.push({ layer: 'evidence-extraction', reason: 'No Android instrumentation JUnit XML was produced.' });
  if (junit.tests !== expectedTests.length) failures.push({ layer: 'evidence-extraction', reason: `JUnit reported ${junit.tests} tests; ${expectedTests.length} were required.` });
  const caseNames = new Set(junit.cases.map((testCase) => testCase.name));
  const missingTests = expectedTests.filter((name) => !caseNames.has(name));
  if (missingTests.length) failures.push({ layer: 'evidence-extraction', reason: `JUnit omitted required tests: ${missingTests.join(', ')}.` });
  if (junit.failures || junit.errors || junit.skipped) {
    failures.push({ layer: 'instrumentation', reason: `JUnit failures=${junit.failures}, errors=${junit.errors}, skipped=${junit.skipped}.` });
  }
  const crashMarkers = logcat.match(/FATAL EXCEPTION|ANR in |Application Not Responding|(?:^|\s)E\s+ReactNativeJS:\s*[^\n]*(?:Error|Unhandled|Exception|Invariant Violation)|ReactNativeJS:\s*Unhandled JS Exception/gi) ?? [];
  if (crashMarkers.length) failures.push({ layer: 'runtime-crash-or-anr', reason: `Logcat contains ${crashMarkers.length} fatal, ANR, or uncaught React Native error marker(s).` });
  if (identityErrors.length) failures.push(...identityErrors.map((reason) => ({ layer: 'evidence-identity', reason })));
  if (missingEvidence.length) failures.push(...missingEvidence.map((path) => ({ layer: 'evidence-extraction', reason: `Required evidence is missing: ${path}.` })));
  return {
    passed: failures.length === 0,
    failures,
    junit,
    crashDisposition: crashMarkers.length ? 'failed-fatal-or-anr-marker-present' : 'no-fatal-exception-anr-or-uncaught-js-marker',
  };
}

function readAttribute(attributes, name) {
  const match = attributes.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`));
  return match?.[1];
}

function normalizeProfileName(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function readAvdProperty(configText, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = configText.match(new RegExp(`^\\s*${escapedName}\\s*[=:]\\s*(.*?)\\s*$`, 'm'));
  return match?.[1]?.trim() || null;
}
