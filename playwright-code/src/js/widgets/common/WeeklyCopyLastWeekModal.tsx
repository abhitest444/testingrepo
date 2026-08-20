import React from 'react';
import { useIntl } from '@payroll/quicksand';

import { Modal, ModalActions, ModalContent } from '@ids-ts/modal-dialog';
import Button from '@ids-ts/button';
import styled from 'styled-components';

const StyledModalContent = styled(ModalContent)`
  padding-top: 15px;
`;

export interface WeeklyCopyLastWeekModalProps {
  open: boolean;
  onCancel: () => void;
  onOverwrite: () => void;
  onAdd: () => void;
  onClose: () => void;
}

export const WeeklyCopyLastWeekModal = ({
  open,
  onCancel,
  onOverwrite,
  onAdd,
  onClose,
}: WeeklyCopyLastWeekModalProps) => {
  const intl = useIntl();

  return (
    <Modal
      data-testid="time-tracking-weekly-copy-last-week-modal"
      onClose={onClose}
      open={open}
      size="small"
      dismissible={false}
    >
      <StyledModalContent>
        {intl.formatMessage({
          id: 'copy.last.week.modal.content',
        })}
      </StyledModalContent>
      <ModalActions>
        <Button priority="tertiary" onClick={onCancel}>
          {intl.formatMessage({
            id: 'cancel',
          })}
        </Button>
        <Button priority="tertiary" onClick={onOverwrite}>
          {intl.formatMessage({
            id: 'overwrite',
          })}
        </Button>
        <Button priority="primary" onClick={onAdd}>
          {intl.formatMessage({
            id: 'add',
          })}
        </Button>
      </ModalActions>
    </Modal>
  );
};
