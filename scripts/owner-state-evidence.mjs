import ts from 'typescript';

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function resolvePlaywrightCase(source, marker, file) {
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const matches = [];
  const visit = (node) => {
    if (ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && (node.expression.text === 'test' || node.expression.text === 'it')
      && node.arguments.length >= 2
      && ts.isStringLiteralLike(node.arguments[0])
      && node.arguments[0].text.includes(marker)) {
      matches.push({ title: node.arguments[0].text, body: node.arguments[1] });
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  requireCondition(matches.length === 1, `Evidence marker ${marker} must identify exactly one Playwright test in ${file}; found ${matches.length}.`);
  const body = matches[0].body;
  requireCondition(ts.isArrowFunction(body) || ts.isFunctionExpression(body), `Evidence marker ${marker} has no executable Playwright callback in ${file}.`);
  const bodyText = body.getText(parsed);
  requireCondition(/\bexpect\s*\(/.test(bodyText), `Evidence marker ${marker} has no assertion in its Playwright callback in ${file}.`);
  return { title: matches[0].title, bodyText };
}

export function validateOwnerStateEvidence(certification, evidence, readFile) {
  const browserCases = new Map();
  const caseIds = new Set();
  for (const [kind, entries] of Object.entries({
    browser: evidence.browser ?? [],
    forcedColors: evidence.forcedColors ?? [],
    largeText: evidence.largeText ?? [],
  })) {
    for (const entry of entries) {
      if (!entry.caseId) continue;
      requireCondition(!caseIds.has(entry.caseId), `Duplicate executed case ID: ${entry.caseId}.`);
      caseIds.add(entry.caseId);
      requireCondition(entry.caseType === (kind === 'browser' ? 'owner-state' : 'qualification'), `Executed case ${entry.caseId} has the wrong evidence classification.`);
      requireCondition(typeof entry.file === 'string' && typeof entry.marker === 'string' && entry.marker.length > 0, `Executed case ${entry.caseId} needs a source file and exact test marker.`);
      requireCondition(typeof entry.outcome === 'string' && entry.outcome.trim().length >= 12, `Executed case ${entry.caseId} needs a concrete outcome.`);
      requireCondition(Array.isArray(entry.assertions) && entry.assertions.length > 0, `Executed case ${entry.caseId} needs assertion bindings.`);
      const source = readFile(entry.file);
      const testCase = resolvePlaywrightCase(source, entry.marker, entry.file);
      for (const assertion of entry.assertions) {
        requireCondition(testCase.bodyText.includes(assertion), `Executed case ${entry.caseId} is stale: assertion binding ${assertion} is absent from ${entry.file}.`);
      }
      if (kind === 'browser') browserCases.set(entry.id, { ...entry, testCase });
    }
  }

  let executedStates = 0;
  let deferredStates = 0;
  for (const owner of certification.owners) {
    const stateEvidence = owner.stateEvidence ?? {};
    const deferredStatesByName = owner.deferredStates ?? {};
    const declared = new Set(owner.states);
    for (const state of [...Object.keys(stateEvidence), ...Object.keys(deferredStatesByName)]) {
      requireCondition(declared.has(state), `${owner.id} records undeclared state ${state}.`);
    }
    for (const state of owner.states) {
      const caseIds = stateEvidence[state];
      const deferredReason = deferredStatesByName[state];
      requireCondition((Array.isArray(caseIds) && caseIds.length > 0) !== (typeof deferredReason === 'string' && deferredReason.trim().length > 0), `${owner.id} state ${state} must have exactly one executed case binding or an explicit deferral.`);
      if (caseIds) {
        requireCondition(caseIds.length === 1, `${owner.id} state ${state} must resolve to exactly one executed case.`);
        const executedCase = browserCases.get(caseIds[0]);
        requireCondition(executedCase, `${owner.id} state ${state} requires a browser execution case; fixture/list evidence is not execution proof.`);
        requireCondition(executedCase.caseType === 'owner-state' && executedCase.caseId === `${owner.id}/${state}`, `${owner.id} state ${state} has a stale or mismatched executed case binding.`);
        requireCondition(executedCase.marker === `@owner-state ${owner.id}/${state}`, `${owner.id} state ${state} marker does not identify its exact owner/state case.`);
        executedStates += 1;
      } else {
        deferredStates += 1;
      }
    }
  }
  return { executedStates, deferredStates };
}
