export const TASK_EFFECT_STATUSES = ['unresolved', 'resolved', 'qualified'];

export function validateTaskEffectDocument(document) {
  const issues = [];
  if (!isRecord(document)) return ['document must be an object'];
  if (document.schemaVersion !== 1) issues.push('schemaVersion must be 1');
  if (!Array.isArray(document.actions)) {
    issues.push('actions must be an array');
    return issues;
  }

  const actionKeys = new Set();
  for (const [index, action] of document.actions.entries()) {
    const prefix = `actions[${index}]`;
    if (!isRecord(action)) {
      issues.push(`${prefix} must be an object`);
      continue;
    }
    for (const field of ['actionKey', 'route', 'pattern', 'label', 'status', 'intendedEffect', 'recoveryExpectation', 'nextAction']) {
      if (typeof action[field] !== 'string' || action[field].trim().length === 0) issues.push(`${prefix}.${field} must be a non-empty string`);
    }
    if (typeof action.actionKey === 'string' && action.actionKey.trim()) {
      if (actionKeys.has(action.actionKey)) issues.push(`${prefix}.actionKey duplicates "${action.actionKey}"`);
      actionKeys.add(action.actionKey);
    }
    if (!TASK_EFFECT_STATUSES.includes(action.status)) issues.push(`${prefix}.status must be unresolved, resolved, or qualified`);
    if (!Array.isArray(action.prohibitedEffects) || action.prohibitedEffects.length === 0 || action.prohibitedEffects.some((effect) => typeof effect !== 'string' || effect.trim().length === 0)) {
      issues.push(`${prefix}.prohibitedEffects must be a non-empty array of non-empty strings`);
    }
    if (action.status === 'resolved' || action.status === 'qualified') {
      if (typeof action.evidence !== 'string' || action.evidence.trim().length === 0) issues.push(`${prefix}.evidence is required when status is ${action.status}`);
    } else if (action.evidence !== undefined && (typeof action.evidence !== 'string' || action.evidence.trim().length === 0)) {
      issues.push(`${prefix}.evidence must be a non-empty string when supplied`);
    }
  }
  return issues;
}

export function summarizeTaskEffects(document) {
  const actions = Array.isArray(document?.actions) ? document.actions : [];
  return {
    total: actions.length,
    unresolved: actions.filter((action) => action.status === 'unresolved').length,
    resolved: actions.filter((action) => action.status === 'resolved').length,
    qualified: actions.filter((action) => action.status === 'qualified').length,
  };
}

export function validateTaskEffectBindings(document, { routes, patterns }) {
  const issues = [];
  if (!Array.isArray(routes)) issues.push('registered routes must be an array');
  if (!Array.isArray(patterns)) issues.push('scaffoldable patterns must be an array');
  if (issues.length) return issues;
  const routeSet = new Set(routes);
  const patternSet = new Set(patterns);
  const actions = Array.isArray(document?.actions) ? document.actions : [];
  for (const [index, action] of actions.entries()) {
    if (!isRecord(action)) continue;
    if (!routeSet.has(action.route)) issues.push(`actions[${index}].route is not registered`);
    if (!patternSet.has(action.pattern)) issues.push(`actions[${index}].pattern is not scaffoldable`);
  }
  return issues;
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
