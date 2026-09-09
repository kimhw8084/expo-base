import assert from 'node:assert/strict';
import { parseAvailableDevices, resolveSimulatorProfile } from './resolve-ios-simulator.mjs';

const output = `== Devices ==
-- iOS 26.5 --
    iPhone 17 Pro (AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE) (Shutdown)
    iPhone 16 (11111111-2222-3333-4444-555555555555) (Shutdown)
-- iOS 26.4 --
    iPhone 17 Pro (99999999-2222-3333-4444-555555555555) (Shutdown)
`;
const devices = parseAvailableDevices(output);
const profile = { platform: 'iOS Simulator', device: 'iPhone 17 Pro', runtime: 'iOS 26.5' };
assert.equal(devices.length, 3);
assert.equal(resolveSimulatorProfile(profile, devices).udid, 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE');
assert.equal(resolveSimulatorProfile(profile, devices, 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee').selection, 'explicit override');
assert.throws(() => resolveSimulatorProfile(profile, devices, '00000000-0000-0000-0000-000000000000'), /not an available simulator/);
assert.throws(() => resolveSimulatorProfile({ ...profile, runtime: 'iOS 99.0' }, devices), /No available simulator/);
assert.throws(() => resolveSimulatorProfile(profile, [...devices, devices[0]]), /Ambiguous simulator profile/);
assert.throws(() => resolveSimulatorProfile({ device: profile.device, runtime: profile.runtime }, devices), /platform, device, and runtime/);
console.log('iOS simulator resolution tests passed (semantic profile, override, missing, and ambiguity).');
