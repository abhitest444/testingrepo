import { useMemo } from 'react';
import { useIntl } from '@payroll/quicksand';
import { TourStep } from 'src/js/widgets/common/TourFramework/types';
import overtimeAnimation from 'src/assets/animations/overtime.json';

export const useOvertimeTourSteps = (): TourStep[] => {
  const intl = useIntl();

  return useMemo(
    () => [
      {
        id: 'step-1',
        title: intl.formatMessage({ id: 'overtime.tour.step.1.title' }),
        description: intl.formatMessage({
          id: 'overtime.tour.step.1.description',
        }),
        doneLabel: intl.formatMessage({
          id: 'overtime.tour.step.1.doneLabel',
        }),
        lottieData: overtimeAnimation,
      },
    ],
    [intl],
  );
};
