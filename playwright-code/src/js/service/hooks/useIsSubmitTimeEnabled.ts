import { useQbTimeSdk } from './useQbTimeSdk';

/**
 * Returns whether the Submit Time capability is enabled for the current account.
 * Wraps `useQbTimeSdk` so consumers don't repeat the SDK method + options.
 */
export const useIsSubmitTimeEnabled = (): boolean | undefined => {
  const { data } = useQbTimeSdk<boolean>(
    (sdk) => sdk.submitTimeService.isSubmitTimeEnabled,
    { executeOnMount: true },
  );
  return data;
};
