import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import InviteWorkerDrawer from 'src/js/widgets/assignments/components/WorkerAssignments/InviteWorkerDrawer';
import { WorkerNameType } from 'src/js/widgets/assignments/types';

const mockSandbox = { logger: { info: jest.fn(), error: jest.fn() } };

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => mockSandbox,
}));

// Mock HOCWidget to expose all props for testing
jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({
    widgetId,
    show,
    workerType,
    drawerMode,
    back,
    onDoneClick,
    updateShow,
  }: any) => (
    <div
      data-testid="invite-widget"
      data-widget-id={widgetId}
      data-show={String(show)}
      data-worker-type={workerType ?? 'undefined'}
      data-drawer-mode={drawerMode}
    >
      <button data-testid="widget-back-btn" onClick={back}>
        Back
      </button>
      <button data-testid="widget-done-btn" onClick={onDoneClick}>
        Done
      </button>
      <button data-testid="widget-update-show-btn" onClick={updateShow}>
        UpdateShow
      </button>
    </div>
  ),
}));

describe('InviteWorkerDrawer', () => {
  const mockSetInviteWorkerType = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the widget with correct widgetId', () => {
      render(
        <InviteWorkerDrawer
          inviteWorkerType={WorkerNameType.EMPLOYEE}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      expect(screen.getByTestId('invite-widget')).toHaveAttribute(
        'data-widget-id',
        'employee-management-ui/inviteWrapper',
      );
    });

    it('renders with show=true when inviteWorkerType is set', () => {
      render(
        <InviteWorkerDrawer
          inviteWorkerType={WorkerNameType.EMPLOYEE}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      expect(screen.getByTestId('invite-widget')).toHaveAttribute(
        'data-show',
        'true',
      );
    });

    it('renders with show=false when inviteWorkerType is undefined', () => {
      render(
        <InviteWorkerDrawer
          inviteWorkerType={undefined}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      expect(screen.getByTestId('invite-widget')).toHaveAttribute(
        'data-show',
        'false',
      );
    });

    it('renders with drawerMode WORKFORCE_AND_TRACK_TIME', () => {
      render(
        <InviteWorkerDrawer
          inviteWorkerType={WorkerNameType.EMPLOYEE}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      expect(screen.getByTestId('invite-widget')).toHaveAttribute(
        'data-drawer-mode',
        'WORKFORCE_AND_TRACK_TIME',
      );
    });
  });

  describe('workerType mapping', () => {
    it('passes workerType="EMPLOYEE" when inviteWorkerType is WorkerNameType.EMPLOYEE', () => {
      render(
        <InviteWorkerDrawer
          inviteWorkerType={WorkerNameType.EMPLOYEE}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      expect(screen.getByTestId('invite-widget')).toHaveAttribute(
        'data-worker-type',
        'EMPLOYEE',
      );
    });

    it('passes workerType="CONTRACTOR" when inviteWorkerType is WorkerNameType.CONTRACTOR', () => {
      render(
        <InviteWorkerDrawer
          inviteWorkerType={WorkerNameType.CONTRACTOR}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      expect(screen.getByTestId('invite-widget')).toHaveAttribute(
        'data-worker-type',
        'CONTRACTOR',
      );
    });

    it('passes workerType=undefined when inviteWorkerType is undefined', () => {
      render(
        <InviteWorkerDrawer
          inviteWorkerType={undefined}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      expect(screen.getByTestId('invite-widget')).toHaveAttribute(
        'data-worker-type',
        'undefined',
      );
    });
  });

  describe('Close callbacks', () => {
    it('calls setInviteWorkerType(undefined) when back is triggered', () => {
      render(
        <InviteWorkerDrawer
          inviteWorkerType={WorkerNameType.EMPLOYEE}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-back-btn'));
      expect(mockSetInviteWorkerType).toHaveBeenCalledWith(undefined);
      expect(mockSetInviteWorkerType).toHaveBeenCalledTimes(1);
    });

    it('calls setInviteWorkerType(undefined) when onDoneClick is triggered', () => {
      render(
        <InviteWorkerDrawer
          inviteWorkerType={WorkerNameType.EMPLOYEE}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-done-btn'));
      expect(mockSetInviteWorkerType).toHaveBeenCalledWith(undefined);
      expect(mockSetInviteWorkerType).toHaveBeenCalledTimes(1);
    });

    it('calls setInviteWorkerType(undefined) when updateShow is triggered', () => {
      render(
        <InviteWorkerDrawer
          inviteWorkerType={WorkerNameType.EMPLOYEE}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      fireEvent.click(screen.getByTestId('widget-update-show-btn'));
      expect(mockSetInviteWorkerType).toHaveBeenCalledWith(undefined);
      expect(mockSetInviteWorkerType).toHaveBeenCalledTimes(1);
    });
  });
});
