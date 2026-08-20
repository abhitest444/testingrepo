import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@ids-ts/modal-dialog';
import Button from '@ids-ts/button';
import { useAppContext, useIntl, useSandbox } from '@payroll/quicksand';
import Checkbox from '@ids-ts/checkbox';
import { Environment } from '@appfabric/sandbox-spec';
import styled from 'styled-components';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import {
  computeHasTSheets,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import {
  computeTimeTrackingOnlyUser,
  useTimeTrackingBatchAuthorization,
} from 'src/js/service/utils/useTimeTrackingAuthorization';

const ModalContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;

  label {
    margin: 0;
  }
`;

const MessageContainer = styled.div`
  display: flex;
`;

const StyledModalActions = styled(ModalActions)`
  // Harmony.css is hiding the section divider,
  // this ensures it is always visible
  & hr {
    border-top-width: 1px;
  }
`;

const TSHEETS_URL_PROD = 'https://tsheets.intuit.com';
const TSHEETS_URL_PREPROD = 'https://tsheets-e2e.intuit.com';

export interface TSheetsModalProps {
  /** When true, the modal may be shown (subject to entitlements, preferences, etc.). When false, the modal never opens. */
  showModal?: boolean;
}

export const TSheetsModal = ({ showModal = true }: TSheetsModalProps) => {
  // -------------------------------- context hooks

  const sandbox = useSandbox();
  const { environment, realmId } = useAppContext();
  const intl = useIntl();

  // -------------------------------- component state hooks

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckboxChecked, setCheckboxChecked] = useState(false);

  // -------------------------------- network hooks

  const {
    data: uxPreferenceData,
    loading: uxPreferenceLoading,
    getPreference,
    setPreference,
  } = useUxPreferences();
  const hideThisModalUXPreference =
    uxPreferenceData[UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE];

  const { data: entitlements } = useGetEntitlements();
  const hasTSheets = computeHasTSheets(entitlements);

  const { data: timeTrackingAuth, loading: timeTrackingAuthLoading } =
    useTimeTrackingBatchAuthorization();
  const timeTrackingOnlyId = computeTimeTrackingOnlyUser(timeTrackingAuth);

  // -------------------------------- component render hooks

  useEffect(() => {
    getPreference(UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE);
  }, []);

  useEffect(() => {
    if (!showModal) {
      setIsModalOpen(false);
      return;
    }
    if (
      hasTSheets &&
      !uxPreferenceLoading &&
      !hideThisModalUXPreference &&
      !timeTrackingAuthLoading &&
      timeTrackingOnlyId === undefined
    ) {
      setIsModalOpen(true);
      sandbox.logger.info('Component=TSheetsModal Event=Mounted');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTSheets, hideThisModalUXPreference, showModal]);

  // -------------------------------- component interaction handlers

  const handleSetPreference = async () => {
    await setPreference(UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE, true);
  };

  const handleCloseModal = () => {
    if (isCheckboxChecked) {
      handleSetPreference();
    }
    setIsModalOpen(false);
  };

  const handleNextClick = () => {
    const urlPrefix =
      environment === Environment.PROD ? TSHEETS_URL_PROD : TSHEETS_URL_PREPROD;
    const tsheetsUrl = `${urlPrefix}/login_oii?realm_id=${encodeURIComponent(
      realmId!,
    )}`;
    window.open(tsheetsUrl, '_blank');
  };

  return (
    <Modal
      data-testid="time-tracking-tsheets-variability-modal"
      onClose={handleCloseModal}
      open={isModalOpen}
      size="medium"
      dismissible
      restoreFocus
    >
      <ModalHeader alignment="left">
        <ModalTitle
          title={intl.formatMessage({
            id: 'tsheets.modal.title',
          })}
        />
      </ModalHeader>
      <ModalContent>
        <ModalContentContainer>
          <MessageContainer>
            {intl.formatMessage({
              id: 'tsheets.modal.content',
            })}
          </MessageContainer>
          <Checkbox
            checked={isCheckboxChecked}
            onChange={(e) => {
              setCheckboxChecked(e.target.checked || false);
            }}
          >
            {intl.formatMessage({
              id: 'tsheets.modal.checkbox.label',
            })}
          </Checkbox>
        </ModalContentContainer>
      </ModalContent>
      <StyledModalActions alignment="right" sectionDivider>
        <Button
          priority="secondary"
          purpose="passive"
          onClick={handleCloseModal}
        >
          {intl.formatMessage({
            id: 'trowser.cancel',
          })}
        </Button>
        <Button priority="primary" onClick={handleNextClick}>
          {intl.formatMessage({
            id: 'tsheets.modal.next.button.label',
          })}
        </Button>
      </StyledModalActions>
    </Modal>
  );
};
