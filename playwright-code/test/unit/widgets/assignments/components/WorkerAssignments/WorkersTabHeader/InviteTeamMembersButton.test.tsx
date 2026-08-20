import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { InviteTeamMembersButton } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTabHeader/InviteTeamMembersButton';

const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    logger: { info: mockLoggerInfo, error: mockLoggerError },
  }),
}));

interface MockWidgetProps {
  widgetId?: string;
  onReady?: () => void;
}

// Widget mock: emulate the remote widget mounting by firing onReady on render.
// (A useEffect here would trip react-hooks/rules-of-hooks since this factory
// function is not recognised as a React component.)
const mockWidget = jest.fn((props: MockWidgetProps): React.ReactElement => {
  const { widgetId, onReady } = props;
  onReady?.();
  return <div data-testid="invite-team-members-widget">{widgetId}</div>;
});

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: (props: any) => mockWidget(props),
}));

describe('InviteTeamMembersButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWidget.mockImplementation((props: MockWidgetProps) => {
      const { widgetId, onReady } = props;
      onReady?.();
      return <div data-testid="invite-team-members-widget">{widgetId}</div>;
    });
  });

  it('mounts the timecenter inviteTeamMembers widget', () => {
    render(<InviteTeamMembersButton />);

    expect(screen.getByTestId('invite-team-members-widget')).toHaveTextContent(
      'timecapture-timecenter-ui/inviteTeamMembers',
    );
  });

  it('passes the correct widgetId and the sandbox to the Widget', () => {
    render(<InviteTeamMembersButton />);

    expect(mockWidget).toHaveBeenCalledWith(
      expect.objectContaining({
        widgetId: 'timecapture-timecenter-ui/inviteTeamMembers',
        sandbox: expect.objectContaining({
          logger: expect.any(Object),
        }),
        onReady: expect.any(Function),
      }),
    );
  });

  it('logs when the widget reports ready', () => {
    render(<InviteTeamMembersButton />);

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      'Component="InviteTeamMembersButton" Event="Invite team members widget mounted"',
    );
  });
});
