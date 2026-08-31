#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = parseArgs(process.argv.slice(2));
if (args.help) { usage(); process.exit(0); }
const root = path.resolve(args.path ?? process.cwd());
if (!fs.existsSync(root)) fail(`Path does not exist: ${root}`);

const workspaceRoot = findWorkspaceRoot(process.cwd());
const compatibilityPath = path.join(workspaceRoot, 'precision.compatibility.json');
const compatibility = fs.existsSync(compatibilityPath) ? JSON.parse(fs.readFileSync(compatibilityPath, 'utf8')) : {};

const rules = [
  rule('STYLE-001','high','foundation','Inline style object',/style\s*=\s*\{\s*\{/g,'Move geometry/appearance into Precision Calm primitives and semantic variants.'),
  rule('STYLE-002','medium','foundation','Feature StyleSheet',/\bStyleSheet\.create\s*\(/g,'Replace feature-owned styling with @precision-calm/ui composition.'),
  rule('STYLE-003','medium','foundation','Literal color',/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g,'Map colors to semantic light/dark tokens.'),
  rule('LAYOUT-001','high','foundation','Raw scrolling/list ownership',/<(?:ScrollView|FlatList|SectionList|VirtualizedList)\b/g,'Migrate to ScrollScreen/ListScreen/SectionListScreen and one-scroll-owner rules.'),
  rule('LAYOUT-002','medium','foundation','Viewport/platform branching',/\b(?:useWindowDimensions|Dimensions\.(?:get|addEventListener)|Platform\.OS)\b/g,'Move adaptation into capability-aware layout primitives.'),
  rule('LAYOUT-003','high','foundation','Manual stacking/absolute geometry',/\b(?:zIndex\s*:|position\s*:\s*['\"]absolute['\"])/g,'Use overlay/layer/layout primitives instead of manual positioning.'),
  rule('OVERLAY-001','high','behavior','Raw Modal',/<Modal\b|from\s+['\"]react-native['\"][^;]*\bModal\b/g,'Migrate to Dialog/BottomSheet/Popover so focus, dismissal, layers and safe areas are centralized.'),
  rule('ICON-001','medium','behavior','Direct icon/SVG implementation',/from\s+['\"](?:lucide-react-native|react-native-svg|@expo\/vector-icons)['\"]/g,'Use the semantic @precision-calm/ui Icon facade.'),
  rule('MOTION-001','medium','behavior','Direct animation/haptics implementation',/from\s+['\"](?:react-native-reanimated|expo-haptics)['\"]/g,'Use Precision Calm motion/haptic semantics so reduced-motion behavior stays consistent.'),
  rule('DATA-001','low','data','Feature-owned number formatting',/\bIntl\.NumberFormat\b/g,'Use centralized locale/currency/percent formatting contracts.'),
  rule('LINK-001','high','behavior','Direct external/deep-link implementation',/from\s+['"](?:expo-linking|expo-web-browser)['"]|import\s*\{[^}]*\bLinking\b[^}]*\}\s*from\s*['"]react-native['"]|\bLinking\.(?:openURL|canOpenURL)\s*\(|\bwindow\.open\s*\(|\b(?:window\.)?location\.href\s*=|<a\b[^>]*\bhref\s*=|\bhref\s*=\s*['"]https?:\/\//g,'Route outgoing URLs through the Precision Calm linking runtime so schemes/hosts are validated centrally.'),
  rule('AUTH-001','high','behavior','Feature owns authentication adapter/session routing',/\bservices\.auth\.(?:getSession|signIn|signOut|subscribe)\s*\(|\b(?:router|navigation)\.(?:replace|push|navigate)\s*\([^)]*['"](?:\/)?sign-in['"]/g,'Use usePrecisionAuth plus ProtectedRouterStack so session resolution, history invalidation, and protected-route access stay centralized.'),
  rule('AUTHZ-001','high','behavior','Feature owns authorization/role checks',/\bservices\.authorization\.(?:getCapabilities|subscribe)\s*\(|\b(?:user|session\.user)\.role\s*===|\broles?\.includes\s*\(/g,'Use usePrecisionAuthorization/usePrecisionAuthorizationRequirement so capability loading/error states fail closed and route/UI gating stays centralized.'),
  rule('BACKEND-001','high','integration','Backend client imported in feature UI',/from\s+['\"](?:@supabase\/[^'\"]+|firebase(?:\/[^'\"]*)?)['\"]/g,'Move backend access behind @precision-calm/adapters/service composition.'),
  rule('API-001','medium','foundation','Direct Precision Calm implementation import',/from\s+['\"]@precision-calm\/(?:accessibility|components|data-display|feedback|forms|icons|layouts|lists|motion|navigation|overlays|patterns|primitives|visualization)['\"]/g,'Feature screens should import visual APIs from @precision-calm/ui.'),
];

const findings = [];
for (const file of sourceFiles(root)) {
  const text = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file) || path.basename(file);
  const isRouteLayout = /(?:^|[\\/])app[\\/]_layout\.tsx?$/.test(file);
  for (const entry of rules) {
    for (const match of text.matchAll(entry.pattern)) {
      findings.push({ ...entry.meta, file: relative, line: lineAt(text, match.index ?? 0), sample: match[0].slice(0, 120), recommendation: entry.recommendation });
    }
  }
  if (!isRouteLayout) {
    for (const match of text.matchAll(/from\s+['\"]expo-router['\"]/g)) findings.push({ id:'NAV-001', severity:'medium', wave:'behavior', title:'Feature route coupled directly to Expo Router', file:relative, line:lineAt(text,match.index ?? 0), sample:match[0], recommendation:'Use @precision-calm/navigation-router so route-library coupling stays at the adapter boundary.' });
  }
}

const dependencyFindings = auditDependencies(root, compatibility);
findings.push(...dependencyFindings);

const summary = summarize(findings);
const result = { schemaVersion:1, auditedPath:root, findings, summary, recommendedWaves: wavePlan(summary) };
if (args.json) console.log(JSON.stringify(result, null, 2));
else printHuman(result);

const threshold = args.failOn;
if (threshold && findings.some((f) => severityRank(f.severity) >= severityRank(threshold))) process.exit(3);

function rule(id,severity,wave,title,pattern,recommendation){ return { pattern, recommendation, meta:{ id,severity,wave,title } }; }
function sourceFiles(dir){
  const out=[];
  const ignored=new Set(['node_modules','.git','.expo','dist','build','web-build','coverage','ios','android']);
  function walk(current){
    for(const entry of fs.readdirSync(current,{withFileTypes:true})){
      if(ignored.has(entry.name)) continue;
      const full=path.join(current,entry.name);
      if(entry.isDirectory()) walk(full);
      else if(/\.(?:ts|tsx|js|jsx)$/.test(entry.name)) out.push(full);
    }
  }
  walk(dir); return out;
}
function lineAt(text,index){ return text.slice(0,index).split('\n').length; }
function auditDependencies(root,compat){
  const file=path.join(root,'package.json'); if(!fs.existsSync(file)) return [];
  const pkg=JSON.parse(fs.readFileSync(file,'utf8')); const deps={...(pkg.dependencies??{}),...(pkg.devDependencies??{})}; const out=[];
  for(const [name,expected] of Object.entries(compat)){
    if(name==='schemaVersion'||deps[name]===undefined) continue;
    if(deps[name]!==expected) out.push({id:'DEPS-001',severity:'high',wave:'foundation',title:'Compatibility version drift',file:'package.json',line:1,sample:`${name}: ${deps[name]}`,recommendation:`Align ${name} to Precision Calm compatibility version ${expected}.`});
  }
  return out;
}
function summarize(items){
  const bySeverity={high:0,medium:0,low:0},byWave={foundation:0,behavior:0,data:0,integration:0};
  for(const item of items){bySeverity[item.severity]=(bySeverity[item.severity]??0)+1;byWave[item.wave]=(byWave[item.wave]??0)+1;}
  return {total:items.length,bySeverity,byWave,filesAffected:new Set(items.map((x)=>x.file)).size};
}
function wavePlan(summary){
  const waves=[];
  if(summary.byWave.foundation) waves.push({wave:1,name:'Foundation replacement',findingCount:summary.byWave.foundation,goal:'Replace raw styling/layout/scrolling and align runtime versions first.'});
  if(summary.byWave.behavior) waves.push({wave:2,name:'Interaction centralization',findingCount:summary.byWave.behavior,goal:'Move routing, overlays, icons, motion and haptics behind platform APIs.'});
  if(summary.byWave.data) waves.push({wave:3,name:'Data presentation',findingCount:summary.byWave.data,goal:'Centralize formatting and adaptive data presentation.'});
  if(summary.byWave.integration) waves.push({wave:4,name:'Service decoupling',findingCount:summary.byWave.integration,goal:'Move backend clients behind service adapters.'});
  return waves;
}
function printHuman(result){
  console.log('Precision Calm migration audit'); console.log(`Path: ${result.auditedPath}`); console.log(`Findings: ${result.summary.total} (${result.summary.bySeverity.high} high, ${result.summary.bySeverity.medium} medium, ${result.summary.bySeverity.low} low)`); console.log(`Files affected: ${result.summary.filesAffected}`);
  if(!result.findings.length){ console.log('\nNo migration violations detected.'); return; }
  for(const wave of result.recommendedWaves){
    console.log(`\nWave ${wave.wave} — ${wave.name} (${wave.findingCount})`); console.log(wave.goal);
    for(const f of result.findings.filter((x)=>x.wave===waveName(wave.wave))) console.log(`- [${f.severity.toUpperCase()}] ${f.id} ${f.file}:${f.line} — ${f.title}\n  ${f.recommendation}`);
  }
}
function waveName(n){ return ({1:'foundation',2:'behavior',3:'data',4:'integration'})[n]; }
function severityRank(value){ return ({low:1,medium:2,high:3})[value]??0; }
function parseArgs(argv){ const out={json:false,help:false}; for(let i=0;i<argv.length;i++){const a=argv[i];if(a==='--help'||a==='-h')out.help=true;else if(a==='--json')out.json=true;else if(a==='--path')out.path=argv[++i];else if(a==='--fail-on'){const v=argv[++i];if(!['low','medium','high'].includes(v))fail('--fail-on must be low, medium, or high');out.failOn=v;}else fail(`Unknown argument: ${a}`);}return out; }
function usage(){ console.log('precision-migrate-audit [--path app-or-repo] [--json] [--fail-on low|medium|high]'); }
function findWorkspaceRoot(start){ let current=path.resolve(start); while(true){if(fs.existsSync(path.join(current,'precision.compatibility.json')))return current;const parent=path.dirname(current);if(parent===current)return start;current=parent;} }
function fail(message){ console.error(message); process.exit(2); }
