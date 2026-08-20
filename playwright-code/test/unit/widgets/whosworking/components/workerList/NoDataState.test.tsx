import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { NoDataState } from 'src/js/widgets/whosworking/components/workerList/NoDataState';

const mockUseQbTimeSdk = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }, values?: any) => {
      const messages: Record<string, string> = {
        'whosWorking.noData.noOneOnClock': "No one's on the clock",
        'whosWorking.noData.noSearchResults': `Nothing matches "${
          values?.searchText || ''
        }"`,
        'whosWorking.noData.lookingForOthers': 'Looking for other employees?',
        'whosWorking.noData.employeeListLink': 'Go to Employee list',
        'whosWorking.noData.noEmployees': 'No employees found',
      };
      return messages[id] || id;
    },
  }),
}));

jest.mock('src/js/service/hooks/useQbTimeSdk', () => ({
  useQbTimeSdk: (...args: unknown[]) => mockUseQbTimeSdk(...args),
}));

jest.mock('@ids-ts/typography', () => ({
  B2: ({ children, weight }: any) => (
    <span data-testid="b2-text" data-weight={weight}>
      {children}
    </span>
  ),
  B3: ({ children }: any) => <span data-testid="b3-text">{children}</span>,
}));

jest.mock('@ids-ts/link', () => ({
  __esModule: true,
  default: ({ children, href, type, size }: any) => (
    <a data-testid="link" href={href} data-type={type} data-size={size}>
      {children}
    </a>
  ),
}));

jest.mock('src/assets/images/NoOneOnClock.svg', () => 'no-one-on-clock.svg');
jest.mock('src/assets/images/Search.svg', () => 'search.svg');

describe('NoDataState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQbTimeSdk.mockReturnValue({ data: true });
  });

  describe('Rendering', () => {
    it('renders the component', () => {
      render(<NoDataState displayBy="ON_CLOCK_ONLY" />);

      expect(screen.getByTestId('b2-text')).toBeInTheDocument();
    });
  });

  describe('ON_CLOCK_ONLY Display Mode', () => {
    it('shows "No one on the clock" message', () => {
      render(<NoDataState displayBy="ON_CLOCK_ONLY" />);

      expect(screen.getByTestId('b2-text')).toHaveTextContent(
        "No one's on the clock",
      );
    });

    it('displays NoOneOnClock image', () => {
      render(<NoDataState displayBy="ON_CLOCK_ONLY" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'no-one-on-clock.svg');
    });

    it('does not show search results message', () => {
      render(<NoDataState displayBy="ON_CLOCK_ONLY" />);

      expect(screen.queryByText(/Nothing matches/)).not.toBeInTheDocument();
    });
  });

  describe('BY_GROUP Display Mode', () => {
    it('shows "No one on the clock" message', () => {
      render(<NoDataState displayBy="BY_GROUP" />);

      expect(screen.getByTestId('b2-text')).toHaveTextContent(
        "No one's on the clock",
      );
    });

    it('displays NoOneOnClock image', () => {
      render(<NoDataState displayBy="BY_GROUP" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'no-one-on-clock.svg');
    });
  });

  describe('ALL_EMPLOYEES Display Mode', () => {
    it('shows "No employees found" message', () => {
      render(<NoDataState displayBy="ALL_EMPLOYEES" />);

      expect(screen.getByTestId('b2-text')).toHaveTextContent(
        'No employees found',
      );
    });

    it('does not display any image', () => {
      render(<NoDataState displayBy="ALL_EMPLOYEES" />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Search Results State', () => {
    it('shows "Nothing matches" message when searchText is provided', () => {
      render(<NoDataState displayBy="ON_CLOCK_ONLY" searchText="John" />);

      expect(screen.getByTestId('b2-text')).toHaveTextContent(
        'Nothing matches "John"',
      );
    });

    it('displays search image when searchText is provided', () => {
      render(<NoDataState displayBy="ON_CLOCK_ONLY" searchText="John" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'search.svg');
    });

    it('shows employee list link for non-WFS users', () => {
      render(<NoDataState displayBy="ON_CLOCK_ONLY" searchText="John" />);

      const link = screen.getByTestId('link');
      expect(link).toHaveTextContent('Go to Employee list');
      expect(link).toHaveAttribute('href', '/app/time/team?jobId=time');
    });

    it('hides employee list link for WFS employee or contractor users', () => {
      mockUseQbTimeSdk.mockReturnValue({ data: false });

      render(<NoDataState displayBy="ON_CLOCK_ONLY" searchText="John" />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Looking for other employees?'),
      ).not.toBeInTheDocument();
    });

    it('hides employee list link while WFS role is loading', () => {
      mockUseQbTimeSdk.mockReturnValue({ data: undefined });

      render(<NoDataState displayBy="ON_CLOCK_ONLY" searchText="John" />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('shows employee list link for WFS users who are not employees or contractors', () => {
      mockUseQbTimeSdk.mockReturnValue({ data: true });

      render(<NoDataState displayBy="ON_CLOCK_ONLY" searchText="John" />);

      expect(screen.getByTestId('link')).toBeInTheDocument();
    });

    it('takes precedence over displayBy', () => {
      render(<NoDataState displayBy="BY_GROUP" searchText="Jane" />);

      expect(screen.getByTestId('b2-text')).toHaveTextContent(
        'Nothing matches "Jane"',
      );
    });
  });

  describe('Empty Search Text', () => {
    it('treats empty string as no search', () => {
      render(<NoDataState displayBy="ON_CLOCK_ONLY" searchText="" />);

      expect(screen.getByTestId('b2-text')).toHaveTextContent(
        "No one's on the clock",
      );
    });
  });

  describe('Default Props', () => {
    it('handles missing searchText prop', () => {
      render(<NoDataState displayBy="ON_CLOCK_ONLY" />);

      expect(screen.getByTestId('b2-text')).toBeInTheDocument();
    });

    it('uses empty string as default searchText', () => {
      render(<NoDataState displayBy="ALL_EMPLOYEES" />);

      expect(screen.getByTestId('b2-text')).toHaveTextContent(
        'No employees found',
      );
    });
  });

  describe('Accessibility', () => {
    it('has alt text on NoOneOnClock image', () => {
      render(<NoDataState displayBy="ON_CLOCK_ONLY" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', "No one's on the clock");
    });
  });
});
