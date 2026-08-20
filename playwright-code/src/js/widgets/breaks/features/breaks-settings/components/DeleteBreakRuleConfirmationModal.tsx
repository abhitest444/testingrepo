import React, { useEffect } from 'react';
import {
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
} from '@ids-ts/modal-dialog';
import { Button } from '@ids-ts/button';
import { Typography } from '@ids-ts/typography';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Activity } from '@ids-ts/loader';
import {
  setBreakToDelete,
  setDeleteModalOpen,
} from 'src/js/widgets/breaks/store/uiSlice';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/breaks/store/hooks';
import useBreaksCrud from 'src/js/widgets/breaks/hooks/useBreaksCrud';
import { useDeleteEmployerBreakMutation } from 'src/__generated__/oigql/graphql';
import { BREAK_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/breaks/constants';
import {
  ModalContentCentered,
  ModalTitle,
  ModalWarning,
  ModalActionsRow,
} from '../styles/Breaks.styled';
import {
  DYN_BREAKS_CANCEL_DELETE_BREAK_RULE,
  DYN_BREAKS_CONFIRM_DELETE_BREAK_RULE,
} from '../../../trackingMetadata';

interface DeleteBreakModalProps {}

const DeleteBreakModal: React.FC<DeleteBreakModalProps> = () => {
  const intl = useIntl();
  const track = useTracking();
  const text = (id: string, values?: Record<string, string>) =>
    intl.formatMessage({ id }, values);

  const { deleteModalOpen } = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();
  const sandbox = useSandbox();
  const breakToDelete = useAppSelector((state) => state.ui.breakToDelete);
  // todo: handle error
  const { deleteLoading } = useAppSelector((state) => state.breakRules);

  const handleCancelDelete = () => {
    dispatch(setBreakToDelete(null));
    dispatch(setDeleteModalOpen(false));
    track(BREAK_SETTINGS_TRACKING_POINTS.CANCEL_DELETE_BREAK_RULE);
    // sandbox.analytics.track({
    //   dynamic_id: DYN_BREAKS_CANCEL_DELETE_BREAK_RULE,
    // });
  };

  const { deleteBreaksPolicy } = useBreaksCrud();

  const handleConfirmDelete = () => {
    if (breakToDelete) {
      deleteBreaksPolicy(breakToDelete.id);
      track(BREAK_SETTINGS_TRACKING_POINTS.CONFIRM_DELETE_BREAK_RULE);
      // sandbox.analytics.track({
      //   dynamic_id: DYN_BREAKS_CONFIRM_DELETE_BREAK_RULE,
      // });
    }
  };

  useEffect(() => {
    if (deleteModalOpen && !breakToDelete && !deleteLoading) {
      dispatch(setDeleteModalOpen(false));
    }
  }, [deleteModalOpen, breakToDelete, deleteLoading]);
  return (
    <Modal
      open={deleteModalOpen}
      onClose={handleCancelDelete}
      aria-labelledby="delete-break-title"
      data-testid="delete-break-modal-root"
      size="medium"
      dismissible
    >
      <ModalHeader
        onClose={handleCancelDelete}
        data-testid="delete-break-modal-header"
      />
      <ModalContentCentered data-testid="delete-break-modal-content">
        <ModalTitle
          id="delete-break-title"
          data-testid="delete-break-modal-title"
        >
          {text('delete.break.modal.title', {
            breakName: breakToDelete?.breakName || '',
          })}
        </ModalTitle>
        <ModalWarning data-testid="delete-break-modal-warning">
          {text('delete.break.modal.warning')}
        </ModalWarning>
      </ModalContentCentered>
      <ModalActionsRow
        as={ModalActions}
        data-testid="delete-break-modal-actions"
      >
        <Button
          priority="secondary"
          onClick={handleCancelDelete}
          data-testid="delete-break-modal-cancel"
          id={DYN_BREAKS_CANCEL_DELETE_BREAK_RULE}
        >
          {text('delete.break.modal.cancel')}
        </Button>
        <Button
          priority="primary"
          onClick={handleConfirmDelete}
          data-testid="delete-break-modal-delete"
          disabled={deleteLoading}
          isLoading={deleteLoading}
          loadingComponent={<Activity shape="dots" />}
          id={DYN_BREAKS_CONFIRM_DELETE_BREAK_RULE}
        >
          {text('delete.break.modal.delete')}
        </Button>
      </ModalActionsRow>
    </Modal>
  );
};

export default DeleteBreakModal;
