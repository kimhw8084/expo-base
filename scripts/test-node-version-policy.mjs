import assert from 'node:assert/strict';
import { isSupportedNodeVersion } from './node-version-policy.mjs';

assert.equal(isSupportedNodeVersion('22.13.0'), true);
assert.equal(isSupportedNodeVersion('22.23.2'), true);
assert.equal(isSupportedNodeVersion('21.99.0'), false);
assert.equal(isSupportedNodeVersion('22.12.9'), false);
assert.equal(isSupportedNodeVersion('23.0.0'), true);
assert.equal(isSupportedNodeVersion('23.0.0', { certification: true }), false);
assert.equal(isSupportedNodeVersion('26.0.0', { certification: true }), false);
assert.equal(isSupportedNodeVersion('22.23.2', { certification: true }), true);
console.log('Node version policy tests passed (runtime minimum and pinned certification major).');
