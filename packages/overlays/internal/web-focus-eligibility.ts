export interface WebFocusStyle {
  display?: string;
  visibility?: string;
  opacity?: string;
}

export interface WebFocusTarget {
  isConnected?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  inert?: boolean;
  parentElement?: WebFocusTarget | null;
  ownerDocument?: { defaultView?: WebFocusWindow | null };
  style?: WebFocusStyle;
  getAttribute?: (name: string) => string | null;
  hasAttribute?: (name: string) => boolean;
  matches?: (selectors: string) => boolean;
}

export interface WebFocusWindow {
  getComputedStyle?: (target: WebFocusTarget) => WebFocusStyle;
}

export interface WebFocusEnvironment {
  document?: { defaultView?: WebFocusWindow | null };
}

/** One web eligibility rule shared by focus trapping and restoration. */
export function isWebFocusEligible(target: WebFocusTarget, environment: WebFocusEnvironment): boolean {
  if (target.isConnected !== true || target.disabled === true || target.hasAttribute?.('disabled') === true) return false;
  try {
    if (target.matches?.(':disabled')) return false;
  } catch {
    // Older or non-browser DOM shims may not support the :disabled selector.
  }

  let current: WebFocusTarget | null | undefined = target;
  while (current) {
    const isTarget = current === target;
    if (current.hidden === true || current.inert === true) return false;
    if (hasAttribute(current, 'hidden') || hasAttribute(current, 'inert')) return false;
    if (isTrueAttribute(current, 'aria-disabled') || isTrueAttribute(current, 'aria-hidden')) return false;

    const style = computedStyle(current, environment);
    const display = style?.display?.toLowerCase();
    const visibility = style?.visibility?.toLowerCase();
    const opacity = Number.parseFloat(style?.opacity ?? '');
    if (display === 'none' || (isTarget && (visibility === 'hidden' || visibility === 'collapse')) || opacity === 0) return false;
    current = current.parentElement;
  }
  return true;
}

function computedStyle(target: WebFocusTarget, environment: WebFocusEnvironment): WebFocusStyle | undefined {
  const view = target.ownerDocument?.defaultView ?? environment.document?.defaultView;
  try {
    return view?.getComputedStyle?.(target) ?? target.style;
  } catch {
    return target.style;
  }
}

function hasAttribute(target: WebFocusTarget, name: string): boolean {
  return target.hasAttribute?.(name) ?? (target.getAttribute?.(name) !== null && target.getAttribute?.(name) !== undefined);
}

function isTrueAttribute(target: WebFocusTarget, name: string): boolean {
  return target.getAttribute?.(name)?.trim().toLowerCase() === 'true';
}
