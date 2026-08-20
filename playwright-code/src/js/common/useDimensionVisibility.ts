import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';

export interface UseDimensionVisibilityOptions {
  /** When false, suppresses dimensions regardless of other gates (STE). */
  isTimeEntry?: boolean;
  /** When false, suppresses dimensions regardless of other gates (STE OTX). */
  isOTX?: boolean;
}

export interface DimensionVisibility {
  /** True once all gates resolve in favour of showing dimensions. */
  isVisible: boolean;
  /** True while any gating dependency is still resolving. */
  loading: boolean;
}

/**
 * Shared gating for surfacing custom dimensions across capture surfaces
 * (weekly time entry, settings, Single Time, Time Clock, …).
 *
 * Visibility is delegated to the QbTime SDK `isDimensionEnabled` decision,
 * which encapsulates IES, Payroll Elite, IXP experiment, and feature-flag
 * checks. Surface-specific options (`isTimeEntry`, `isOTX`) still apply.
 */
export const useDimensionVisibility = (
  options: UseDimensionVisibilityOptions = {},
): DimensionVisibility => {
  const { isTimeEntry = true, isOTX = true } = options;

  const {
    data: isDimensionEnabled,
    loading,
    error,
  } = useQbTimeSdk<boolean>((sdk) => sdk.isDimensionEnabled, {
    executeOnMount: true,
  });

  const isVisible =
    isTimeEntry && isOTX && Boolean(isDimensionEnabled) && !error;
  return { isVisible, loading };
};
