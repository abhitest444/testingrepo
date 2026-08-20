import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectSearchInput from 'src/js/widgets/timeProject/components/ProjectSearchInput';
import { LANDING_PAGE_TRACKING_POINTS } from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';

const mockTrack = jest.fn();
const mockUseLandingPageTrackingPoints = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useTracking: () => mockTrack,
}));

jest.mock(
  'src/js/widgets/timeProject/hooks/useLandingPageTrackingPoints',
  () => ({
    useLandingPageTrackingPoints: () => mockUseLandingPageTrackingPoints(),
  }),
);

jest.mock('src/js/widgets/common/SearchField', () => ({
  SearchField: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="search-field"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

jest.mock(
  'src/js/widgets/timeProject/components/TimeProjectFilters.styled',
  () => ({
    SearchItem: ({ children, 'data-testid': testId }: any) => (
      <div data-testid={testId}>{children}</div>
    ),
  }),
);

describe('ProjectSearchInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLandingPageTrackingPoints.mockReturnValue(
      LANDING_PAGE_TRACKING_POINTS,
    );
  });

  it('renders the search field', () => {
    render(<ProjectSearchInput value="" onChange={mockOnChange} />);
    expect(screen.getByTestId('time-project-search')).toBeInTheDocument();
  });

  it('tracks CLICK_SEARCH_ICON on change and calls onChange', () => {
    render(<ProjectSearchInput value="" onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId('search-field'), {
      target: { value: 'test' },
    });
    expect(mockTrack).toHaveBeenCalledWith(
      LANDING_PAGE_TRACKING_POINTS.CLICK_SEARCH_ICON,
    );
    expect(mockOnChange).toHaveBeenCalledWith('test');
  });
});
