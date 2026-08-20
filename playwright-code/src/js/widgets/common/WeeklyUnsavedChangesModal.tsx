import React from 'react';
import { useIntl } from '@payroll/quicksand';
import styled from 'styled-components';

import { Modal, ModalActions, ModalContent } from '@ids-ts/modal-dialog';
import Button from '@ids-ts/button';

const StyledModalContent = styled(ModalContent)`
  padding-top: 15px;
`;

interface WeeklyUnsavedChangesModalProps {
  open: boolean;
  labelKey: string;
  onYesClick: () => void;
  onNoClick: () => void;
  onClose: () => void;
}

export const WeeklyUnsavedChangesModal = ({
  open,
  labelKey,
  onYesClick,
  onNoClick,
  onClose,
}: WeeklyUnsavedChangesModalProps) => {
  const intl = useIntl();

  return (
    <Modal
      data-testid="time-tracking-weekly-unsaved-changes-modal"
      onClose={onClose}
      open={open}
      size="small"
      dismissible={false}
    >
      <StyledModalContent>
        {intl.formatMessage({
          id: labelKey,
        })}
      </StyledModalContent>
      <ModalActions>
        <Button priority="tertiary" onClick={onNoClick}>
          {intl.formatMessage({
            id: 'no',
          })}
        </Button>
        <Button priority="primary" onClick={onYesClick}>
          {intl.formatMessage({
            id: 'yes',
          })}
        </Button>
      </ModalActions>
    </Modal>
  );
};
