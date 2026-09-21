const ANDROID_RUNTIME_TAG = /(?:^|\s)(?:[VDIWEF]\s+)?AndroidRuntime:/i;
const REACT_NATIVE_JS_ERROR = /ReactNativeJS:.*(?:Error|Invariant Violation|TypeError|uncaught|Unhandled)/i;
const TARGET_PROCESS = /\bProcess\s*:\s*/i;

function escapedRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsTargetPackage(line, packageName) {
  return line.includes(packageName);
}

function isTargetProcessLine(line, packageName) {
  const target = escapedRegExp(packageName);
  return containsTargetPackage(line, packageName) && TARGET_PROCESS.test(line) && new RegExp(`Process\\s*:\\s*${target}(?:[,\\s]|$)`, 'i').test(line);
}

function hasTargetFatalBlock(lines, start, packageName) {
  if (containsTargetPackage(lines[start], packageName)) return true;
  for (let index = start + 1; index < Math.min(lines.length, start + 20); index += 1) {
    const line = lines[index];
    if (isTargetProcessLine(line, packageName)) return true;
    if (index > start + 1 && /FATAL EXCEPTION/i.test(line)) break;
    if (index > start + 1 && line.trim() && !ANDROID_RUNTIME_TAG.test(line) && !/^\s*(?:Process|java\.|Caused by:|at\s)/i.test(line)) break;
  }
  return false;
}

export function detectAndroidRuntimeFailures(log, { packageName = 'com.expobase.reference' } = {}) {
  const lines = String(log).split(/\r?\n/);
  const failures = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (/instrumentation.*failed/i.test(line)) {
      failures.push(line);
      continue;
    }
    if (/ANR in |Application Not Responding/i.test(line) && (containsTargetPackage(line, packageName) || isTargetProcessLine(line, packageName))) {
      failures.push(line);
      continue;
    }
    if (/FATAL EXCEPTION|AndroidRuntime:.*(?:FATAL|Exception)/i.test(line) && hasTargetFatalBlock(lines, index, packageName)) {
      failures.push(line);
      continue;
    }
    if (REACT_NATIVE_JS_ERROR.test(line) && (containsTargetPackage(line, packageName) || /ReactNativeJS:/i.test(line))) {
      failures.push(line);
      continue;
    }
    if (/uncaught exception/i.test(line) && containsTargetPackage(line, packageName)) failures.push(line);
  }
  return failures;
}

export function isCertificationReleaseMode(mode) {
  return mode === 'release';
}

export function artifactRelativePath(root, file) {
  const normalizedRoot = root.endsWith('/') ? root : `${root}/`;
  return file.startsWith(normalizedRoot) ? file.slice(normalizedRoot.length) : file;
}

export function formatAndroidEvidenceCollectionErrors(errors = []) {
  return errors.length ? ` Evidence collection incomplete: ${errors.join('; ')}` : '';
}

export function primaryAndroidCertificationFailure({ gradleStatus, fallbackFailure, evidenceCollectionErrors = [] }) {
  const evidenceSummary = formatAndroidEvidenceCollectionErrors(evidenceCollectionErrors);
  return gradleStatus !== null && gradleStatus !== 0
    ? `Android instrumentation failed with exit ${gradleStatus}.${evidenceSummary}`
    : `${fallbackFailure}${evidenceSummary}`;
}
