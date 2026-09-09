export const minimumNodeVersion = [22, 13, 0];
export const certificationNodeMajor = 22;

export function parseNodeVersion(value) {
  const match = String(value ?? '').match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) throw new Error(`Invalid Node.js version: ${value}`);
  return match.slice(1).map(Number);
}

export function isSupportedNodeVersion(value, { certification = false } = {}) {
  const [major, minor, patch] = parseNodeVersion(value);
  const [minimumMajor, minimumMinor, minimumPatch] = minimumNodeVersion;
  const meetsMinimum = major > minimumMajor
    || (major === minimumMajor && minor > minimumMinor)
    || (major === minimumMajor && minor === minimumMinor && patch >= minimumPatch);
  return meetsMinimum && (!certification || major === certificationNodeMajor);
}
