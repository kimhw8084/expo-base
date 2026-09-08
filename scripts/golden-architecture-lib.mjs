import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const SOURCE_FILE = /\.(?:ts|tsx|js|jsx)$/;
const DEFAULT_RULE_DOCS = {
  'design-ownership': 'docs/GOLDEN_CATALOG.md#build-a-page',
  'workflow-ownership': 'docs/GOLDEN_WORKFLOWS.md#form-workspace',
  'interaction-ownership': 'docs/GOLDEN_CATALOG.md#take-an-action',
  'form-ownership': 'docs/GOLDEN_CATALOG.md#build-a-form',
  'platform-ownership': 'docs/GOLDEN_CATALOG.md#build-a-responsive-page',
  'runtime-ownership': 'docs/GOLDEN_CATALOG.md#use-runtime-or-platform-services',
  'overlay-ownership': 'docs/GOLDEN_CATALOG.md#open-an-overlay',
  'navigation-ownership': 'docs/GOLDEN_CATALOG.md#protect-or-navigate-a-route',
  'feedback-ownership': 'docs/GOLDEN_CATALOG.md#show-loading-error-retry',
  'i18n-ownership': 'docs/GOLDEN_CATALOG.md#format-or-localize-content',
  'server-state-ownership': 'docs/GOLDEN_CATALOG.md#load-server-data',
  'capability-ownership': 'docs/GOLDEN_CATALOG.md#use-an-optional-device-capability',
  'media-ownership': 'docs/GOLDEN_CATALOG.md#show-media',
};

const GEOMETRY_PROPERTIES = new Set([
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'marginHorizontal', 'marginVertical',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingHorizontal', 'paddingVertical',
  'gap', 'rowGap', 'columnGap', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'top', 'right', 'bottom', 'left', 'borderRadius', 'borderWidth', 'borderTopWidth', 'borderRightWidth',
  'borderBottomWidth', 'borderLeftWidth', 'fontSize', 'lineHeight', 'letterSpacing',
]);
const COLOR_PROPERTIES = new Set(['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'shadowColor', 'tintColor']);
const NETWORK_MODULES = new Set(['axios', 'ky', 'got', 'superagent', 'node-fetch', 'cross-fetch', '@apollo/client', 'urql']);
const STORAGE_MODULES = new Set(['@react-native-async-storage/async-storage', 'expo-secure-store', 'react-native-mmkv', 'localforage', 'expo-sqlite']);
const OVERLAY_MODULES = new Set(['@floating-ui/react-native', '@floating-ui/dom', 'react-native-portal', '@gorhom/portal']);
const QUERY_IMPLEMENTATION_MODULES = new Set(['@tanstack/react-query', '@tanstack/query-core']);
const DATE_TIME_IMPLEMENTATION_MODULES = new Set(['@react-native-community/datetimepicker', 'react-native-date-picker', 'react-native-calendars']);
const CAPABILITY_MODULES = new Map([
  ['expo-secure-store', '@precision-calm/secure-storage'],
  ['@react-native-async-storage/async-storage', '@precision-calm/preferences'],
  ['expo-network', '@precision-calm/runtime-capabilities'],
  ['expo-clipboard', '@precision-calm/sharing'],
  ['expo-sharing', '@precision-calm/sharing'],
  ['expo-document-picker', '@precision-calm/media'],
  ['expo-image-picker', '@precision-calm/media'],
  ['expo-camera', '@precision-calm/media'],
  ['expo-local-authentication', '@precision-calm/local-auth'],
  ['expo-notifications', '@precision-calm/notifications'],
  ['expo-updates', '@precision-calm/updates'],
  ['expo-device', '@precision-calm/device'],
  ['expo-application', '@precision-calm/device'],
  ['expo-haptics', '@precision-calm/haptics'],
]);
const OBSERVABILITY_MODULES = new Set(['@sentry/react-native', '@sentry/react', '@segment/analytics-react-native', 'posthog-react-native', '@react-native-firebase/analytics']);

export function loadGoldenArchitectureConfig(configPath) {
  const absolute = path.resolve(configPath);
  return loadConfigFile(absolute, new Set());
}

export function inspectGoldenArchitecture({ projectRoot, config }) {
  const root = path.resolve(projectRoot);
  const normalized = normalizeConfig(config, root);
  const violations = [];
  for (const directory of expandFeatureRoots(root, normalized.featureRoots)) {
    for (const file of walkSourceFiles(directory)) {
      const relativePath = toPosix(path.relative(root, file));
      if (matchesAny(relativePath, normalized.excludePaths)) continue;
      inspectFile({ file, relativePath, config: normalized, violations });
    }
  }
  return violations.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || left.ruleId.localeCompare(right.ruleId));
}

export function formatGoldenArchitectureViolations(violations) {
  return violations.map((violation) => `- ${violation.message}`).join('\n');
}

function loadConfigFile(file, seen) {
  if (seen.has(file)) throw new Error(`Golden architecture config cycle: ${file}`);
  seen.add(file);
  let current;
  try {
    current = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read Golden architecture config ${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const currentDir = path.dirname(file);
  const base = typeof current.extends === 'string'
    ? loadConfigFile(path.resolve(currentDir, current.extends), seen)
    : null;
  const merged = {
    ...(base ?? {}),
    ...current,
    ruleDocs: { ...(base?.ruleDocs ?? {}), ...(current.ruleDocs ?? {}) },
    allowlists: [...(base?.allowlists ?? []), ...(current.allowlists ?? [])],
    configDir: currentDir,
    catalogPath: typeof current.catalog === 'string'
      ? path.resolve(currentDir, current.catalog)
      : base?.catalogPath,
  };
  delete merged.extends;
  return merged;
}

function normalizeConfig(config, root) {
  if (!config || config.schemaVersion !== 1) throw new Error('Golden architecture config must declare schemaVersion 1.');
  if (!Array.isArray(config.featureRoots) || config.featureRoots.some((value) => typeof value !== 'string' || value.length === 0)) {
    throw new Error('Golden architecture config must declare non-empty featureRoots.');
  }
  if (!Array.isArray(config.excludePaths)) throw new Error('Golden architecture config must declare excludePaths.');
  if (!Array.isArray(config.allowlists)) throw new Error('Golden architecture config must declare allowlists.');
  for (const allowlist of config.allowlists) {
    if (!allowlist || typeof allowlist.id !== 'string' || !Array.isArray(allowlist.paths) || !Array.isArray(allowlist.rules) || typeof allowlist.rationale !== 'string' || allowlist.rationale.trim().length === 0) {
      throw new Error('Each Golden architecture allowlist requires id, paths, rules, and a non-empty rationale.');
    }
  }
  if (config.catalogPath && !fs.existsSync(config.catalogPath)) throw new Error(`Golden architecture catalog not found: ${config.catalogPath}`);
  return {
    ...config,
    projectRoot: root,
    excludePaths: config.excludePaths.map(toPosix),
    ruleDocs: { ...DEFAULT_RULE_DOCS, ...(config.ruleDocs ?? {}) },
  };
}

function inspectFile({ file, relativePath, config, violations }) {
  const sourceText = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const bindings = collectImportBindings(source);
  const seen = new Set();
  const report = (ruleId, node, label, replacement) => {
    if (isAllowlisted(relativePath, ruleId, config.allowlists)) return;
    const position = source.getLineAndCharacterOfPosition(node.getStart(source));
    const key = `${ruleId}:${position.line}:${position.character}:${label}`;
    if (seen.has(key)) return;
    seen.add(key);
    const docs = config.ruleDocs[ruleId] ?? 'docs/GOLDEN_CATALOG.md';
    violations.push({
      ruleId,
      file: relativePath,
      line: position.line + 1,
      column: position.character + 1,
      message: `Feature-owned ${label} detected in ${relativePath}:${position.line + 1}:${position.character + 1}. ${replacement} See ${docs}.`,
    });
  };

  for (const entry of bindings.imports) {
    if (NETWORK_MODULES.has(entry.module)) report('runtime-ownership', entry.node, `network client import from ${entry.module}`, 'Use injected AppServices/adapters and @precision-calm/runtime.');
    if (STORAGE_MODULES.has(entry.module)) report('runtime-ownership', entry.node, `persistence import from ${entry.module}`, 'Use a root-composed adapter; optional capability packages are not feature-route APIs.');
    if (OVERLAY_MODULES.has(entry.module)) report('overlay-ownership', entry.node, `overlay dependency import from ${entry.module}`, 'Use @precision-calm/overlays Dialog, BottomSheet, Popover, Menu, or ActionMenu.');
    if (QUERY_IMPLEMENTATION_MODULES.has(entry.module)) report('server-state-ownership', entry.node, `query implementation import from ${entry.module}`, 'Use @precision-calm/server-state keys, queries, mutations, and cache facade.');
    if (DATE_TIME_IMPLEMENTATION_MODULES.has(entry.module)) report('form-ownership', entry.node, `direct date/time implementation import from ${entry.module}`, 'Use @precision-calm/forms DateField, TimeField, or DateRangeField; place an approved native picker adapter behind a shared/root boundary.');
    const capabilityOwner = CAPABILITY_MODULES.get(entry.module);
    if (capabilityOwner) report('capability-ownership', entry.node, `direct ${entry.module} import`, `Use the selected ${capabilityOwner} adapter registered at the application root.`);
    if (OBSERVABILITY_MODULES.has(entry.module)) report('capability-ownership', entry.node, `direct observability vendor import from ${entry.module}`, 'Use the selected @precision-calm/observability adapter registered at the application root.');
    if (entry.module === 'expo-router' || entry.module.startsWith('@react-navigation/')) {
      report('navigation-ownership', entry.node, `navigation import from ${entry.module}`, 'Use @precision-calm/navigation-router or configure the root navigation boundary.');
    }
    if (entry.module === 'react-native-keyboard-controller') {
      report('form-ownership', entry.node, 'keyboard-controller import', 'Use FormScreen and @precision-calm/form-rhf keyboard helpers.');
    }
    if (entry.module === 'react-hook-form') {
      report('form-ownership', entry.node, 'direct react-hook-form import', 'Use @precision-calm/form-rhf adapters from the approved form boundary.');
    }
    if (entry.module === 'react-native' && [...bindings.names.values()].some((binding) => binding.module === 'react-native' && binding.imported === 'I18nManager')) {
      report('i18n-ownership', entry.node, 'I18nManager import', 'Configure locale and direction through PrecisionRuntimeProvider and use @precision-calm/i18n.');
    }
    if (entry.module === 'react-native' && [...bindings.names.values()].some((binding) => binding.module === 'react-native' && binding.imported === 'AppState')) {
      report('capability-ownership', entry.node, 'direct AppState import', 'Use the selected @precision-calm/runtime-capabilities lifecycle adapter registered at the application root.');
    }
  }

  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      inspectJsxElement(node, bindings, report);
      for (const property of node.attributes.properties) {
        if (ts.isJsxAttribute(property) && isStyleAttribute(property.name.text) && property.initializer && ts.isJsxExpression(property.initializer) && property.initializer.expression) {
          inspectStyleExpression(property.initializer.expression, report, bindings);
        }
      }
    }
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      inspectCallExpression(node, bindings, report);
      if (ts.isCallExpression(node) && isStyleSheetCreate(node, bindings)) {
        for (const argument of node.arguments) inspectStyleExpression(argument, report, bindings);
      }
    }
    if (ts.isPropertyAccessExpression(node)) inspectPropertyAccess(node, bindings, report);
    ts.forEachChild(node, visit);
  };
  visit(source);
}

function collectImportBindings(source) {
  const names = new Map();
  const imports = [];
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const module = statement.moduleSpecifier.text;
    imports.push({ module, node: statement });
    const clause = statement.importClause;
    if (!clause) continue;
    if (clause.name) names.set(clause.name.text, { module, imported: 'default' });
    const bindings = clause.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) names.set(bindings.name.text, { module, imported: '*' });
    if (bindings && ts.isNamedImports(bindings)) {
      for (const item of bindings.elements) names.set(item.name.text, { module, imported: item.propertyName?.text ?? item.name.text });
    }
  }
  const constants = new Map();
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) constants.set(declaration.name.text, declaration.initializer);
    }
  }
  return { names, imports, constants };
}

function inspectJsxElement(node, bindings, report) {
  for (const [component, ruleId, replacement] of [
    ['Pressable', 'interaction-ownership', 'Use Button, IconButton, Link, ListRow, or a reviewed shared PressableSurface composition.'],
    ['TextInput', 'form-ownership', 'Use @precision-calm/forms TextField, PasswordField, TextArea, SearchField, or CurrencyField.'],
    ['Switch', 'form-ownership', 'Use @precision-calm/forms SwitchField.'],
    ['KeyboardAvoidingView', 'form-ownership', 'Use @precision-calm/layouts FormScreen.'],
    ['Modal', 'overlay-ownership', 'Use @precision-calm/overlays Dialog or BottomSheet.'],
    ['ActivityIndicator', 'feedback-ownership', 'Use @precision-calm/feedback LoadingState, SkeletonLine, SkeletonList, StateView, or AsyncStateView.'],
    ['Image', 'media-ownership', 'Use @precision-calm/ui MediaFrame for responsive aspect ratio, loading/error fallback, and accessible alternative text.'],
  ]) {
    if (isImportedJsxComponent(node.tagName, component, bindings)) report(ruleId, node.tagName, `raw ${component}`, replacement);
  }
}

function inspectCallExpression(node, bindings, report) {
  if (ts.isIdentifier(node.expression) && node.expression.text === 'fetch' && !bindings.names.has('fetch')) {
    report('runtime-ownership', node.expression, 'direct fetch call', 'Use injected AppServices/adapters and @precision-calm/runtime.');
  }
  if (isGlobalMember(node.expression, 'fetch')) {
    report('runtime-ownership', node.expression, 'direct fetch call', 'Use injected AppServices/adapters and @precision-calm/runtime.');
  }
  if (isImportedMemberCall(node.expression, 'react-native', 'Dimensions', 'get', bindings)) {
    report('platform-ownership', node.expression, 'Dimensions.get viewport branch', 'Use AdaptiveGrid, AdaptiveSplit, MasterDetail, ResponsiveSlot, or shared navigation.');
  }
  if (isImportedFunctionCall(node.expression, 'react-native', 'useWindowDimensions', bindings)) {
    report('platform-ownership', node.expression, 'useWindowDimensions viewport branch', 'Use AdaptiveGrid, AdaptiveSplit, MasterDetail, ResponsiveSlot, or shared navigation.');
  }
  if (ts.isIdentifier(node.expression) && node.expression.text === 'matchMedia') {
    report('platform-ownership', node.expression, 'manual matchMedia viewport branch', 'Use shared responsive layout composition.');
  }
  if (isGlobalMember(node.expression, 'matchMedia')) {
    report('platform-ownership', node.expression, 'manual matchMedia viewport branch', 'Use shared responsive layout composition.');
  }
  if (isIntlConstructor(node.expression) || isLocaleMethod(node.expression)) {
    report('i18n-ownership', node.expression, 'feature-local locale formatting', 'Use usePrecisionI18n() formatters, t(), and compare() from @precision-calm/i18n.');
  }
}

function inspectPropertyAccess(node, bindings, report) {
  if (isImportedMember(node, 'react-native', 'Platform', 'OS', bindings)) {
    report('platform-ownership', node, 'Platform.OS branch', 'Use a shared responsive/layout owner or an approved platform adapter.');
  }
  if (isImportedMember(node, 'react-native', 'Dimensions', 'get', bindings)) {
    report('platform-ownership', node, 'Dimensions.get viewport branch', 'Use shared responsive layout composition.');
  }
  if (isImportedMember(node, 'react-native', 'I18nManager', 'isRTL', bindings)) {
    report('i18n-ownership', node, 'I18nManager direction branch', 'Use usePrecisionDirection() and shared RTL-safe owners from @precision-calm/i18n.');
  }
  if (isGlobalMember(node, 'innerWidth') || isGlobalMember(node, 'outerWidth')) {
    report('platform-ownership', node, 'manual browser viewport branch', 'Use AdaptiveGrid, AdaptiveSplit, MasterDetail, ResponsiveSlot, or shared navigation.');
  }
  if (isBrowserStorageMember(node)) {
    report('runtime-ownership', node, 'direct browser storage access', 'Use a root-composed storage adapter; optional capability packages are not feature-route APIs.');
  }
  if (node.name.text === 'measureInWindow' || node.name.text === 'measureLayout') {
    report('overlay-ownership', node, `feature-owned ${node.name.text} measurement`, 'Use @precision-calm/overlays Popover or another shared overlay owner.');
  }
}

function inspectStyleExpression(expression, report, bindings) {
  expression = resolveStaticExpression(expression, bindings);
  if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isTypeAssertionExpression(expression) || ts.isNonNullExpression(expression)) {
    inspectStyleExpression(expression.expression, report, bindings);
    return;
  }
  if (ts.isArrayLiteralExpression(expression)) {
    for (const element of expression.elements) if (ts.isExpression(element)) inspectStyleExpression(element, report, bindings);
    return;
  }
  if (!ts.isObjectLiteralExpression(expression)) return;
  for (const property of expression.properties) {
    if (!ts.isPropertyAssignment(property) || !property.name) continue;
    const name = propertyName(property.name);
    if (!name) continue;
    const value = property.initializer;
    if (name === 'zIndex') report('design-ownership', property.name, 'manual z-index', 'Use shared overlay/layer owners instead of route-owned layers.');
    if (name === 'position' && isString(value, 'absolute', bindings)) report('design-ownership', property.name, 'absolute positioning', 'Use Page, Section, adaptive layouts, or a shared overlay owner.');
    if (name === 'position' && isString(value, 'fixed', bindings)) report('workflow-ownership', property.name, 'fixed action positioning', 'Use FormWorkspaceLayout or StickyActionBar for persistent page actions.');
    if (name === 'elevation' || name === 'boxShadow' || name.startsWith('shadow')) report('design-ownership', property.name, 'direct shadow/elevation style', 'Use a semantic shared surface such as Card.');
    if (GEOMETRY_PROPERTIES.has(name) && isLiteralGeometry(value, bindings)) report('design-ownership', property.name, `literal ${name}`, 'Use tokens through Page, Section, Card, Stack, Container, or a shared pattern.');
    if (COLOR_PROPERTIES.has(name) && isLiteralColor(value, bindings)) report('design-ownership', property.name, `literal ${name}`, 'Use semantic theme colors through a shared component or owner.');
    if (name.startsWith('@media')) report('platform-ownership', property.name, 'ad-hoc media breakpoint', 'Use shared responsive layout composition and tokenized regimes.');
    if ((name === 'direction' || name === 'writingDirection') && (isString(value, 'ltr', bindings) || isString(value, 'rtl', bindings))) {
      report('i18n-ownership', property.name, 'feature-owned writing direction', 'Configure locale direction through PrecisionRuntimeProvider and shared RTL-safe owners.');
    }
    if (ts.isObjectLiteralExpression(value) || ts.isArrayLiteralExpression(value)) inspectStyleExpression(value, report, bindings);
  }
}

function isImportedJsxComponent(tagName, component, bindings) {
  if (ts.isIdentifier(tagName)) {
    const binding = bindings.names.get(tagName.text);
    return binding?.module === 'react-native' && binding.imported === component;
  }
  if (ts.isPropertyAccessExpression(tagName) && ts.isIdentifier(tagName.expression) && ts.isIdentifier(tagName.name)) {
    const binding = bindings.names.get(tagName.expression.text);
    return binding?.module === 'react-native' && binding.imported === '*' && tagName.name.text === component;
  }
  return false;
}

function isImportedMember(node, module, owner, member, bindings) {
  if (!ts.isPropertyAccessExpression(node) || node.name.text !== member) return false;
  if (ts.isIdentifier(node.expression)) {
    const binding = bindings.names.get(node.expression.text);
    return binding?.module === module && binding.imported === owner;
  }
  if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) && node.expression.name.text === owner) {
    const binding = bindings.names.get(node.expression.expression.text);
    return binding?.module === module && binding.imported === '*';
  }
  return false;
}

function isImportedMemberCall(expression, module, owner, member, bindings) {
  return isImportedMember(expression, module, owner, member, bindings);
}

function isImportedFunctionCall(expression, module, name, bindings) {
  if (ts.isIdentifier(expression)) {
    const binding = bindings.names.get(expression.text);
    return binding?.module === module && binding.imported === name;
  }
  if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression) && expression.name.text === name) {
    const binding = bindings.names.get(expression.expression.text);
    return binding?.module === module && binding.imported === '*';
  }
  return false;
}

function isStyleSheetCreate(node, bindings) {
  return isImportedMember(node.expression, 'react-native', 'StyleSheet', 'create', bindings);
}

function isGlobalMember(node, member) {
  if (!ts.isPropertyAccessExpression(node) || node.name.text !== member) return false;
  if (!ts.isIdentifier(node.expression)) return false;
  return node.expression.text === 'window' || node.expression.text === 'globalThis';
}

function isIntlConstructor(node) {
  return ts.isPropertyAccessExpression(node)
    && ts.isIdentifier(node.expression)
    && node.expression.text === 'Intl'
    && ['NumberFormat', 'DateTimeFormat', 'PluralRules', 'Collator', 'ListFormat', 'RelativeTimeFormat'].includes(node.name.text);
}

function isLocaleMethod(node) {
  return ts.isPropertyAccessExpression(node)
    && (node.name.text === 'localeCompare' || node.name.text.startsWith('toLocale'));
}

function isBrowserStorageMember(node) {
  if (!ts.isPropertyAccessExpression(node)) return false;
  if (ts.isIdentifier(node.expression)) return node.expression.text === 'localStorage' || node.expression.text === 'sessionStorage';
  return ts.isPropertyAccessExpression(node.expression)
    && ts.isIdentifier(node.expression.expression)
    && (node.expression.expression.text === 'window' || node.expression.expression.text === 'globalThis')
    && (node.expression.name.text === 'localStorage' || node.expression.name.text === 'sessionStorage');
}

function isStyleAttribute(name) {
  return name === 'style' || name.endsWith('Style');
}

function propertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return null;
}

function isString(node, expected, bindings) {
  node = resolveStaticExpression(node, bindings);
  return ts.isStringLiteral(node) && node.text === expected;
}

function isLiteralGeometry(node, bindings) {
  node = resolveStaticExpression(node, bindings);
  if (ts.isNumericLiteral(node)) return node.text !== '0';
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) return node.operand.text !== '0';
  return ts.isStringLiteral(node) && /^-?(?:\d+|\d*\.\d+)(?:px|pt|rem|em|%)$/.test(node.text) && !/^0(?:px|pt|rem|em|%)$/.test(node.text);
}

function isLiteralColor(node, bindings) {
  node = resolveStaticExpression(node, bindings);
  if (!ts.isStringLiteral(node)) return false;
  return /^(?:#[0-9a-f]{3,8}|rgba?\(|hsla?\(|white$|black$|red$|blue$|green$)/i.test(node.text);
}

function resolveStaticExpression(expression, bindings, seen = new Set()) {
  if (ts.isIdentifier(expression)) {
    if (seen.has(expression.text)) return expression;
    const value = bindings.constants.get(expression.text);
    return value ? resolveStaticExpression(value, bindings, new Set([...seen, expression.text])) : expression;
  }
  if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression)) {
    const source = resolveStaticExpression(expression.expression, bindings, seen);
    if (ts.isObjectLiteralExpression(source)) {
      const property = source.properties.find((candidate) => ts.isPropertyAssignment(candidate) && propertyName(candidate.name) === expression.name.text);
      if (property && ts.isPropertyAssignment(property)) return resolveStaticExpression(property.initializer, bindings, seen);
    }
  }
  return expression;
}

function isAllowlisted(relativePath, ruleId, allowlists) {
  return allowlists.some((allowlist) => (allowlist.rules.includes('*') || allowlist.rules.includes(ruleId)) && matchesAny(relativePath, allowlist.paths));
}

function expandFeatureRoots(root, patterns) {
  return [...new Set(patterns.flatMap((pattern) => expandDirectoryPattern(root, toPosix(pattern).split('/'))))];
}

function expandDirectoryPattern(base, parts, index = 0) {
  if (index === parts.length) return fs.existsSync(base) && fs.statSync(base).isDirectory() ? [base] : [];
  const segment = parts[index];
  if (!segment.includes('*')) return expandDirectoryPattern(path.join(base, segment), parts, index + 1);
  if (!fs.existsSync(base)) return [];
  const matcher = globMatcher(segment);
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && matcher.test(entry.name))
    .flatMap((entry) => expandDirectoryPattern(path.join(base, entry.name), parts, index + 1));
}

function walkSourceFiles(directory) {
  const files = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.expo' || entry.name === 'dist') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (SOURCE_FILE.test(entry.name)) files.push(full);
    }
  };
  walk(directory);
  return files;
}

function matchesAny(file, patterns) {
  return patterns.some((pattern) => globMatcher(toPosix(pattern)).test(file));
}

function globMatcher(pattern) {
  let source = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === '*') {
      if (pattern[index + 1] === '*') {
        source += '.*';
        index += 1;
      } else source += '[^/]*';
    } else if (character === '?') source += '[^/]';
    else source += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
  }
  return new RegExp(`${source}$`);
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}
