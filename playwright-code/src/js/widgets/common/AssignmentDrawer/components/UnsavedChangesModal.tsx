import React from 'react';
import { useIntl } from '@payroll/quicksand';
import {
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@ids-ts/modal-dialog';
import Button from '@ids-ts/button';

interface UnsavedChangesModalProps {
  open: boolean;
  onSave: () => void;
  onDontSave: () => void;
  onClose: () => void;
  /** NLS key for modal title. Defaults to assignment drawer title */
  titleNlsKey?: string;
  /** NLS key for modal message. Defaults to assignment drawer message */
  messageNlsKey?: string;
  /** NLS key for save button text. Defaults to assignment drawer save text */
  saveButtonNlsKey?: string;
  /** NLS key for don't save button text. Defaults to assignment drawer don't save text */
  dontSaveButtonNlsKey?: string;
  /** Custom data-testid for the modal */
  dataTestId?: string;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  open,
  onSave,
  onDontSave,
  onClose,
  titleNlsKey = 'assignmentDrawer.unsaved.changes.title',
  messageNlsKey = 'assignmentDrawer.unsaved.changes.message',
  saveButtonNlsKey = 'assignmentDrawer.unsaved.changes.save',
  dontSaveButtonNlsKey = 'assignmentDrawer.unsaved.changes.dont.save',
  dataTestId = 'assignment-drawer-unsaved-changes-modal',
}) => {
  const intl = useIntl();

  return (
    <Modal
      data-testid={dataTestId}
      onClose={onClose}
      open={open}
      size="small"
      dismissible={false}
      restoreFocus
    >
      <ModalHeader alignment="center">
        <ModalTitle
          title={intl.formatMessage({
            id: titleNlsKey,
          })}
        />
      </ModalHeader>

      <ModalContent alignment="center">
        {intl.formatMessage({
          id: messageNlsKey,
        })}
      </ModalContent>

      <ModalActions alignment="center" sectionDivider={false}>
        <Button priority="secondary" onClick={onDontSave}>
          {intl.formatMessage({
            id: dontSaveButtonNlsKey,
          })}
        </Button>
        <Button priority="primary" onClick={onSave}>
          {intl.formatMessage({
            id: saveButtonNlsKey,
          })}
        </Button>
      </ModalActions>
    </Modal>
  );
};
