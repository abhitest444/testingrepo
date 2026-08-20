import React from 'react';
import { useIntl } from '@payroll/quicksand';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@ids-ts/modal-dialog';

interface ApprovedEntriesModalProps {
  open: boolean;
  isTimeOff?: boolean;
  isSubmitted?: boolean;
  onCancel: () => void;
}

export const ApprovedEntriesModal = ({
  open,
  isTimeOff,
  isSubmitted,
  onCancel,
}: ApprovedEntriesModalProps) => {
  const intl = useIntl();

  const getTitleId = () => {
    if (isTimeOff) return 'weekly.time.entry.time.off.locked.title';
    if (isSubmitted) return 'time.entry.submitted.title';
    return 'weekly.time.entry.already.approved.title';
  };

  const title = intl.formatMessage({ id: getTitleId() });

  return (
    <Modal
      data-testid="weekly-time-entry-already-approved-modal"
      onClose={onCancel}
      open={open}
      size="medium"
      dismissible
    >
      <ModalHeader alignment="center">
        <ModalTitle subTitle="" title={title} />
      </ModalHeader>

      <ModalContent />
    </Modal>
  );
};
