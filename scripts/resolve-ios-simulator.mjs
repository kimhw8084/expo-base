import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Parse the stable, human-readable `simctl list devices available` output.
 * The certification profile remains semantic; a UDID is selected only for
 * this invocation and is never persisted as profile ownership.
 */
export function parseAvailableDevices(output) {
  const devices = [];
  let runtime = null;
  for (const rawLine of String(output).split(/\r?\n/)) {
    const runtimeMatch = rawLine.match(/^--\s+(.+?)\s+--$/);
    if (runtimeMatch) {
      runtime = runtimeMatch[1].trim();
      continue;
    }
    const deviceMatch = rawLine.match(/^\s+(.+?)\s+\(([0-9A-Fa-f-]{36})\)\s+\(([^)]+)\)\s*$/);
    if (!deviceMatch || !runtime) continue;
    devices.push({
      name: deviceMatch[1].trim(),
      runtime,
      udid: deviceMatch[2].toUpperCase(),
      state: deviceMatch[3].trim(),
      platform: 'iOS Simulator',
    });
  }
  return devices;
}

export function resolveSimulatorProfile(profile, devices, override) {
  if (!profile || profile.platform !== 'iOS Simulator' || !profile.device || !profile.runtime) {
    throw new Error('iOS certification profile must declare platform, device, and runtime.');
  }
  const available = Array.isArray(devices) ? devices : [];
  if (override) {
    const normalized = String(override).trim().toUpperCase();
    const selected = available.find((device) => device.udid === normalized);
    if (!selected) {
      throw new Error(`IOS_SIMULATOR_UDID ${override} is not an available simulator.`);
    }
    return { ...selected, selection: 'explicit override' };
  }
  const matches = available.filter((device) => device.name === profile.device && device.runtime === profile.runtime);
  if (matches.length === 0) {
    throw new Error(`No available simulator matches ${profile.device} on ${profile.runtime}.`);
  }
  if (matches.length > 1) {
    throw new Error(`Ambiguous simulator profile ${profile.device} on ${profile.runtime}: ${matches.map((device) => device.udid).join(', ')}.`);
  }
  return { ...matches[0], selection: 'semantic profile' };
}

export function loadCertificationProfile(root) {
  const manifest = JSON.parse(readFileSync(join(root, 'ios.certification.json'), 'utf8'));
  if (!Array.isArray(manifest.profiles) || manifest.profiles.length !== 1) {
    throw new Error('The iOS release certification requires exactly one deterministic simulator profile.');
  }
  return { manifest, profile: manifest.profiles[0] };
}
