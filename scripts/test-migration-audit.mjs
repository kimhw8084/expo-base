import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root=process.cwd(); const fixture=path.join(root,'.tmp-migration-fixture');
fs.rmSync(fixture,{recursive:true,force:true}); fs.mkdirSync(path.join(fixture,'app'),{recursive:true});
try{
  const compatibility=JSON.parse(fs.readFileSync(path.join(root,'precision.compatibility.json'),'utf8'));
  fs.writeFileSync(path.join(fixture,'package.json'),JSON.stringify({dependencies:{expo:'1.0.0',react:compatibility.react,'@supabase/supabase-js':'2.0.0'}},null,2));
  fs.writeFileSync(path.join(fixture,'app','index.tsx'),`import { StyleSheet, ScrollView, Modal, Platform } from 'react-native';\nimport { useRouter } from 'expo-router';\nimport { createClient } from '@supabase/supabase-js';\nimport { Search } from 'lucide-react-native';
import * as Linking from 'expo-linking';\nexport default function Screen(){ return <ScrollView style={{ padding: 17, backgroundColor: '#fff', position: 'absolute', zIndex: 9 }}><Modal visible /><Search /></ScrollView> }\nconst styles=StyleSheet.create({ root:{ margin:13 } });\nvoid Platform.OS; void useRouter; void createClient; void Linking.openURL('https://example.com'); void services.auth.getSession(); void services.authorization.getCapabilities('u1'); void user.role === 'admin';`);
  const run=spawnSync(process.execPath,['packages/migrate-precision-app/bin/precision-migrate-audit.mjs','--path',fixture,'--json'],{cwd:root,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||run.stdout); const result=JSON.parse(run.stdout);
  const ids=new Set(result.findings.map((f)=>f.id));
  for(const id of ['STYLE-001','STYLE-002','STYLE-003','LAYOUT-001','LAYOUT-002','LAYOUT-003','OVERLAY-001','ICON-001','NAV-001','LINK-001','AUTH-001','AUTHZ-001','BACKEND-001','DEPS-001']) assert.ok(ids.has(id),id);
  assert.ok(result.summary.bySeverity.high>0); assert.ok(result.recommendedWaves.length>=3);
  const failRun=spawnSync(process.execPath,['packages/migrate-precision-app/bin/precision-migrate-audit.mjs','--path',fixture,'--fail-on','high'],{cwd:root,encoding:'utf8'});
  assert.equal(failRun.status,3);
  console.log(`Migration audit tests passed (${result.findings.length} intentional findings classified).`);
} finally { fs.rmSync(fixture,{recursive:true,force:true}); }
