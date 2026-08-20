import React from 'react';
import { useIntl } from '@payroll/quicksand';
import { TourStep } from 'src/js/widgets/common/TourFramework/types';
import firstStep from 'src/assets/animations/assignments/custom-field-settings/step-1.json';
import secondStep from 'src/assets/animations/assignments/custom-field-settings/step-2.json';
import thirdStep from 'src/assets/animations/assignments/custom-field-settings/step-3.json';

/**
 * Custom Fields tour steps
 * Shows users how to navigate custom fields assignments
 * Pattern matches AssignmentTourSteps - steps are always created with refs
 */
export const CustomFieldsTourSteps = (
  customFieldsTableRef: React.RefObject<HTMLElement>,
  customersColumnRef: React.RefObject<HTMLElement>,
  workersColumnRef: React.RefObject<HTMLElement>,
  intl: ReturnType<typeof useIntl>,
): TourStep[] => {
  const steps: TourStep[] = [
    {
      id: 'step-1',
      title: intl.formatMessage({ id: 'customFields.tour.table.step.1.title' }),
      description: intl.formatMessage({
        id: 'customFields.tour.table.step.1.description',
      }),
      showOverlay: false,
      position: 'right',
      alignment: 'center',
      targetRef: customFieldsTableRef,
      nextLabel: intl.formatMessage({
        id: 'customFields.tour.table.step.1.nextLabel',
      }),
      lottieData: firstStep,
    },
    {
      id: 'step-2',
      title: intl.formatMessage({ id: 'customFields.tour.table.step.2.title' }),
      description: intl.formatMessage({
        id: 'customFields.tour.table.step.2.description',
      }),
      showOverlay: false,
      position: 'right',
      alignment: 'center',
      targetRef: customersColumnRef,
      nextLabel: intl.formatMessage({
        id: 'customFields.tour.table.step.2.nextLabel',
      }),
      lottieData: secondStep,
    },
    {
      id: 'step-3',
      title: intl.formatMessage({ id: 'customFields.tour.table.step.3.title' }),
      description: intl.formatMessage({
        id: 'customFields.tour.table.step.3.description',
      }),
      showOverlay: false,
      position: 'right',
      alignment: 'center',
      targetRef: workersColumnRef,
      nextLabel: intl.formatMessage({
        id: 'customFields.tour.table.step.3.nextLabel',
      }),
      lottieData: thirdStep,
    },
  ];

  return steps;
};
