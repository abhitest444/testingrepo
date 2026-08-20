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

type ActionType = 'close' | 'navigation' | 'week-change';

interface CommonErrorModalProps {
  open: boolean;
  actionType: ActionType;
  onConfirm: (actionType: ActionType) => void;
  onCancel: () => void;
}

export const CommonErrorModal = ({
  open,
  actionType,
  onConfirm,
  onCancel,
}: CommonErrorModalProps) => {
  const intl = useIntl();

  const getModalContent = () => {
    switch (actionType) {
      case 'close':
        return {
          title: intl.formatMessage({
            id: 'weekly.time.entry.unsaved.changes.title',
          }),
          message: intl.formatMessage({
            id: 'weekly.time.entry.unsaved.changes.close.message',
          }),
        };
      case 'navigation':
        return {
          title: intl.formatMessage({
            id: 'weekly.time.entry.unsaved.changes.title',
          }),
          message: intl.formatMessage({
            id: 'weekly.time.entry.unsaved.changes.navigation.message',
          }),
        };
      case 'week-change':
        return {
          title: intl.formatMessage({
            id: 'weekly.time.entry.unsaved.changes.title',
          }),
          message: intl.formatMessage({
            id: 'weekly.time.entry.unsaved.changes.week.message',
          }),
        };
      default:
        return {
          title: intl.formatMessage({
            id: 'weekly.time.entry.unsaved.changes.title',
          }),
          message: intl.formatMessage({
            id: 'weekly.time.entry.unsaved.changes.message',
          }),
        };
    }
  };

  const handleYesClick = () => {
    onConfirm(actionType);
  };

  const handleNoClick = () => {
    onCancel();
  };

  const { title, message } = getModalContent();

  return (
    <Modal
      data-testid="weekly-time-entry-error-modal"
      onClose={onCancel}
      open={open}
      size="medium"
      dismissible={false}
    >
      <ModalHeader alignment="center">
        <ModalTitle subTitle="" title={title} />
      </ModalHeader>

      <ModalContent>
        <p>{message}</p>
      </ModalContent>

      <ModalActions alignment="center">
        <Button priority="primary" onClick={handleYesClick}>
          {intl.formatMessage({
            id: 'weekly.time.entry.unsaved.changes.yes',
          })}
        </Button>
        <Button priority="secondary" onClick={handleNoClick}>
          {intl.formatMessage({
            id: 'weekly.time.entry.unsaved.changes.no',
          })}
        </Button>
      </ModalActions>
    </Modal>
  );
};
