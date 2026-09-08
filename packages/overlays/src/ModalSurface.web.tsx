import { useLayoutEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useUnistyles } from 'react-native-unistyles';

interface ModalSurfaceProps {
  visible: boolean;
  children: ReactNode;
  onRequestClose: () => void;
  animationType?: 'none' | 'fade';
  lockBackground?: boolean;
}

let backgroundLockCount = 0;
let previousBodyOverflow = '';

function lockDocumentBackground() {
  if (backgroundLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  backgroundLockCount += 1;

  return () => {
    backgroundLockCount = Math.max(0, backgroundLockCount - 1);
    if (backgroundLockCount === 0) {
      document.body.style.overflow = previousBodyOverflow;
      previousBodyOverflow = '';
    }
  };
}

/**
 * Web modal host. Unlike React Native Web's Modal, this host is deliberately
 * semantic-free so Dialog/BottomSheet can own the one modal boundary.
 */
function ModalSurface({ visible, children, lockBackground = false }: ModalSurfaceProps) {
  const { theme } = useUnistyles();
  const [host] = useState<HTMLDivElement | null>(() => typeof document === 'undefined' ? null : document.createElement('div'));

  useLayoutEffect(() => {
    if (!visible || !host || typeof document === 'undefined') return;
    host.dataset.precisionModalHost = 'true';
    host.style.position = 'fixed';
    host.style.inset = '0';
    host.style.display = 'flex';
    host.style.zIndex = String(theme.layers.modal);
    document.body.appendChild(host);
    const unlockBackground = lockBackground ? lockDocumentBackground() : undefined;
    return () => {
      unlockBackground?.();
      host.remove();
    };
  }, [host, lockBackground, theme.layers.modal, visible]);

  return visible && host ? createPortal(children, host) : null;
}

export { ModalSurface };
