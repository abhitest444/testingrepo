import React, { useState, useEffect, useRef } from 'react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import SettingsSection from '@payroll-shared-components/payroll-settings-section';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { TimeTracking_LocationTrackingType } from 'src/__generated__/timeTracking/graphql';
import { ViewContent } from 'src/js/widgets/timeTrackingSettings/common/viewContent';
import { StyledSettingsSection } from 'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection';
import { IFormConfig } from 'src/js/widgets/timeTrackingSettings/types';
import { GEO_LOCATIONS_SETTINGS_CONFIG } from 'src/js/widgets/timeTrackingSettings/common/viewForm';
import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import {
  FEATURE_FLAGS,
  DEEP_LINK_NAVIGATION_EVENTS,
  SECTION_READY_EVENT,
  SECTION_READY_KEYS,
} from 'src/js/common/constants';
import {
  computeHasTimeElite,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import { GeoLocationsTrowserContainer } from './GeoLocationsTrowserContainer';

interface GeoLocationsTimeEntrySettingsProps {
  /** When provided, called after closing geo trowser so the form can scroll to the notifications section */
  onScrollToNotificationsSection?: () => void;
  /** When true, auto-opens the trowser on mount (for deep-linking) */
  initialOpen?: boolean;
}

export const GeoLocationsTimeEntrySettings: React.FC<
  GeoLocationsTimeEntrySettingsProps
> = ({ onScrollToNotificationsSection, initialOpen }) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();
  const {
    isFormEditable,
    QLData,
    QLSettingsError,
    isQLSettingsLoading,
    refetchQlSettings,
  } = useTimeTrackingSettingsContext(false);

  const [isTrowserOpen, setIsTrowserOpen] = useState(false);

  // Form config for consistent error display
  const [geoLocationFields, setGeoLocationFields] = useState<IFormConfig>(
    GEO_LOCATIONS_SETTINGS_CONFIG,
  );

  const { data: entitlements } = useGetEntitlements();
  const isTimeElite = computeHasTimeElite(entitlements || []);

  // Publish section ready event when data is loaded
  const sectionReadyPublishedRef = useRef(false);
  useEffect(() => {
    if (!isQLSettingsLoading && QLData && !sectionReadyPublishedRef.current) {
      sectionReadyPublishedRef.current = true;
      sandbox.logger.info(
        'Component=GeoLocationsTimeEntrySettings Event=SECTION_READY section=GEO_LOCATION',
      );
      sandbox.pubsub.publish(SECTION_READY_EVENT, {
        section: SECTION_READY_KEYS.GEO_LOCATION,
      });
    }
  }, [isQLSettingsLoading, QLData, sandbox]);

  // Feature flag for geofence experience - always call hook, but only use value if time elite
  const { isEnabled: isGeofenceExperienceEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_R6_GEOFENCE,
    defaultValue: false,
  });

  // show geofence setting when the following conditions are met:-
  // 1. if user is time elite
  // 2. if geofence experience is enabled
  const showGeofenceSetting = isTimeElite && isGeofenceExperienceEnabled;

  // Get the location tracking value from the settings
  const locationTrackingValue =
    QLData?.locationTracking?.value ||
    TimeTracking_LocationTrackingType.Optional;
  const locationTrackingVersion = QLData?.locationTracking?.version || '0';

  // Get mileage tracking value and version from context
  const mileageTrackingEnabled = QLData?.mileageTrackingEnabled?.value || false;
  const mileageTrackingVersion = QLData?.mileageTrackingEnabled?.version || '0';

  // Get geofencing value and version from context
  const geofencingEnabled = QLData?.geofenceEnabled?.value || false;
  const geofencingVersion = QLData?.geofenceEnabled?.version || '0';

  // Convert the enum value to a readable format
  const getDisplayValue = (value: string) => {
    switch (value) {
      case TimeTracking_LocationTrackingType.Required:
        return intl.formatMessage({
          id: 'time-entries.section.title.geo-locations.value.required',
        });
      case TimeTracking_LocationTrackingType.Optional:
        return intl.formatMessage({
          id: 'time-entries.section.title.geo-locations.value.optional',
        });
      case TimeTracking_LocationTrackingType.Off:
      default:
        return intl.formatMessage({
          id: 'time-entries.section.title.geo-locations.value.off',
        });
    }
  };

  // Track when component is visible
  useEffect(() => {
    sandbox.logger.info('Component=GeoLocationsSettings Event=ComponentViewed');
  }, [sandbox]);

  const handleEdit = () => {
    sandbox.logger.info('Component=GeoLocationsSettings Event=EditClicked', {
      currentValue: locationTrackingValue,
    });
    track(TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_SECTION_EDIT);
    setIsTrowserOpen(true);
  };

  const handleClose = () => {
    sandbox.logger.info('Component=GeoLocationsSettings Event=TrowserClosed');
    setIsTrowserOpen(false);
  };

  // Only check for query/fetch errors here, mutation errors are handled inside the Trowser
  const hasError: boolean = !!(QLSettingsError && QLSettingsError !== '');

  // Guard to prevent multiple deep-link opens
  const trowserOpenedFromDeepLinkRef = useRef(false);

  // Auto-open trowser when initialOpen is true (for deep-linking)
  useEffect(() => {
    if (!initialOpen || trowserOpenedFromDeepLinkRef.current) return;
    if (hasError || isQLSettingsLoading) return;

    trowserOpenedFromDeepLinkRef.current = true;
    sandbox.logger.info(
      'Component=GeoLocationsSettings Event=AutoOpenFromDeepLink',
    );
    setIsTrowserOpen(true);
    // Notify parent that deep-link navigation is complete
    sandbox.pubsub.publish(DEEP_LINK_NAVIGATION_EVENTS.COMPLETE, {});
  }, [initialOpen, hasError, isQLSettingsLoading, sandbox]);

  // Update form fields when data loads successfully
  useEffect(() => {
    if (QLData && !isQLSettingsLoading && !hasError) {
      const configFields =
        GEO_LOCATIONS_SETTINGS_CONFIG[
          'time-entries.section.title.geo-locations'
        ];

      const locationTrackingField = configFields.find(
        (field) => field.key === 'locationTracking',
      )!;
      const mileageTrackingField = configFields.find(
        (field) => field.key === 'mileageTracking',
      )!;
      const geofencingField = configFields.find(
        (field) => field.key === 'geofence',
      )!;

      const fields = [
        {
          ...locationTrackingField,
          value: getDisplayValue(locationTrackingValue),
        },
      ];

      // Only add mileage tracking field if user is time elite
      if (isTimeElite) {
        fields.push({
          ...mileageTrackingField,
          value: mileageTrackingEnabled
            ? intl.formatMessage({ id: 'on' })
            : intl.formatMessage({ id: 'off' }),
        });
      }

      // Only add geofencing field if feature flag is enabled and user is time elite
      if (showGeofenceSetting) {
        fields.push({
          ...geofencingField,
          value: geofencingEnabled
            ? intl.formatMessage({ id: 'on' })
            : intl.formatMessage({ id: 'off' }),
        });
      }

      setGeoLocationFields({
        'time-entries.section.title.geo-locations': fields,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    QLData,
    isQLSettingsLoading,
    locationTrackingValue,
    hasError,
    isTimeElite,
    showGeofenceSetting,
  ]);

  // Set fallback values when there's an error (fetch or mutation)
  useEffect(() => {
    if (!isQLSettingsLoading && hasError) {
      const configFields =
        GEO_LOCATIONS_SETTINGS_CONFIG[
          'time-entries.section.title.geo-locations'
        ];

      const locationTrackingField = configFields.find(
        (field) => field.key === 'locationTracking',
      )!;
      const mileageTrackingField = configFields.find(
        (field) => field.key === 'mileageTracking',
      )!;
      const geofencingField = configFields.find(
        (field) => field.key === 'geofence',
      )!;

      const fields = [
        {
          ...locationTrackingField,
          value: intl.formatMessage({
            id: 'time-entries.section.title.geo-locations.value.off',
          }),
        },
      ];

      // Only add mileage tracking field if user is time elite
      if (isTimeElite && mileageTrackingField) {
        fields.push({
          ...mileageTrackingField,
          value: intl.formatMessage({ id: 'off' }),
        });
      }

      // Only add geofencing field if feature flag is enabled and user is time elite
      if (showGeofenceSetting && geofencingField) {
        fields.push({
          ...geofencingField,
          value: intl.formatMessage({ id: 'off' }),
        });
      }

      setGeoLocationFields({
        'time-entries.section.title.geo-locations': fields,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasError, isQLSettingsLoading, showGeofenceSetting, isTimeElite]);

  return (
    <>
      <StyledSettingsSection componentId="geo-locations-settings">
        <SettingsSection
          mode="VIEW"
          readonly={!isFormEditable || hasError}
          saveButtonText=""
          cancelButtonText=""
          editIconAriaLabel={intl.formatMessage({ id: 'edit' })}
          id="geo-locations-settings-handle"
          title={intl.formatMessage({
            id: 'time-entries.section.title.geo-locations',
          })}
          viewContent={
            <ViewContent
              formFields={geoLocationFields}
              isErrorInView={hasError}
            />
          }
          onEdit={handleEdit}
        />
      </StyledSettingsSection>
      {!hasError && (
        <GeoLocationsTrowserContainer
          open={isTrowserOpen}
          onClose={handleClose}
          currentValue={locationTrackingValue}
          locationTrackingVersion={locationTrackingVersion}
          refetchQlSettings={refetchQlSettings}
          showMileageTrackingSetting={isTimeElite}
          mileageTrackingEnabled={mileageTrackingEnabled}
          mileageTrackingVersion={mileageTrackingVersion}
          showGeofenceSetting={showGeofenceSetting}
          geofencingEnabled={geofencingEnabled}
          geofencingVersion={geofencingVersion}
          onScrollToNotificationsSection={onScrollToNotificationsSection}
        />
      )}
    </>
  );
};
