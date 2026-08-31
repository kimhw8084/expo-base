import { useState } from 'react';

export function useInteractionState() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return {
    hovered,
    focused,
    interactionProps: {
      onHoverIn: () => setHovered(true),
      onHoverOut: () => setHovered(false),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
  } as const;
}
