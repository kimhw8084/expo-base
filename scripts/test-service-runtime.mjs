import assert from 'node:assert/strict';
import fs from 'node:fs';
import process from 'node:process';

const provider = fs.readFileSync('packages/runtime/src/PrecisionRuntimeProvider.tsx', 'utf8');
const services = fs.readFileSync('packages/runtime/src/services.tsx', 'utf8');
const reference = fs.readFileSync('apps/reference/app/services.tsx', 'utf8');
const root = fs.readFileSync('apps/reference/app/_layout.tsx', 'utf8');

assert.ok(provider.includes('services?: AppServices'));
assert.ok(provider.includes('<PrecisionServicesProvider services={services}>'));
assert.ok(provider.includes('<PrecisionAuthProvider adapter={services.auth}'));
assert.ok(provider.includes('<PrecisionAuthorizationProvider adapter={services.authorization}'));
assert.ok(services.includes('createContext<AppServices | null>'));
assert.ok(services.includes('usePrecisionServices'));
assert.ok(services.includes('requires PrecisionServicesProvider'));
assert.ok(root.includes('services={services}'));
for (const marker of ['usePrecisionAuth','auth.signOut','services.storage.get','services.analytics.track','services.images.resolve']) assert.ok(reference.includes(marker), marker);
assert.equal(/services\.auth\.(?:getSession|signIn|signOut|subscribe)/.test(reference), false);
assert.equal(/@supabase|firebase/.test(reference), false);
console.log('Service runtime contracts passed (root injection, centralized auth, typed service context, backend-neutral reference consumption).');
