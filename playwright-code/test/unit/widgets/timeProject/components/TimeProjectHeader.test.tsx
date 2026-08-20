import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeProjectHeader from 'src/js/widgets/timeProject/components/TimeProjectHeader';
import { LANDING_PAGE_TRACKING_POINTS } from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';
import { useProjectsSdkFlags } from 'src/js/widgets/timeProject/hooks/useProjectsSdkFlags';
import { useLandingPageTrackingPoints } from 'src/js/widgets/timeProject/hooks/useLandingPageTrackingPoints';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn().mockReturnValue(false),
}));

const mockTrack = jest.fn();
const mockNavigate = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useTracking: () => mockTrack,
  useSandbox: () => ({
    navigation: { navigate: mockNavigate },
    logger: { error: mockLoggerError },
  }),
}));

jest.mock('src/js/widgets/timeProject/hooks/useProjectsSdkFlags', () => ({
  useProjectsSdkFlags: jest.fn(),
}));

jest.mock(
  'src/js/widgets/timeProject/hooks/useLandingPageTrackingPoints',
  () => ({
    useLandingPageTrackingPoints: jest.fn(),
  }),
);

jest.mock('@ids-ts/button', () => (props: any) => (
  <button onClick={props.onClick} data-testid="manage-projects-btn">
    {props.children}
  </button>
));

describe('TimeProjectHeader', () => {
  const mockUseProjectsSdkFlags = useProjectsSdkFlags as jest.MockedFunction<
    typeof useProjectsSdkFlags
  >;
  const mockUseLandingPageTrackingPoints =
    useLandingPageTrackingPoints as jest.MockedFunction<
      typeof useLandingPageTrackingPoints
    >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProjectsSdkFlags.mockReturnValue({
      isProjectsManageProjectsEnabled: true,
      isProjectsAssignWorkersEnabled: true,
      isProjectsEditEstimatesEnabled: true,
      isProjectsEditDateEnabled: true,
      loading: false,
      error: undefined,
    });
    mockUseLandingPageTrackingPoints.mockReturnValue(
      LANDING_PAGE_TRACKING_POINTS,
    );
  });

  it('renders manage projects button', () => {
    render(<TimeProjectHeader />);
    expect(screen.getByTestId('manage-projects-btn')).toBeInTheDocument();
  });

  it('tracks CLICK_MANAGE_PROJECTS and navigates on button click', () => {
    render(<TimeProjectHeader />);
    fireEvent.click(screen.getByTestId('manage-projects-btn'));
    expect(mockTrack).toHaveBeenCalledWith(
      LANDING_PAGE_TRACKING_POINTS.CLICK_MANAGE_PROJECTS,
    );
    expect(mockNavigate).toHaveBeenCalledWith('/app/projects');
  });

  it('tracks even when navigation throws', () => {
    mockNavigate.mockImplementation(() => {
      throw new Error('nav error');
    });
    render(<TimeProjectHeader />);
    fireEvent.click(screen.getByTestId('manage-projects-btn'));
    expect(mockTrack).toHaveBeenCalledWith(
      LANDING_PAGE_TRACKING_POINTS.CLICK_MANAGE_PROJECTS,
    );
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it('hides manage projects button when sdk flag is false', () => {
    mockUseProjectsSdkFlags.mockReturnValue({
      isProjectsManageProjectsEnabled: false,
      isProjectsAssignWorkersEnabled: true,
      isProjectsEditEstimatesEnabled: true,
      isProjectsEditDateEnabled: true,
      loading: false,
      error: undefined,
    });
    render(<TimeProjectHeader />);
    expect(screen.queryByTestId('manage-projects-btn')).not.toBeInTheDocument();
  });

  it('hides manage projects button for Workforce (WFS) users', () => {
    // WFS users don't have the manage-projects flow — the button must
    // be absent so the tour anchor ref is never set and GuidedTooltip
    // doesn't stall waiting for a ref that never arrives.
    (isWorkforceEnvironment as jest.Mock).mockReturnValueOnce(true);
    render(<TimeProjectHeader />);
    expect(screen.queryByTestId('manage-projects-btn')).not.toBeInTheDocument();
  });
});
