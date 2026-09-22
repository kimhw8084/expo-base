import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function loadCertificationProfile(root = resolve(import.meta.dirname, '..')) {
  const manifest = JSON.parse(readFileSync(join(root, 'android.certification.json'), 'utf8'));
  return { manifest, profile: manifest.profiles[0] };
}

export function parseAdbDevices(output) {
  return String(output)
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [serial, state, ...details] = line.split(/\s+/);
      const properties = Object.fromEntries(details.map((detail) => {
        const separator = detail.indexOf(':');
        return separator === -1 ? [detail, true] : [detail.slice(0, separator), detail.slice(separator + 1)];
      }));
      return { serial, state, properties, isEmulator: serial?.startsWith('emulator-') };
    });
}

export function parseGetprop(output) {
  const properties = {};
  for (const line of String(output).split(/\r?\n/)) {
    const match = line.match(/^\[([^\]]+)\]: \[([^\]]*)\]$/);
    if (match) properties[match[1]] = match[2];
  }
  return properties;
}

export function resolveAndroidProfile(profile, devices, serialOverride) {
  const eligible = devices.filter((device) => device.isEmulator && device.state === 'device');
  const candidates = serialOverride ? eligible.filter((device) => device.serial === serialOverride) : eligible;
  const selected = candidates.find((device) => Number(device.apiLevel) === profile.apiLevel && (!profile.abi || !device.abi || device.abi === profile.abi));
  if (!selected) {
    const available = eligible.map((device) => `${device.serial}:${device.apiLevel ?? 'unknown'}`).join(', ') || 'none';
    const requested = serialOverride ? ` for ANDROID_SERIAL=${serialOverride}` : '';
    throw new Error(`No Android emulator matches ${profile.id} API ${profile.apiLevel}${requested}; available emulators: ${available}.`);
  }
  return {
    profileId: profile.id,
    serial: selected.serial,
    state: selected.state,
    apiLevel: Number(selected.apiLevel),
    model: selected.model ?? 'unknown',
    avdName: selected.avdName ?? 'unknown',
    abi: selected.abi ?? 'unknown',
    selection: serialOverride ? 'ANDROID_SERIAL override' : 'semantic API/profile match',
  };
}

export function androidTool(root = resolve(import.meta.dirname, '..'), name) {
  const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  const candidate = sdkRoot ? join(sdkRoot, 'platform-tools', name) : null;
  if (candidate && existsSync(candidate)) return candidate;
  return name;
}
