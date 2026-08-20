import React from 'react';
import {
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
} from '@ids-ts/modal-dialog';
import Button from '@ids-ts/button';
import { B2, H5 } from '@ids-ts/typography';
import { useIntl } from '@payroll/quicksand';
import styled from 'styled-components';

const StyledModalActions = styled(ModalActions)`
  & > div {
    display: flex;
    justify-content: space-between !important;
    gap: 16px;
  }
`;

const SummaryContainer = styled.div`
  margin-top: 12px;
`;

interface SubmitTimeConfirmationModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  message?: string | null;
  periodLabel?: string | null;
  summaryDuration?: string | null;
}

const SubmitTimeConfirmationModal: React.FC<
  SubmitTimeConfirmationModalProps
> = ({ open, onCancel, onConfirm, message, periodLabel, summaryDuration }) => {
  const intl = useIntl();
  const confirmationMessage =
    message?.trim() ||
    intl.formatMessage({
      id: 'approvals.submitTimePanel.confirmationDefaultMessage',
      defaultMessage:
        'By submitting your timesheets you agree that they are complete and accurate.',
    });

  return (
    <Modal
      open={open}
      onClose={onCancel}
      aria-labelledby="submit-time-confirmation-title"
      data-testid="submit-time-confirmation-modal"
      size="small"
      dismissible
      restoreFocus
    >
      <ModalHeader
        alignment="left"
        onClose={onCancel}
        data-testid="submit-time-confirmation-modal-header"
      >
        <H5
          weight="regular"
          id="submit-time-confirmation-title"
          data-testid="submit-time-confirmation-modal-title"
        >
          {intl.formatMessage({
            id: 'approvals.submitTimePanel.confirmationTitle',
            defaultMessage: 'Before you submit',
          })}
        </H5>
      </ModalHeader>

      <ModalContent
        alignment="left"
        data-testid="submit-time-confirmation-modal-content"
      >
        <B2 data-testid="submit-time-confirmation-modal-message">
          {confirmationMessage}
        </B2>
        {periodLabel && summaryDuration && (
          <SummaryContainer data-testid="submit-time-confirmation-modal-summary">
            <B2>
              {intl.formatMessage({
                id: 'approvals.submitTimePanel.confirmationSummaryPrefix',
                defaultMessage: 'You will submit ',
              })}
              <strong>{summaryDuration}</strong>
              {intl.formatMessage(
                {
                  id: 'approvals.submitTimePanel.confirmationSummarySuffix',
                  defaultMessage: ' for timesheets {period}.',
                },
                { period: periodLabel },
              )}
            </B2>
          </SummaryContainer>
        )}
      </ModalContent>

      <StyledModalActions
        sectionDivider
        data-testid="submit-time-confirmation-modal-actions"
      >
        <Button
          priority="secondary"
          onClick={onCancel}
          data-testid="submit-time-confirmation-modal-cancel"
        >
          {intl.formatMessage({
            id: 'approvals.submitTimePanel.cancel',
            defaultMessage: 'Cancel',
          })}
        </Button>
        <Button
          priority="primary"
          onClick={onConfirm}
          data-testid="submit-time-confirmation-modal-confirm"
        >
          {intl.formatMessage({
            id: 'approvals.submitTimePanel.confirmationConfirm',
            defaultMessage: 'Confirm',
          })}
        </Button>
      </StyledModalActions>
    </Modal>
  );
};

export default SubmitTimeConfirmationModal;
