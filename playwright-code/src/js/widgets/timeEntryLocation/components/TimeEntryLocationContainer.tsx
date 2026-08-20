import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { B3, H3 } from '@ids-ts/typography';
import { Activity } from '@ids-ts/loader';
import { TimeTracking_LocationTrackingType } from 'src/__generated__/timeTracking/graphql';
import { useFeatureFlag } from 'src/js/common/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useGetUnifiedUserSettings } from 'src/js/service/hooks/userLevelSettings/useGetUnifiedUserSettings';
import TimeEntryLocationContent from './TimeEntryLocationMap/TimeEntryLocationContent';
import TimeEntryDetails from './TimeEntryDetails/TimeEntryDetails';
import TimeEntryLocationErrorState from './TimeEntryLocationErrorState';
import { useTimeEntryLocationData } from '../hooks/useTimeEntryLocationData';
import { useSameDayGeoEntries } from '../hooks/useSameDayGeoEntries';
import { mapLocationPointsToDisplayData } from '../utils/locationPointUtils';
import { LOCATION_MAP_TRACKING_POINTS } from '../utils/locationMapTrackingPoints';
import {
  StyledTrowser,
  PageWrapper,
  HeaderSection,
  ContentWrapper,
  MapSection,
  DetailsSection,
  LoadingContainer,
} from './styles/TimeEntryLocationContainer.styled';

interface TimeEntryLocationContainerProps {
  onClose: () => void;
  open: boolean;
  timeEntryId: string;
  traceHeaders: Record<string, string | number>;
}

const TimeEntryLocationContainer: React.FC<TimeEntryLocationContainerProps> = ({
  onClose,
  open,
  timeEntryId,
  traceHeaders,
}) => {
  const intl = useIntl();
  const track = useTracking();

  const isGeofenceFlagsEnabled = useFeatureFlag(
    FEATURE_FLAGS.SBSEG_QBO_GEOFENCE_FLAGS,
    false,
  );

  const [activeTimeEntryId, setActiveTimeEntryId] = useState(timeEntryId);

  useEffect(() => {
    setActiveTimeEntryId(timeEntryId);
  }, [timeEntryId]);

  // Fetch location data from API (refetches when user picks another same-day entry)
  const {
    loading,
    timeEntry,
    locationPoints: apiLocationPoints,
    error,
  } = useTimeEntryLocationData({
    timeEntryId: activeTimeEntryId,
    traceHeaders,
  });

  const nowLabel = intl.formatMessage({ id: 'timeEntryLocation.now' });
  const { sameDayGeoEntryTimeRangesById } = useSameDayGeoEntries({
    timeEntry,
    loading,
    timeEntryId,
    nowLabel,
  });

  const text = (id: string) => intl.formatMessage({ id });

  const [locationSettings, setLocationSettings] =
    useState<TimeTracking_LocationTrackingType | null>(null);

  const { loadUnifiedUserSettings: loadUserLocationSettings } =
    useGetUnifiedUserSettings({
      onSuccess: (data) => {
        const effectiveValue =
          data?.timeTrackingUnifiedUserSettings?.locationTracking
            ?.effectiveValue;
        setLocationSettings(effectiveValue || null);
      },
    });

  // Fetch user location settings for the time entry
  useEffect(() => {
    const workerId = timeEntry?.timeForContactDAS?.id;
    const timeForType = timeEntry?.timeForType;

    if (workerId && timeForType) {
      loadUserLocationSettings({
        settingsFor: { id: workerId, timeForType },
      });
    }
  }, [
    timeEntry?.timeForContactDAS?.id,
    timeEntry?.timeForType,
    loadUserLocationSettings,
  ]);

  // Track widget viewed when opened or error state when error occurs
  useEffect(() => {
    if (open && !loading && !error) {
      track(LOCATION_MAP_TRACKING_POINTS.VIEW_LOCATION_MAP);
    } else if (open && error) {
      track(LOCATION_MAP_TRACKING_POINTS.SOMETHING_WENT_WRONG_VIEWED);
    }
  }, [open, loading, error, track]);

  // Format location points with timezone - done once in HOC for both children
  const formattedLocationPoints = useMemo(
    () => mapLocationPointsToDisplayData(apiLocationPoints, timeEntry),
    [apiLocationPoints, timeEntry],
  );

  const handleClose = () => {
    track(LOCATION_MAP_TRACKING_POINTS.CLOSE);
    onClose();
  };

  const handleSameDayTimeEntrySelect = useCallback((selectedId: string) => {
    if (selectedId) {
      setActiveTimeEntryId(selectedId);
    }
  }, []);

  const renderContent = () => {
    // loading state
    if (loading) {
      return (
        <LoadingContainer>
          <Activity shape="dots" size="large" />
        </LoadingContainer>
      );
    }

    // error state
    if (error) {
      return <TimeEntryLocationErrorState />;
    }

    return (
      <PageWrapper>
        {/* Header Section */}
        <HeaderSection>
          <H3 weight="demi">{text('timeEntryLocation.header.title')}</H3>
          <B3>{text('timeEntryLocation.header.description')}</B3>
        </HeaderSection>

        {/* Main Content with map, location points and time entry details */}
        <ContentWrapper>
          <MapSection>
            <TimeEntryLocationContent
              locationPoints={formattedLocationPoints}
              locationSettings={locationSettings}
              isGeofenceFlagsEnabled={isGeofenceFlagsEnabled}
            />
          </MapSection>
          <DetailsSection>
            <TimeEntryDetails
              timeEntry={timeEntry}
              locationPoints={formattedLocationPoints}
              sameDayGeoEntryTimeRangesById={sameDayGeoEntryTimeRangesById}
              onSameDayTimeEntrySelect={handleSameDayTimeEntrySelect}
              isGeofenceFlagsEnabled={isGeofenceFlagsEnabled}
            />
          </DetailsSection>
        </ContentWrapper>
      </PageWrapper>
    );
  };

  return (
    <StyledTrowser
      dismissible
      open={open}
      onClose={handleClose}
      showCancelFooterButton
      cancelFooterButtonLabel={text('timeEntryLocation.trowser.cancel')}
      title={text('timeEntryLocation.trowser.heading')}
      data-testid="time-entry-location-container"
    >
      {renderContent()}
    </StyledTrowser>
  );
};

export default TimeEntryLocationContainer;
