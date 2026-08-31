import { createContext, useContext, type PropsWithChildren } from 'react';
import type { SpacingToken } from '@precision-calm/tokens';

export type PrecisionDensity = 'comfortable' | 'compact';
const DensityContext = createContext<PrecisionDensity>('comfortable');

export function DensityProvider({ density, children }: PropsWithChildren<{ density: PrecisionDensity }>) {
  return <DensityContext.Provider value={density}>{children}</DensityContext.Provider>;
}

export function useDensity(): PrecisionDensity {
  return useContext(DensityContext);
}

export function densitySpacingToken(token: Exclude<SpacingToken, 'none' | 'xxs'>, density: PrecisionDensity): Exclude<SpacingToken, 'none' | 'xxs'> {
  if (density === 'comfortable') return token;
  const compact: Record<Exclude<SpacingToken, 'none' | 'xxs'>, Exclude<SpacingToken, 'none' | 'xxs'>> = {
    xs: 'xs', sm: 'sm', md: 'sm', lg: 'md', xl: 'lg', xxl: 'xl', xxxl: 'xxl', huge: 'xxxl', massive: 'huge',
  };
  return compact[token];
}
