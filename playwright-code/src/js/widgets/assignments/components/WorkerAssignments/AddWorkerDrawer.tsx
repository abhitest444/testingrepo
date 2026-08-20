import React, { useMemo } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { WorkerNameType } from 'src/js/widgets/assignments/types';

interface AddWorkerDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  nameTypes: WorkerNameType[];
  onRefetchData?: () => void;
  context?: 'normal' | 'detail';
}

/**
 * AddWorkerDrawer Component
 * Reusable wrapper for QBO contacts drawer integration
 *
 * Responsibilities:
 * - Opens QBO contacts drawer for adding employees/vendors
 * - Handles success/error callbacks
 * - Shows success toast notification
 * - Triggers data refetch
 * - Logs all events with proper format
 */
export const AddWorkerDrawer: React.FC<AddWorkerDrawerProps> = ({
  open,
  onClose,
  onSuccess,
  nameTypes,
  onRefetchData,
  context = 'normal',
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();

  const defaultValuesProp = useMemo(
    () =>
      nameTypes.includes(WorkerNameType.CONTRACTOR)
        ? { defaultValues: { trackTax: true } }
        : {},
    [nameTypes],
  );

  const handleClose = () => {
    sandbox.logger.info(
      `Component="AddWorkerDrawer" Event="Drawer closed" Context="${context}"`,
    );
    onClose();
  };

  const handleSuccess = (newContact: any) => {
    sandbox.logger.info(
      `Component="AddWorkerDrawer" Event="Worker added successfully" Context="${context}"`,
      {
        contactId: newContact.id,
        displayName: newContact.displayName,
        type: newContact.type,
      },
    );

    // Close the drawer
    onClose();

    // Generate success message
    const successMessage = intl.formatMessage(
      {
        id: 'assignments.add_worker.success',
        defaultMessage: '{workerName} added successfully',
      },
      { workerName: newContact.displayName },
    );

    // Notify parent of success
    onSuccess(successMessage);

    // Refetch data if callback provided
    if (onRefetchData) {
      onRefetchData();
    }
  };

  const handleError = (error: any) => {
    sandbox.logger.error(
      `Component="AddWorkerDrawer" Event="Failed to add worker" Context="${context}"`,
      {
        error: error?.message || error,
      },
    );
    // Keep drawer open on error so user can try again
  };

  if (!open) {
    return null;
  }

  return (
    <Widget
      widgetId="qbo-contacts-v2/contact-drawer"
      nameTypes={nameTypes}
      open
      onClose={handleClose}
      onSuccess={handleSuccess}
      onError={handleError}
      {...defaultValuesProp}
    />
  );
};
