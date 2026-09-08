import type { ReactNode } from 'react';
import { Modal } from 'react-native';

interface ModalSurfaceProps {
  visible: boolean;
  children: ReactNode;
  onRequestClose: () => void;
  animationType?: 'none' | 'fade';
  lockBackground?: boolean;
}

/** Native modal host. Web supplies a portal host without an extra semantic dialog. */
function ModalSurface({ visible, children, onRequestClose, animationType = 'none' }: ModalSurfaceProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onRequestClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {children}
    </Modal>
  );
}

export { ModalSurface };
