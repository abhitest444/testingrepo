import React from 'react';
import {
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@ids-ts/modal-dialog';
import Button from '@ids-ts/button';
import Typography from '@ids-ts/typography';
import { Activity } from '@ids-ts/loader';
import { useIntl } from '@payroll/quicksand';
import styled from 'styled-components';

// Styled ModalActions to position buttons on opposite sides
const StyledModalActions = styled(ModalActions)`
  & > div {
    display: flex;
    justify-content: space-between !important;
    gap: 16px;
  }
`;

/**
 * Props for ReassignWorkersModal component
 */
export interface ReassignWorkersModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler for cancel button */
  onCancel: () => void;
  /** Handler for confirm/save button */
  onConfirm: () => void;
  /** Whether the save operation is in progress */
  isLoading?: boolean;
  /** Modal title */
  title: string;
  /** Modal message */
  message: string;
}

const ReassignWorkersModal: React.FC<ReassignWorkersModalProps> = ({
  open,
  onCancel,
  onConfirm,
  isLoading = false,
  title,
  message,
}) => {
  const intl = useIntl();

  return (
    <Modal
      open={open}
      onClose={onCancel}
      aria-labelledby="reassign-workers-title"
      data-testid="reassign-workers-modal"
      size="small"
      dismissible
    >
      <ModalHeader
        alignment="left"
        onClose={onCancel}
        data-testid="reassign-workers-modal-header"
      >
        <ModalTitle title={title} />
      </ModalHeader>

      <ModalContent
        alignment="left"
        data-testid="reassign-workers-modal-content"
      >
        <Typography
          variant="body-2"
          weight="regular"
          data-testid="reassign-workers-modal-message"
        >
          {message}
        </Typography>
      </ModalContent>
      <StyledModalActions
        sectionDivider
        data-testid="reassign-workers-modal-actions"
      >
        <Button
          priority="secondary"
          onClick={onCancel}
          disabled={isLoading}
          data-testid="reassign-workers-modal-cancel"
        >
          {intl.formatMessage({
            id: 'overtime.reassign.modal.cancel',
            defaultMessage: 'Cancel',
          })}
        </Button>
        <Button
          priority="primary"
          onClick={onConfirm}
          disabled={isLoading}
          isLoading={isLoading}
          loadingComponent={<Activity shape="dots" />}
          data-testid="reassign-workers-modal-save"
        >
          {intl.formatMessage({
            id: 'overtime.reassign.modal.continue',
            defaultMessage: 'Continue',
          })}
        </Button>
      </StyledModalActions>
    </Modal>
  );
};

export default ReassignWorkersModal;
