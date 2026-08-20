import React from 'react';
import styled from 'styled-components';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalActions,
} from '@ids-ts/modal-dialog';
import { Button } from '@ids-ts/button';
import { B2 } from '@ids-ts/typography';

interface FailureModalProps {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  errorMessage?: string;
  failedEntries?: Array<{
    employeeName?: string;
    date?: string;
    error?: string;
  }>;
}

const FailureModal: React.FC<FailureModalProps> = ({
  open,
  onClose,
  onRetry,
  errorMessage,
  failedEntries = [],
}) => {
  const hasFailedEntries = failedEntries.length > 0;

  return (
    <Modal open={open} lightBackdrop onClose={onClose} size="medium">
      <ModalHeader alignment="center">
        <ModalTitle
          title={
            hasFailedEntries
              ? 'Some entries failed to save'
              : 'Failed to save time entries'
          }
          subTitle=""
        />
      </ModalHeader>
      <ModalContent alignment="center">
        <ContentWrapper>
          {errorMessage && (
            <ErrorMessage>
              <B2>{errorMessage}</B2>
            </ErrorMessage>
          )}

          {hasFailedEntries && (
            <>
              <B2 weight="demi" style={{ marginBottom: '16px' }}>
                The following entries could not be saved:
              </B2>
              <FailedEntriesList>
                {failedEntries.map((entry, index) => (
                  <FailedEntryItem key={entry.id || `failed-${index}`}>
                    <B2>
                      {entry.employeeName && (
                        <strong>{entry.employeeName}</strong>
                      )}
                      {entry.date && ` - ${entry.date}`}
                    </B2>
                    {entry.error && (
                      <ErrorText>
                        <B2 style={{ fontSize: '14px', color: '#D32F2F' }}>
                          {entry.error}
                        </B2>
                      </ErrorText>
                    )}
                  </FailedEntryItem>
                ))}
              </FailedEntriesList>
            </>
          )}

          {!hasFailedEntries && !errorMessage && (
            <B2>
              An unexpected error occurred while saving time entries. Please try
              again or contact support if the problem persists.
            </B2>
          )}
        </ContentWrapper>
      </ModalContent>
      <ModalActions alignment="center">
        <Button onClick={onRetry} priority="primary" theme="gbsgexperimental">
          Retry
        </Button>
        <Button onClick={onClose} priority="secondary" theme="gbsgexperimental">
          Close
        </Button>
      </ModalActions>
    </Modal>
  );
};

export default FailureModal;

// Styled Components
const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
`;

const ErrorMessage = styled.div`
  padding: 12px 16px;
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  color: #d32f2f;
`;

const FailedEntriesList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
`;

const FailedEntryItem = styled.div`
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border-left: 3px solid #d32f2f;
`;

const ErrorText = styled.div`
  margin-top: 4px;
`;
