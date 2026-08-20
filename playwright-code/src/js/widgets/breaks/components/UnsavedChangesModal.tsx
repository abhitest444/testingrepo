import React from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import {
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@ids-ts/modal-dialog';
import { Button } from '@ids-ts/button';
import styled from 'styled-components';
import { ModalActionsRow } from 'src/js/widgets/breaks/features/breaks-settings/styles/Breaks.styled';
import { useBreakEntryTrackingPoints } from '../features/break-entries/hooks/useBreakEntryTrackingPoints';

const StyledModalContent = styled(ModalContent)`
  padding: 20px;
  text-align: center;
`;

const StyledModal = styled(Modal)`
  z-index: 9999;
`;

interface UnsavedChangesModalProps {
  open: boolean;
  onYesClick: () => void;
  onNoClick: () => void;
  onClose: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  open,
  onYesClick,
  onNoClick,
  onClose,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const trackingPoints = useBreakEntryTrackingPoints();

  return (
    <StyledModal
      data-testid="breaks-unsaved-changes-modal"
      onShow={() => {
        track(trackingPoints.UNSAVED_CHANGES_MODAL_VIEWED);
      }}
      onClose={onClose}
      open={open}
      size="medium"
      dismissible={false}
      onBackdropClick={() => {}}
    >
      <ModalHeader alignment="center">
        <ModalTitle
          title={intl.formatMessage({
            id: 'breaks.entry.unsaved.changes.title',
            defaultValue: 'Save changes?',
          })}
        />
      </ModalHeader>
      <StyledModalContent>
        <>
          {intl.formatMessage({
            id: 'breaks.entry.unsaved.changes.message',
            defaultValue: 'Do you want to save your changes before you go?',
          })}
        </>
      </StyledModalContent>
      <ModalActions alignment="center">
        <ModalActionsRow>
          <Button
            priority="secondary"
            onClick={() => {
              track(trackingPoints.DONT_SAVE_BUTTON);
              onNoClick();
            }}
          >
            {intl.formatMessage({
              id: 'breaks.entry.unsaved.changes.no',
              defaultValue: 'No',
            })}
          </Button>
          <Button priority="primary" onClick={onYesClick}>
            {intl.formatMessage({
              id: 'breaks.entry.unsaved.changes.yes',
              defaultValue: 'Yes',
            })}
          </Button>
        </ModalActionsRow>
      </ModalActions>
    </StyledModal>
  );
};
