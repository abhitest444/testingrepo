import React from 'react';
import { useSandbox } from '@payroll/quicksand';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { WorkerNameType } from 'src/js/widgets/assignments/types';

interface InviteWorkerDrawerProps {
  inviteWorkerType?: WorkerNameType;
  setInviteWorkerType: React.Dispatch<
    React.SetStateAction<WorkerNameType | undefined>
  >;
}

/**
 * InviteWorkerDrawer Component
 * Wrapper for employee-management-ui/inviteWrapper to invite workers to track time
 *
 * Responsibilities:
 * - Opens invite drawer for employees or contractors
 * - Translates WorkerNameType enum values to the string literals expected by inviteWrapper
 * - Closes the drawer on back, done, or updateShow callbacks
 */
const InviteWorkerDrawer: React.FC<InviteWorkerDrawerProps> = ({
  inviteWorkerType,
  setInviteWorkerType,
}) => {
  const sandbox = useSandbox();

  function getWidgetWorkerType() {
    if (inviteWorkerType === WorkerNameType.EMPLOYEE) {
      return 'EMPLOYEE';
    }
    if (inviteWorkerType === WorkerNameType.CONTRACTOR) {
      return 'CONTRACTOR';
    }
    return undefined;
  }

  return (
    <Widget
      widgetId="employee-management-ui/inviteWrapper"
      back={() => setInviteWorkerType(undefined)}
      show={inviteWorkerType !== undefined}
      workerType={getWidgetWorkerType()}
      drawerMode="WORKFORCE_AND_TRACK_TIME"
      onDoneClick={() => setInviteWorkerType(undefined)}
      updateShow={() => setInviteWorkerType(undefined)}
      sandbox={sandbox}
    />
  );
};

export default InviteWorkerDrawer;
