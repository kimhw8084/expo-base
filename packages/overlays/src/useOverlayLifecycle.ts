import { useEffect, useId } from 'react';
import { useOverlayManager } from './OverlayRootProvider';

export function useOverlayLifecycle(open: boolean, onClose: () => void) {
  const id = useId();
  const manager = useOverlayManager();
  useEffect(() => {
    if (!open) { manager.unregister(id); return; }
    manager.register(id, onClose);
    return () => manager.unregister(id);
  }, [id, manager, onClose, open]);

  useEffect(() => {
    if (!open) return;
    const target = globalThis as unknown as { addEventListener?: (type: string, listener: (event: { key?: string }) => void) => void; removeEventListener?: (type: string, listener: (event: { key?: string }) => void) => void };
    if (!target.addEventListener || !target.removeEventListener) return;
    const listener = (event: { key?: string }) => { if (event.key === 'Escape') onClose(); };
    target.addEventListener('keydown', listener);
    return () => target.removeEventListener?.('keydown', listener);
  }, [onClose, open]);
}
