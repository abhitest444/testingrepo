import { useMemo } from 'react';
import { getPageSize } from '../utils/calculatePageSize';

export const useAdaptivePageSize = (): number =>
  useMemo(
    () => getPageSize(typeof window !== 'undefined' ? window.innerHeight : 768),
    [],
  );
