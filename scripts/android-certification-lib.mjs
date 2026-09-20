export const ANDROID_FAILURE_PATTERNS = [
  /FATAL EXCEPTION/i,
  /AndroidRuntime:.*(?:FATAL|Exception)/i,
  /ANR in /i,
  /Application Not Responding/i,
  /ReactNativeJS:.*(?:Error|Invariant Violation|TypeError)/i,
  /uncaught exception/i,
  /instrumentation.*failed/i,
];

export function detectAndroidRuntimeFailures(log) {
  return String(log)
    .split(/\r?\n/)
    .filter((line) => ANDROID_FAILURE_PATTERNS.some((pattern) => pattern.test(line)));
}

export function isCertificationReleaseMode(mode) {
  return mode === 'release';
}

export function artifactRelativePath(root, file) {
  const normalizedRoot = root.endsWith('/') ? root : `${root}/`;
  return file.startsWith(normalizedRoot) ? file.slice(normalizedRoot.length) : file;
}
