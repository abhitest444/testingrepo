import React from 'react';
import { render, screen } from '@testing-library/react';
import Widget from '../../../../src/js/widgets/quickFind/Widget';

const mockSandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  },
} as any;

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  QuicksandProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('src/nls', () => ({
  requireNlsForLocale: jest.fn(() => ({})),
}));

jest.mock('src/js/widgets/quickFind/components/QuickFindContent', () => ({
  __esModule: true,
  default: ({ options }: any) => (
    <div data-testid="quick-find-content">
      <div>Quick Find Content</div>
      <div>Props: {JSON.stringify(options?.props || {})}</div>
    </div>
  ),
}));

describe('Widget', () => {
  const defaultProps = {
    sandbox: mockSandbox,
    options: {
      feature: 'quick-find' as const,
      functionality: 'default' as const,
      props: {
        dropdownType: 'team-member',
        subTypes: ['EMPLOYEE', 'VENDOR'],
        onTeamMemberChange: jest.fn(),
        onReady: jest.fn(),
        onError: jest.fn(),
        label: 'Team Member',
        placeholder: 'Select a team member...',
        errorText: 'This field is required',
      },
    },
    onReady: jest.fn(),
    onError: jest.fn(),
    open: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Widget {...defaultProps} />);

    expect(screen.getByTestId('quick-find-content')).toBeInTheDocument();
  });

  it('displays Quick Find Content', () => {
    render(<Widget {...defaultProps} />);

    expect(screen.getByText('Quick Find Content')).toBeInTheDocument();
  });

  it('passes options to QuickFindContent', () => {
    const customOptions = {
      feature: 'quick-find' as const,
      functionality: 'default' as const,
      props: {
        dropdownType: 'team-member',
        subTypes: ['EMPLOYEE'],
        onTeamMemberChange: jest.fn(),
        onReady: jest.fn(),
        onError: jest.fn(),
        label: 'Custom Label',
        placeholder: 'Custom Placeholder',
        errorText: 'Custom Error',
      },
    };

    render(<Widget {...defaultProps} options={customOptions} />);

    expect(
      screen.getByText(`Props: ${JSON.stringify(customOptions.props)}`),
    ).toBeInTheDocument();
  });

  it('handles component mount correctly', () => {
    const mockReady = jest.fn();
    const widget = new Widget(defaultProps);
    widget.ready = mockReady;

    widget.componentDidMount();

    expect(mockReady).toHaveBeenCalled();
  });

  it('handles component errors correctly', () => {
    const error = new Error('Test error');
    const widget = new Widget(defaultProps);

    widget.componentDidCatch(error);

    expect(mockSandbox.logger.error).toHaveBeenCalledWith(
      'Plugin=time-tracking-ui Error=QUICK_FIND_CRASH',
      { error },
    );
    expect(defaultProps.onError).toHaveBeenCalledWith(error);
  });

  it('does not call onReady during construction', () => {
    const onReady = jest.fn();
    const props = { ...defaultProps, onReady };

    const widget = new Widget(props);

    // The widget constructor does not call onReady automatically
    expect(onReady).not.toHaveBeenCalled();
  });

  it('handles component unmount correctly', () => {
    const widget = new Widget(defaultProps);
    widget.componentWillUnmount();

    expect(mockSandbox.logger.log).toHaveBeenCalledWith(
      'Component=Widget Message=Quick Find Unmounted',
    );
  });
});
