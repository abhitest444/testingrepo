import { getDecision } from '@core-app/variability-sync-sdk';

export const SUPPORTED_PAYROLL_REGIONS = ['US', 'CA', 'GB'];

export const computeIsPayTypeEnabled = (region?: string): boolean => {
  const isRegionSupported =
    !!region && SUPPORTED_PAYROLL_REGIONS.includes(region);
  return getDecision('isPayTypeEnabled', {
    defaultValue: isRegionSupported,
  });
};
