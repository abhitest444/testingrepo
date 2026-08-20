import { useSandbox } from '@payroll/quicksand';
import { useMemo } from 'react';
import {
  QbTimeSdkFactory,
  QbTimeSdk,
  QbTimeSdkFactoryConfig,
} from '@work-timecapture/qbtime-sdk';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';

export const useGetQbTimeSdk = (config?: QbTimeSdkFactoryConfig): QbTimeSdk => {
  const sandbox = useSandbox();

  return useMemo(
    () =>
      QbTimeSdkFactory.getInstance(sandbox as QuickbooksOnlineSandbox, config),
    [sandbox, config],
  );
};

export default useGetQbTimeSdk;
