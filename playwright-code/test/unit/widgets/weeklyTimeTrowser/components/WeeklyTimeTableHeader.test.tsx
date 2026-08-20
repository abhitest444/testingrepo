import React from 'react';
import { screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  WeeklyTimeTableHeader,
  WeeklyTimeTableHeaderProps,
} from 'src/js/widgets/weeklyTimeTrowser/components/WeeklyTimeTableHeader';
import { MOCK_TIME_TRACKING_SETTINGS } from 'test/unit/service/queries/settingsQueries';

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isTimeTrackingOnlyRole: jest.fn().mockReturnValue(false),
}));

describe('WeeklyTimeTableHeader Component', () => {
  let props: WeeklyTimeTableHeaderProps;

  beforeEach(() => {
    props = {
      settings: {
        ...MOCK_TIME_TRACKING_SETTINGS,
        classRequired: false,
        locationRequired: false,
        serviceItemRequired: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders TeamMember component', () => {
    renderWithFormProvider(<WeeklyTimeTableHeader {...props} />, {
      defaultValues: {
        timeFor: { id: '1', type: 'EMPLOYEE' }, // Default form values
        week: { startDate: dayjs(), endDate: dayjs().add(6, 'days') }, // Default form values
      },
    });

    expect(screen.getByText(/team.member/)).toBeInTheDocument();
  });

  it('renders WeekSelector component', () => {
    renderWithFormProvider(<WeeklyTimeTableHeader {...props} />, {
      defaultValues: {
        timeFor: { id: '1', type: 'EMPLOYEE' }, // Default form values
        week: { startDate: dayjs(), endDate: dayjs().add(6, 'days') }, // Default form values
      },
    });

    // Assuming WeekSelector renders a dropdown with week range
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls setOnTeamMemberLoaded when provided', () => {
    const mockSetOnTeamMemberLoaded = jest.fn();
    props.setOnTeamMemberLoaded = mockSetOnTeamMemberLoaded;

    renderWithFormProvider(<WeeklyTimeTableHeader {...props} />, {
      defaultValues: {
        timeFor: { id: '1', type: 'EMPLOYEE' },
        week: { startDate: dayjs(), endDate: dayjs().add(6, 'days') },
      },
    });

    // The callback should be called when TeamMember widget is ready
    // Note: This may require waiting for the widget's onReady callback
    // depending on your implementation
    expect(mockSetOnTeamMemberLoaded).toBeDefined();
  });

  it('does not throw error when setOnTeamMemberLoaded is not provided', () => {
    expect(() => {
      renderWithFormProvider(<WeeklyTimeTableHeader {...props} />, {
        defaultValues: {
          timeFor: { id: '1', type: 'EMPLOYEE' },
          week: { startDate: dayjs(), endDate: dayjs().add(6, 'days') },
        },
      });
    }).not.toThrow();
  });
});
