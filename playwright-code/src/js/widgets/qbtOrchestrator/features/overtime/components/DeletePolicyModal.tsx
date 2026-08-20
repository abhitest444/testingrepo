import React, { useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
} from '@ids-ts/modal-dialog';
import Button from '@ids-ts/button';
import Typography from '@ids-ts/typography';
import { Activity } from '@ids-ts/loader';
import { useIntl, useTracking } from '@payroll/quicksand';
import styled from 'styled-components';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';

import { useAppDispatch } from '../../../store/hooks';
import { setShowDeleteModal, setPolicyToDelete, setError } from '../store';
import { useOvertimeMutations } from '../hooks';
import { OVERTIME_LOGGING } from '../constants/overtimeLoggingConstants';
import { MANAGE_OVERTIME_LANDING_TRACKING_POINTS } from '../constants/overtimeTrackingPoints';

// Styled components for modal layout
const ModalContentCentered = styled(ModalContent)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  padding: 24px;
`;

const ModalActionsRow = styled(ModalActions)`
  display: flex;
  justify-content: center;
  gap: 16px;
`;

interface DeletePolicyModalProps {}

/**
 * Delete confirmation modal for overtime policies
 * Uses Redux state for visibility and policy to delete
 */
const DeletePolicyModal: React.FC<DeletePolicyModalProps> = () => {
  const intl = useIntl();
  const logger = useLoggingConfig();
  const track = useTracking();
  const dispatch = useAppDispatch();

  const {
    deleteOvertimePolicy,
    isDeletingPolicy,
    policyToDelete,
    showDeleteModal,
  } = useOvertimeMutations();

  // Log when delete modal opens - ref captures latest policy without triggering on selection changes
  const policyToDeleteRef = useRef(policyToDelete);
  policyToDeleteRef.current = policyToDelete;
  useEffect(() => {
    if (showDeleteModal && policyToDeleteRef.current) {
      logger.info(OVERTIME_LOGGING.DELETE_MODAL_OPENED, {
        policyId: policyToDeleteRef.current.id,
        policyName: policyToDeleteRef.current.name,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleteModal, logger]);

  const handleCancelDelete = useCallback(() => {
    track(MANAGE_OVERTIME_LANDING_TRACKING_POINTS.CANCEL_DELETE_POLICY);
    logger.info(OVERTIME_LOGGING.DELETE_MODAL_CANCELLED, {
      policyId: policyToDelete?.id,
    });
    dispatch(setShowDeleteModal(false));
    dispatch(setPolicyToDelete(null));
  }, [dispatch, logger, track, policyToDelete]);

  const handleConfirmDelete = useCallback(async () => {
    if (!policyToDelete) {
      return;
    }

    track(MANAGE_OVERTIME_LANDING_TRACKING_POINTS.CONFIRM_DELETE_POLICY);
    const clientMutationId = `delete-policy-${Date.now()}`;
    const result = await deleteOvertimePolicy(policyToDelete.id, {
      clientMutationId,
    });

    if (result.success) {
      logger.info(OVERTIME_LOGGING.API_DELETE_POLICY_SUCCESS, {
        policyId: policyToDelete.id,
        policyName: policyToDelete.name,
      });
      dispatch(setPolicyToDelete(null));
      dispatch(setShowDeleteModal(false));
    } else {
      dispatch(setShowDeleteModal(false));
      dispatch(setError(intl.formatMessage({ id: 'catch.all.error.content' })));
    }
  }, [policyToDelete, deleteOvertimePolicy, dispatch, logger, track, intl]);

  // Don't render if no policy selected
  if (!policyToDelete) {
    return null;
  }

  return (
    <Modal
      open={showDeleteModal}
      onClose={handleCancelDelete}
      aria-labelledby="delete-policy-title"
      data-testid="delete-policy-modal"
      size="medium"
      dismissible
    >
      <ModalHeader
        onClose={handleCancelDelete}
        data-testid="delete-policy-modal-header"
      />
      <ModalContentCentered data-testid="delete-policy-modal-content">
        <Typography
          variant="headline-5"
          weight="medium"
          id="delete-policy-title"
          data-testid="delete-policy-modal-title"
        >
          {intl.formatMessage(
            {
              id: 'overtime.delete.modal.title',
              defaultMessage: 'Are you sure you want to delete {policyName}?',
            },
            { policyName: policyToDelete.name },
          )}
        </Typography>
        <Typography
          variant="body-2"
          weight="regular"
          data-testid="delete-policy-modal-warning"
        >
          {intl.formatMessage({
            id: 'overtime.delete.modal.warning',
            defaultMessage:
              "This can't be undone and workers will need to be assigned to a different policy.",
          })}
        </Typography>
      </ModalContentCentered>
      <ModalActionsRow data-testid="delete-policy-modal-actions">
        <Button
          priority="secondary"
          onClick={handleCancelDelete}
          disabled={isDeletingPolicy}
          data-testid="delete-policy-modal-cancel"
        >
          {intl.formatMessage({
            id: 'overtime.delete.modal.cancel',
            defaultMessage: 'Cancel',
          })}
        </Button>
        <Button
          priority="primary"
          onClick={handleConfirmDelete}
          disabled={isDeletingPolicy}
          isLoading={isDeletingPolicy}
          loadingComponent={<Activity shape="dots" />}
          data-testid="delete-policy-modal-delete"
        >
          {intl.formatMessage({
            id: 'overtime.delete.modal.delete',
            defaultMessage: 'Delete',
          })}
        </Button>
      </ModalActionsRow>
    </Modal>
  );
};

export default DeletePolicyModal;
