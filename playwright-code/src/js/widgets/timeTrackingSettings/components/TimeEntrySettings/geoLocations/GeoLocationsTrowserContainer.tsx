import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import Trowser from '@ids-ts/trowser';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import Button from '@ids-ts/button';
import Typography from '@ids-ts/typography';
import { Activity } from '@ids-ts/loader';
import styled from 'styled-components';
import { useSetQLSettings } from 'src/js/service/hooks/settings/useSetQLSettings';
import { TimeTracking_LocationTrackingType } from 'src/__generated__/timeTracking/graphql';
import { ErrorOrWarningMessage } from 'src/js/widgets/timeTrackingSettings/TimeTrackingSettings.styled';
import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';
import { UnsavedChangesModal } from 'src/js/widgets/common/AssignmentDrawer/components/UnsavedChangesModal';
import { EditGeoLocationsContainer } from './EditGeoLocationsContainer';

interface GeoLocationsTrowserContainerProps {
  open: boolean;
  onClose: () => void;
  currentValue: string;
  locationTrackingVersion: string;
  refetchQlSettings: () => void;
  showMileageTrackingSetting: boolean;
  mileageTrackingEnabled?: boolean;
  mileageTrackingVersion?: string;
  showGeofenceSetting?: boolean;
  geofencingEnabled?: boolean;
  geofencingVersion?: string;
  /** When provided, called after closing so the parent can scroll to the notifications section */
  onScrollToNotificationsSection?: () => void;
}

const PlaceholderContent = styled.div`
  position: relative;
  max-width: 1400px;
  margin: 60px auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
`;

interface TimesheetSettingsPayload {
  locationTracking: {
    version: string;
    value: TimeTracking_LocationTrackingType;
  };
  mileageTrackingEnabled?: {
    version: string;
    value: boolean;
  };
}

export const GeoLocationsTrowserContainer: React.FC<
  GeoLocationsTrowserContainerProps
> = ({
  open,
  onClose,
  currentValue,
  locationTrackingVersion,
  refetchQlSettings,
  showMileageTrackingSetting = false,
  mileageTrackingEnabled = false,
  mileageTrackingVersion = '0',
  showGeofenceSetting = false,
  geofencingEnabled = false,
  geofencingVersion = '0',
  onScrollToNotificationsSection,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();
  const { setValue } = useFormContext();
  const [selectedValue, setSelectedValue] = useState<string>(currentValue);
  const [selectedMileageTracking, setSelectedMileageTracking] =
    useState<boolean>(mileageTrackingEnabled);
  const [selectedGeofencing, setSelectedGeofencing] =
    useState<boolean>(geofencingEnabled);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showUnsavedModal, setShowUnsavedModal] = useState<boolean>(false);
  const pendingScrollToNotificationsRef = useRef<boolean>(false);

  // Setup mutation hook inside Trowser
  const [updateSettings, { loading: isSaving }] = useSetQLSettings({
    onSuccess: () => {
      sandbox.logger.info('Component=GeoLocationsTrowser Event=SaveSuccess', {
        previousValue: currentValue,
        newValue: selectedValue,
      });

      // Refetch to get updated data (same state instance as parent)
      refetchQlSettings();

      const shouldScroll = pendingScrollToNotificationsRef.current;
      pendingScrollToNotificationsRef.current = false;

      // Close trowser - parent will show updated data
      onClose();

      if (shouldScroll && selectedGeofencing) {
        setTimeout(() => scrollToNotificationsSection(), 300);
      }
    },
    onError: (error) => {
      sandbox.logger.error('Component=GeoLocationsTrowser Event=SaveFailed', {
        error: error?.toString(),
        previousValue: currentValue,
        attemptedValue: selectedValue,
      });

      // Show error message inside trowser
      setErrorMessage(
        error || intl.formatMessage({ id: 'catch.all.error.content' }),
      );
      // Keep trowser open so user can retry or manually close
    },
  });

  // Track trowser view every time it opens
  useEffect(() => {
    if (open) {
      track(TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_TROWSER_VIEWED);
      sandbox.logger.info('Component=GeoLocationsTrowser Event=TrowserViewed');
    }
  }, [open, track, sandbox]);

  // Update selected value when currentValue prop changes or trowser opens
  useEffect(() => {
    if (open) {
      setSelectedValue(currentValue);
      setSelectedMileageTracking(mileageTrackingEnabled);
      setSelectedGeofencing(geofencingEnabled);
      // Reset error message when trowser opens
      setErrorMessage('');
    }
  }, [open, currentValue, mileageTrackingEnabled, geofencingEnabled]);

  const handleSettingChange = (value: string) => {
    setSelectedValue(value);
  };

  const handleMileageTrackingChange = (value: boolean) => {
    setSelectedMileageTracking(value);
  };

  const handleGeofencingChange = (value: boolean) => {
    setSelectedGeofencing(value);
    // Keep notifications form state in sync so geofence notification section shows/hides
    setValue('geofenceEnabled', value, {
      shouldValidate: false,
      shouldDirty: false,
    });
  };

  // Check if mileage tracking has changed
  const hasMileageTrackingChanges =
    showMileageTrackingSetting &&
    selectedMileageTracking !== mileageTrackingEnabled;

  // Check if geofencing has changed
  const hasGeofencingChanges =
    showGeofenceSetting && selectedGeofencing !== geofencingEnabled;

  const hasUnsavedChanges =
    selectedValue !== currentValue ||
    hasMileageTrackingChanges ||
    hasGeofencingChanges;

  const handleCancel = () => {
    sandbox.logger.info('Component=GeoLocationsTrowser Event=CancelClicked', {
      originalValue: currentValue,
      selectedValue,
      wasChanged: hasUnsavedChanges,
    });
    track(TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_SECTION_CANCEL);

    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      onClose();
    }
  };

  const handleModalSave = async () => {
    track(TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_MODAL_SAVE_CLICKED);
    setShowUnsavedModal(false);
    await handleSave();
  };

  const scrollToNotificationsSection = useCallback(() => {
    onScrollToNotificationsSection?.();
  }, [onScrollToNotificationsSection]);

  const handleModalDontSave = () => {
    track(
      TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_MODAL_DONT_SAVE_CLICKED,
    );
    setShowUnsavedModal(false);
    const shouldScroll = pendingScrollToNotificationsRef.current;
    pendingScrollToNotificationsRef.current = false;

    // Reset local state to original prop values (discard unsaved changes)
    setSelectedGeofencing(geofencingEnabled);

    // Reset the parent form's geofenceEnabled back to the original value
    setValue('geofenceEnabled', geofencingEnabled, {
      shouldValidate: false,
      shouldDirty: false,
    });

    onClose();
    if (shouldScroll && geofencingEnabled) {
      setTimeout(() => scrollToNotificationsSection(), 300);
    }
  };

  const handleSetupNotificationsClick = () => {
    if (hasUnsavedChanges) {
      pendingScrollToNotificationsRef.current = true;
      setShowUnsavedModal(true);
    } else {
      onClose();
      if (selectedGeofencing) {
        setTimeout(() => scrollToNotificationsSection(), 300);
      }
    }
  };

  const handleSave = async () => {
    // Log save action
    sandbox.logger.info('Component=GeoLocationsTrowser Event=SaveInitiated', {
      previousValue: currentValue,
      newValue: selectedValue,
      previousMileageTracking: mileageTrackingEnabled,
      newMileageTracking: selectedMileageTracking,
      mileageTrackingVersion,
      hasMileageTrackingChanges,
      previousGeofencing: geofencingEnabled,
      newGeofencing: selectedGeofencing,
      geofencingVersion,
      hasGeofencingChanges,
    });

    // Track clickstream event
    track(TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_SECTION_SAVE);

    // Check if location or mileage tracking has changed
    const hasLocationTrackingChanges = selectedValue !== currentValue;
    const hasTimesheetSettingsChanges =
      hasLocationTrackingChanges || hasMileageTrackingChanges;

    // Build mutation payload
    const mutationPayload: Parameters<typeof updateSettings>[0] = {};

    // Include timesheetManagementSettings only if location or mileage has changed
    if (hasTimesheetSettingsChanges) {
      const locationTrackingValue =
        selectedValue as TimeTracking_LocationTrackingType;

      // Build the timesheet settings object with proper typing
      const timesheetSettings: TimesheetSettingsPayload = {
        locationTracking: {
          version: locationTrackingVersion,
          value: locationTrackingValue,
        },
      };

      // Include mileageTrackingEnabled only if value has changed
      if (hasMileageTrackingChanges) {
        timesheetSettings.mileageTrackingEnabled = {
          version: mileageTrackingVersion,
          value: selectedMileageTracking,
        };
      }

      mutationPayload.timesheetManagementSettings = {
        timesheet: timesheetSettings,
      };
    }

    // Include geofenceSettings only if geofence has changed
    if (hasGeofencingChanges) {
      mutationPayload.geofenceSettings = {
        geofenceEnabled: {
          version: geofencingVersion,
          value: selectedGeofencing,
        },
      };
    }

    await updateSettings(mutationPayload);
  };

  return (
    <>
      <Trowser
        dismissible={!isSaving}
        open={open}
        onClose={handleCancel}
        showCancelFooterButton={!isSaving}
        cancelFooterButtonLabel={intl.formatMessage({ id: 'cancel' })}
        title={intl.formatMessage({
          id: 'time-entries.section.title.geo-locations.manage-title',
        })}
        data-testid="geo-locations-trowser-container"
        footerButton={[
          <Button
            key="save-button"
            priority="primary"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            data-testid="save-geo-locations-button"
          >
            {intl.formatMessage({ id: 'save' })}
          </Button>,
        ]}
      >
        {open ? (
          <PlaceholderContent>
            {isSaving && (
              <LoadingOverlay>
                <Activity shape="dots" size="large" />
              </LoadingOverlay>
            )}

            {/* Error Message */}
            {errorMessage && (
              <ErrorOrWarningMessage
                open
                type="error"
                dismissible={false}
                title={errorMessage}
                automationId="geo-locations-trowser-error-message"
              />
            )}

            <Typography variant="headline-3">
              {intl.formatMessage({
                id: 'time-entries.section.title.geo-locations.preference-title',
              })}
            </Typography>
            <Typography variant="body-3">
              {intl.formatMessage({
                id: 'time-entries.section.title.geo-locations.preference-description',
              })}
            </Typography>
            <EditGeoLocationsContainer
              setting={selectedValue}
              onSettingChange={handleSettingChange}
              showMileageTrackingSetting={showMileageTrackingSetting}
              mileageTrackingEnabled={selectedMileageTracking}
              onMileageTrackingChange={handleMileageTrackingChange}
              showGeofenceSetting={showGeofenceSetting}
              geofencingEnabled={selectedGeofencing}
              onGeofencingChange={handleGeofencingChange}
              onSetupNotificationsClick={handleSetupNotificationsClick}
            />
          </PlaceholderContent>
        ) : (
          <></>
        )}
      </Trowser>

      <UnsavedChangesModal
        open={showUnsavedModal}
        onSave={handleModalSave}
        onDontSave={handleModalDontSave}
        onClose={() => {
          pendingScrollToNotificationsRef.current = false;
          setShowUnsavedModal(false);
        }}
        titleNlsKey="time-entries.section.title.geo-locations.unsaved.changes.title"
        messageNlsKey="time-entries.section.title.geo-locations.unsaved.changes.message"
        saveButtonNlsKey="time-entries.section.title.geo-locations.unsaved.changes.save"
        dontSaveButtonNlsKey="time-entries.section.title.geo-locations.unsaved.changes.dont.save"
        dataTestId="geo-locations-unsaved-changes-modal"
      />
    </>
  );
};
