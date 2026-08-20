/**
 * KioskSettingsModalsContainer — owns kiosk setting modals + their logic.
 * =============================================================================
 * Renders the generic KioskSettingModal for whichever modal is active in Redux.
 *
 * Inactivity timeout: the saved value lives in Redux (kioskSettings); the
 * modal's edit value is kept in local state, seeded from Redux when the modal
 * opens. This avoids a Redux draft for a single field (see TimeKiosk.types
 * draft TODO).
 *
 * Location recording: no backing API yet, so the checkbox value is
 * local-only state (no Redux persistence) and save just closes the modal and
 * shows a toast reflecting the toggled state. Real persistence is a
 * follow-up.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useIntl } from '@payroll/quicksand';

import { useAppSelector } from '../../../store/hooks';
import { KioskModalType } from '../types/TimeKiosk.types';
import { selectInactivityTimeoutSeconds } from '../store';
import { useKioskUi } from '../store/hooks';
import { useSaveKioskSettings } from '../hooks/useSaveKioskSettings';
import { INACTIVITY_TIMEOUT } from '../constants/timeKioskConstants';
import KioskSettingModal from './KioskSettingModal';

const KioskSettingsModalsContainer: React.FC = () => {
  const intl = useIntl();

  const { activeModal, closeModal, showToast } = useKioskUi();
  const savedInactivitySeconds = useAppSelector(selectInactivityTimeoutSeconds);

  // Success text is caller-owned; the toast mechanism itself is shared, so each
  // kiosk setting shows its own confirmation copy.
  const inactivitySavedMessage = intl.formatMessage({
    id: 'timeKiosk.inactivityTimeout.toast.success',
    defaultMessage: 'Inactivity timeout saved',
  });

  const { saveInactivityTimeout, saving, error, clearError } =
    useSaveKioskSettings({
      onSaveSuccess: () => {
        // Close the modal and surface the shared success toast.
        closeModal();
        showToast(inactivitySavedMessage);
      },
    });

  const isInactivityOpen = activeModal === KioskModalType.INACTIVITY_TIMEOUT;
  const isLocationRecordingOpen =
    activeModal === KioskModalType.LOCATION_RECORDING;

  // Local ephemeral edit value, seeded from Redux whenever the modal opens.
  const [value, setValue] = useState<string>(String(savedInactivitySeconds));

  // Re-seed and clear any stale error only on the open transition.
  // `savedInactivitySeconds` is intentionally excluded from the deps: it is the
  // source we seed *from*, and reacting to it would clobber the user's
  // in-progress edits if the saved value changed while the modal is open. Hence
  // the exhaustive-deps disable.
  useEffect(() => {
    if (isInactivityOpen) {
      setValue(String(savedInactivitySeconds));
      clearError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInactivityOpen]);

  const parsed = Number(value);
  const isValid =
    value.trim() !== '' &&
    Number.isInteger(parsed) &&
    parsed >= INACTIVITY_TIMEOUT.MIN_SECONDS &&
    parsed <= INACTIVITY_TIMEOUT.MAX_SECONDS;

  const handleClose = useCallback(() => {
    // TODO: track event — inactivity timeout modal cancel
    clearError();
    closeModal();
  }, [clearError, closeModal]);

  // error message used by all kiosk modals
  const errorMessage = error
    ? intl.formatMessage({
        id: 'timeKiosk.inactivityTimeout.modal.error',
        defaultMessage: 'Something went wrong. Try again.',
      })
    : undefined;

  const handleSave = useCallback(async () => {
    if (!isValid) {
      return;
    }
    // TODO: track event — inactivity timeout modal save
    await saveInactivityTimeout(parsed);
  }, [isValid, parsed, saveInactivityTimeout]);

  // Location recording is dummy for now: no API integration yet,
  // just a local checkbox value seeded to unchecked whenever the modal opens.
  const [locationRecordingChecked, setLocationRecordingChecked] =
    useState<boolean>(false);

  useEffect(() => {
    if (isLocationRecordingOpen) {
      setLocationRecordingChecked(false);
    }
  }, [isLocationRecordingOpen]);

  const locationRecordingOnMessage = intl.formatMessage({
    id: 'timeKiosk.locationRecording.toast.success.on',
    defaultMessage: 'Location recording turned on',
  });
  const locationRecordingOffMessage = intl.formatMessage({
    id: 'timeKiosk.locationRecording.toast.success.off',
    defaultMessage: 'Location recording turned off',
  });

  const handleLocationRecordingClose = useCallback(() => {
    // TODO: track event — location recording modal cancel
    closeModal();
  }, [closeModal]);

  const handleLocationRecordingSave = useCallback(() => {
    // TODO: track event — location recording modal save
    // Dummy save: no mutation yet, just confirm and close (API integration
    // to follow in a later ticket).
    closeModal();
    showToast(
      locationRecordingChecked
        ? locationRecordingOnMessage
        : locationRecordingOffMessage,
    );
  }, [
    closeModal,
    showToast,
    locationRecordingChecked,
    locationRecordingOnMessage,
    locationRecordingOffMessage,
  ]);

  if (activeModal === KioskModalType.NONE) {
    return null;
  }

  if (isLocationRecordingOpen) {
    return (
      <KioskSettingModal
        open={isLocationRecordingOpen}
        title={intl.formatMessage({
          id: 'timeKiosk.management.actions.editLocationRecording',
          defaultMessage: 'Edit location recording',
        })}
        description={intl.formatMessage({
          id: 'timeKiosk.locationRecording.modal.description',
          defaultMessage: 'Apply to all kiosks.',
        })}
        field={{
          kind: 'checkbox',
          checked: locationRecordingChecked,
          onChange: setLocationRecordingChecked,
          label: intl.formatMessage({
            id: 'timeKiosk.locationRecording.modal.checkboxLabel',
            defaultMessage: 'Turn on location recording',
          }),
        }}
        onSave={handleLocationRecordingSave}
        onClose={handleLocationRecordingClose}
        saveLabel={intl.formatMessage({
          id: 'timeKiosk.modal.save',
          defaultMessage: 'Save',
        })}
        cancelLabel={intl.formatMessage({
          id: 'timeKiosk.modal.cancel',
          defaultMessage: 'Cancel',
        })}
        dataTestId="kiosk-location-recording-modal"
      />
    );
  }

  return (
    <KioskSettingModal
      open={isInactivityOpen}
      title={intl.formatMessage({
        id: 'timeKiosk.inactivityTimeout.modal.title',
        defaultMessage: 'Edit inactivity timeout',
      })}
      description={intl.formatMessage({
        id: 'timeKiosk.inactivityTimeout.modal.description',
        defaultMessage:
          'This applies to all kiosks. After this many seconds of no activity, the kiosk returns to the home screen.',
      })}
      field={{
        kind: 'number',
        value,
        onChange: setValue,
        min: INACTIVITY_TIMEOUT.MIN_SECONDS,
        max: INACTIVITY_TIMEOUT.MAX_SECONDS,
        suffixLabel: intl.formatMessage({
          id: 'timeKiosk.inactivityTimeout.modal.secondsLabel',
          defaultMessage: 'Seconds',
        }),
        ariaLabel: intl.formatMessage({
          id: 'timeKiosk.inactivityTimeout.modal.inputAriaLabel',
          defaultMessage: 'Inactivity timeout in seconds',
        }),
      }}
      onSave={handleSave}
      onClose={handleClose}
      isSaving={saving}
      saveDisabled={!isValid}
      errorMessage={errorMessage}
      saveLabel={intl.formatMessage({
        id: 'timeKiosk.modal.save',
        defaultMessage: 'Save',
      })}
      cancelLabel={intl.formatMessage({
        id: 'timeKiosk.modal.cancel',
        defaultMessage: 'Cancel',
      })}
      dataTestId="kiosk-inactivity-timeout-modal"
    />
  );
};

export default KioskSettingsModalsContainer;
