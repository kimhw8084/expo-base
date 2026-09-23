import { useEffect, useId, useRef, type RefObject } from 'react';
import { useOverlayManager } from './OverlayRootProvider';
import { isWebFocusEligible, type WebFocusTarget, type WebFocusWindow } from '../internal/web-focus-eligibility';

export interface OverlayLifecycleOptions {
  dismissOnEscape?: boolean;
  restoreFocus?: boolean;
  trapFocus?: boolean;
  containerRef?: RefObject<unknown>;
  restoreFocusRef?: RefObject<unknown>;
  restoreFocusId?: string;
  restoreFocusFallbackRef?: RefObject<unknown> | undefined;
  restoreFocusFallbackId?: string | undefined;
}

export type OverlayFocusTarget = WebFocusTarget & {
  focus: () => void;
  contains?: (target: OverlayFocusTarget | null) => boolean;
  querySelectorAll?: (selectors: string) => ArrayLike<OverlayFocusTarget>;
};

type WebLifecycleTarget = {
  document?: { activeElement?: OverlayFocusTarget | null; querySelector?: (selectors: string) => OverlayFocusTarget | null; getElementById?: (id: string) => OverlayFocusTarget | null; defaultView?: WebFocusWindow | null };
  requestAnimationFrame?: (callback: () => void) => number;
  cancelAnimationFrame?: (handle: number) => void;
  addEventListener?: (type: string, listener: (event: { key?: string; shiftKey?: boolean; preventDefault?: () => void }) => void) => void;
  removeEventListener?: (type: string, listener: (event: { key?: string; shiftKey?: boolean; preventDefault?: () => void }) => void) => void;
};

export function useOverlayLifecycle(
  open: boolean,
  onClose: () => void,
  { dismissOnEscape = true, restoreFocus = true, trapFocus = false, containerRef, restoreFocusRef, restoreFocusId, restoreFocusFallbackRef, restoreFocusFallbackId }: OverlayLifecycleOptions = {},
) {
  const id = useId();
  const manager = useOverlayManager();
  const restoreTarget = useRef<OverlayFocusTarget | null>(null);
  const restoreFrame = useRef<number | null>(null);
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) { manager.unregister(id); return; }
    manager.register(id, onClose);
    return () => manager.unregister(id);
  }, [id, manager, onClose, open]);

  useEffect(() => {
    const target = globalThis as unknown as WebLifecycleTarget;
    if (!target.document) return;

    const cancelPendingRestore = () => {
      if (restoreFrame.current !== null) {
        target.cancelAnimationFrame?.(restoreFrame.current);
        restoreFrame.current = null;
      }
      if (restoreTimer.current !== null) {
        clearTimeout(restoreTimer.current);
        restoreTimer.current = null;
      }
    };

    const schedule = (callback: () => void) => {
      if (target.requestAnimationFrame) {
        restoreFrame.current = target.requestAnimationFrame(() => {
          restoreFrame.current = null;
          callback();
        });
      } else {
        restoreTimer.current = setTimeout(() => {
          restoreTimer.current = null;
          callback();
        }, 0);
      }
    };

    if (open && !wasOpen.current) {
      cancelPendingRestore();
      const activeElement = target.document.activeElement;
      restoreTarget.current = resolveRestorationCandidate(restoreFocusRef, restoreFocusId, target)
        ?? (activeElement && typeof activeElement.focus === 'function' && activeElement.isConnected !== false ? activeElement : null);
      if (trapFocus) {
        schedule(() => focusOverlayContainer(containerRef, target));
      }
    }

    if (!open && wasOpen.current && restoreFocus) {
      const previousTarget = restoreTarget.current;
      restoreTarget.current = null;
      const restore = () => {
        if (!manager.mayRestoreFocus(id)) return;
        const targetToRestore = previousTarget && isWebFocusEligible(previousTarget, target)
          ? previousTarget
          : resolveRestorationTarget(restoreFocusFallbackRef, restoreFocusFallbackId, target);
        if (targetToRestore && isWebFocusEligible(targetToRestore, target)) targetToRestore.focus();
      };
      schedule(restore);
    }

    wasOpen.current = open;
    return cancelPendingRestore;
  }, [containerRef, id, manager, open, restoreFocus, restoreFocusFallbackId, restoreFocusFallbackRef, restoreFocusId, restoreFocusRef, trapFocus]);

  useEffect(() => () => {
    const target = globalThis as unknown as WebLifecycleTarget;
    if (restoreFrame.current !== null) target.cancelAnimationFrame?.(restoreFrame.current);
    if (restoreTimer.current !== null) clearTimeout(restoreTimer.current);
    restoreFrame.current = null;
    restoreTimer.current = null;
  }, []);

  useEffect(() => {
    if (!open || !dismissOnEscape) return;
    const target = globalThis as unknown as WebLifecycleTarget;
    if (!target.addEventListener || !target.removeEventListener) return;
    const listener = (event: { key?: string }) => { if (event.key === 'Escape') onClose(); };
    target.addEventListener('keydown', listener);
    return () => target.removeEventListener?.('keydown', listener);
  }, [dismissOnEscape, onClose, open]);

  useEffect(() => {
    if (!open || !trapFocus) return;
    const target = globalThis as unknown as WebLifecycleTarget;
    if (!target.addEventListener || !target.removeEventListener) return;
    const listener = (event: { key?: string; shiftKey?: boolean; preventDefault?: () => void }) => {
      if (event.key !== 'Tab') return;
      const container = resolveFocusContainer(containerRef, target);
      if (!container || !isWebFocusEligible(container, target)) return;
      const focusable = findFocusable(container, target);
      if (focusable.length === 0) {
        event.preventDefault?.();
        container.focus();
        return;
      }
      const active = target.document?.activeElement;
      const index = active ? focusable.indexOf(active) : -1;
      if (index < 0) {
        event.preventDefault?.();
        focusable[event.shiftKey ? focusable.length - 1 : 0]?.focus();
        return;
      }
      const next = event.shiftKey ? index <= 0 ? focusable.length - 1 : index - 1 : index === focusable.length - 1 ? 0 : Math.max(0, index + 1);
      if (next !== index + (event.shiftKey ? -1 : 1)) {
        event.preventDefault?.();
        focusable[next]?.focus();
      }
    };
    target.addEventListener('keydown', listener);
    return () => target.removeEventListener?.('keydown', listener);
  }, [containerRef, open, trapFocus]);
}

function focusOverlayContainer(containerRef: RefObject<unknown> | undefined, target: WebLifecycleTarget) {
  const container = resolveFocusContainer(containerRef, target);
  if (!container || !isWebFocusEligible(container, target)) return;
  const first = findFocusable(container, target)[0];
  if (first) first.focus();
  else container.focus();
}

function resolveFocusContainer(containerRef: RefObject<unknown> | undefined, target: WebLifecycleTarget): OverlayFocusTarget | null {
  return target.document?.querySelector?.('[aria-modal="true"]')
    ?? asFocusTarget(containerRef?.current)
    ?? null;
}

function resolveRestorationTarget(restoreFocusRef: RefObject<unknown> | undefined, restoreFocusId: string | undefined, lifecycleTarget: WebLifecycleTarget): OverlayFocusTarget | null {
  const target = (restoreFocusId ? lifecycleTarget.document?.getElementById?.(restoreFocusId) : null)
    ?? asFocusTarget(restoreFocusRef?.current);
  if (!target) return null;
  if (target.querySelectorAll) {
    const first = findFocusable(target, lifecycleTarget)[0];
    if (first) return first;
  }
  return isWebFocusEligible(target, lifecycleTarget) ? target : null;
}

function resolveRestorationCandidate(restoreFocusRef: RefObject<unknown> | undefined, restoreFocusId: string | undefined, lifecycleTarget: WebLifecycleTarget): OverlayFocusTarget | null {
  const target = (restoreFocusId ? lifecycleTarget.document?.getElementById?.(restoreFocusId) : null)
    ?? asFocusTarget(restoreFocusRef?.current);
  if (!target) return null;
  if (target.querySelectorAll) {
    const firstEligibleDescendant = findFocusable(target, lifecycleTarget)[0];
    if (firstEligibleDescendant) return firstEligibleDescendant;
  }
  return target.isConnected === false ? null : target;
}

function asFocusTarget(value: unknown): OverlayFocusTarget | null {
  return value && typeof (value as OverlayFocusTarget).focus === 'function' ? value as OverlayFocusTarget : null;
}

function findFocusable(container: OverlayFocusTarget, lifecycleTarget: WebLifecycleTarget): OverlayFocusTarget[] {
  return container.querySelectorAll
    ? Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((target) => isWebFocusEligible(target, lifecycleTarget))
    : [];
}
