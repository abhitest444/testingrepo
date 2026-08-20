import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Drawer, DrawerFooter } from '@ids-ts/drawer';
import Switch from '@ids-ts/switch';
import Button from '@ids-ts/button';
import { Activity } from '@ids-ts/loader';
import PageMessage from '@ids-ts/page-message';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import {
  GEOFENCE_RADIUS,
  ASSIGNMENT_NAVIGATION_ROUTES,
  DEFAULT_MAP_CENTER,
} from 'src/js/widgets/assignments/constants';
import {
  StyledDrawerHeader,
  StyledDrawerContent,
  ContentWrapper,
  CustomerName,
  AddressText,
  DescriptionText,
  AssignNote,
  ToggleRow,
  ToggleLabel,
  FooterButtonsContainer,
  HeaderContent,
  LoadingWrapper,
  GeofenceDropdownMenuFix,
} from 'src/js/widgets/assignments/styles/GeofenceDrawer.styled';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/assignments/store/hooks';
import {
  selectGeofenceConfigurationLoading,
  selectGeofenceNodeForEntity,
} from 'src/js/widgets/assignments/store/geofenceConfigurationSlice';
import {
  clearSelectedPlace,
  selectSelectedPlace,
  selectResolvedPlaceId,
  selectGeofenceOn,
  selectRadius,
  selectSaveError,
  selectAddressError,
  selectRadiusError,
  setGeofenceOn,
  setRadius,
  setAddressError,
  setSaveError,
} from 'src/js/widgets/assignments/store/geofenceLocationSearchSlice';
import { extractGeofenceAddressFields } from 'src/js/widgets/assignments/utils/geofenceUtils';
import type { GeofenceCustomerData } from 'src/js/widgets/assignments/utils/geofenceUtils';
import { useUpdateGeofenceConfiguration } from 'src/js/service/hooks/assignments/useUpdateGeofenceConfiguration';
import { GEOFENCE_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';
import type {
  TimeTracking_TrackTimeAgainstInput,
  TimeTracking_UpdateGeofenceLocationInput,
} from 'src/__generated__/timeTracking/graphql';
import { UnsavedChangesModal } from 'src/js/widgets/common/AssignmentDrawer/components/UnsavedChangesModal';
import GeofenceLocationFields from './GeofenceLocationFields';

interface GeofenceDrawerProps {
  open: boolean;
  entityId: string;
  timeAgainst: TimeTracking_TrackTimeAgainstInput;
  geofenceInfo?: GeofenceCustomerData;
  /** When set, seeds the toggle; otherwise the drawer uses the Redux geofence node value. */
  initialGeofenceOn?: boolean;
  onSave: (geofenceOn: boolean) => void;
  onClose: () => void;
  onShowSuccess?: (message: string) => void;
}

const GeofenceDrawer: React.FC<GeofenceDrawerProps> = ({
  open,
  entityId,
  timeAgainst,
  geofenceInfo,
  initialGeofenceOn,
  onSave,
  onClose,
  onShowSuccess,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const track = useTracking();
  const text = useCallback((id: string) => intl.formatMessage({ id }), [intl]);

  const loading = useAppSelector(selectGeofenceConfigurationLoading);
  const nodeSelector = useMemo(
    () =>
      selectGeofenceNodeForEntity(
        timeAgainst.customerId ?? '',
        timeAgainst.projectId ?? undefined,
      ),
    [timeAgainst.customerId, timeAgainst.projectId],
  );
  const node = useAppSelector(nodeSelector);
  const selectedPlace = useAppSelector(selectSelectedPlace);
  const resolvedPlaceId = useAppSelector(selectResolvedPlaceId);
  const geofenceOn = useAppSelector(selectGeofenceOn);
  const radius = useAppSelector(selectRadius);
  const saveError = useAppSelector(selectSaveError);
  const addressError = useAppSelector(selectAddressError);
  const radiusError = useAppSelector(selectRadiusError);

  const apiGeofenceOn = node?.geofenceEnabled?.value ?? false;
  const resolvedGeofenceOn =
    initialGeofenceOn !== undefined ? initialGeofenceOn : apiGeofenceOn;

  // Derived from selectedPlace (Redux) or fallback to the customer's CRM address.
  // No local state needed — this is the "committed" address used for blur validation.
  const addressValue =
    selectedPlace?.label || geofenceInfo?.customerAddress || '';

  const geofenceCoordinatesSaved = !!(
    node?.geofenceLocation?.latitude && node?.geofenceLocation?.longitude
  );
  const initialMapCenter = geofenceCoordinatesSaved
    ? {
        lat: node!.geofenceLocation!.latitude as number,
        lng: node!.geofenceLocation!.longitude as number,
      }
    : DEFAULT_MAP_CENTER;

  useEffect(() => {
    if (open) {
      track(GEOFENCE_TRACKING_POINTS.VIEW_GEOFENCE_DRAWER);
    }
  }, [open, track]);

  useEffect(() => {
    if (loading || !open) return;
    dispatch(setSaveError(null));
    dispatch(setAddressError(false));
    dispatch(setGeofenceOn(resolvedGeofenceOn));
  }, [dispatch, loading, open, entityId, resolvedGeofenceOn]);

  useEffect(() => {
    if (loading || !open) return;
    dispatch(
      setRadius(
        node?.geofenceLocation?.geofenceRadiusInMeter ??
          GEOFENCE_RADIUS.DEFAULT,
      ),
    );
  }, [dispatch, loading, open, node?.geofenceLocation?.geofenceRadiusInMeter]);

  /** Loader while fetch runs or this entity has no row in Redux yet */
  const showLoader = loading || !entityId;

  const handleMutationSuccess = useCallback(() => {
    // Always clear search state after a successful save so resolvedPlaceId
    // and selectedPlace don't leak into the next drawer open.
    dispatch(clearSelectedPlace());
    onShowSuccess?.(text('assignments.geofence.drawer.saveSuccess'));
    onSave(geofenceOn);
  }, [dispatch, onShowSuccess, onSave, geofenceOn, text]);

  const handleMutationError = useCallback(() => {
    dispatch(setSaveError(text('assignments.geofence.drawer.saveError')));
  }, [dispatch, text]);

  const [updateGeofenceConfiguration, { loading: mutationLoading }] =
    useUpdateGeofenceConfiguration({
      onSuccess: handleMutationSuccess,
      onError: handleMutationError,
    });

  const toggleChanged = geofenceOn !== apiGeofenceOn;
  const savedRadius =
    node?.geofenceLocation?.geofenceRadiusInMeter ?? GEOFENCE_RADIUS.DEFAULT;
  const radiusChanged = geofenceOn && radius !== savedRadius;
  const hasAddressChanged =
    geofenceOn &&
    !!selectedPlace &&
    selectedPlace.label !== geofenceInfo?.customerAddress;

  const hasChanges = toggleChanged || radiusChanged || hasAddressChanged;

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const handleCloseAttempt = useCallback(() => {
    track(GEOFENCE_TRACKING_POINTS.CANCEL_GEOFENCE_DRAWER);
    if (hasChanges) {
      setShowUnsavedModal(true);
    } else {
      onClose();
    }
  }, [track, hasChanges, onClose]);

  const handleModalDontSave = useCallback(() => {
    track(GEOFENCE_TRACKING_POINTS.DONT_SAVE_GEOFENCE);
    setShowUnsavedModal(false);
    onClose();
  }, [track, onClose]);

  const handleSave = useCallback(() => {
    track(GEOFENCE_TRACKING_POINTS.SAVE_GEOFENCE);
    dispatch(setSaveError(null));
    const shouldUpdateEnabled = geofenceOn !== apiGeofenceOn;

    const hasExistingCoordinates = !!(
      node?.geofenceLocation?.latitude && node?.geofenceLocation?.longitude
    );

    // Validate: geofence cannot be on without an address
    if (geofenceOn && !selectedPlace && !hasExistingCoordinates) {
      dispatch(setAddressError(true));
      return;
    }

    const geofenceEnabledInput = shouldUpdateEnabled
      ? {
          value: geofenceOn,
          version: node?.geofenceEnabled?.meta?.version ?? '',
        }
      : undefined;

    const savedRadius =
      node?.geofenceLocation?.geofenceRadiusInMeter ?? GEOFENCE_RADIUS.DEFAULT;
    const radiusChanged = radius !== savedRadius;

    let geofenceLocationInput:
      | TimeTracking_UpdateGeofenceLocationInput
      | undefined;
    if (geofenceOn && selectedPlace) {
      const addressUnchanged =
        hasExistingCoordinates &&
        selectedPlace.label === (geofenceInfo?.customerAddress ?? '');
      geofenceLocationInput = {
        ...extractGeofenceAddressFields(selectedPlace.addressComponents),
        formattedAddress: selectedPlace.address,
        addressLabel: selectedPlace.label,
        placeId: selectedPlace.placeId,
        latitude: addressUnchanged
          ? (node!.geofenceLocation!.latitude as number)
          : selectedPlace.lat,
        longitude: addressUnchanged
          ? (node!.geofenceLocation!.longitude as number)
          : selectedPlace.lng,
        geofenceRadiusInMeter: radius,
        version: node?.geofenceLocation?.meta?.version ?? '',
      };
    } else if (
      geofenceOn &&
      hasExistingCoordinates &&
      (radiusChanged || shouldUpdateEnabled)
    ) {
      // Radius changed OR geofence being enabled — reuse saved lat/lng with resolved placeId
      geofenceLocationInput = {
        placeId: resolvedPlaceId,
        latitude: node!.geofenceLocation!.latitude,
        longitude: node!.geofenceLocation!.longitude,
        geofenceRadiusInMeter: radius,
        version: node?.geofenceLocation?.meta?.version ?? '',
      };
    }

    updateGeofenceConfiguration({
      variables: {
        input: {
          timeAgainst,
          ...(geofenceEnabledInput
            ? { geofenceEnabled: geofenceEnabledInput }
            : {}),
          ...(geofenceLocationInput
            ? { geofenceLocation: geofenceLocationInput }
            : {}),
        },
      },
    });
  }, [
    track,
    dispatch,
    geofenceOn,
    apiGeofenceOn,
    node,
    selectedPlace,
    resolvedPlaceId,
    radius,
    timeAgainst,
    updateGeofenceConfiguration,
    geofenceInfo,
  ]);

  const handleToggle = useCallback(() => {
    track(
      geofenceOn
        ? GEOFENCE_TRACKING_POINTS.TURN_OFF_GEOFENCE
        : GEOFENCE_TRACKING_POINTS.TURN_ON_GEOFENCE,
    );
    dispatch(setGeofenceOn(!geofenceOn));
  }, [track, dispatch, geofenceOn]);

  const handleModalSave = useCallback(() => {
    setShowUnsavedModal(false);
    handleSave();
  }, [handleSave]);

  const saveDisabled =
    showLoader || mutationLoading || !hasChanges || addressError || radiusError;

  return (
    <>
      <Drawer
        open={open}
        onClose={handleCloseAttempt}
        size="medium"
        autoFocus
        restoreFocus
        data-testid="geofence-drawer"
      >
        <GeofenceDropdownMenuFix />
        <StyledDrawerHeader
          title={text('assignments.geofence.drawer.title')}
          onClose={handleCloseAttempt}
        />
        <StyledDrawerContent>
          {saveError && (
            <PageMessage
              type="error"
              open
              dismissible
              onClose={() => dispatch(setSaveError(null))}
              data-testid="geofence-drawer-error"
            >
              {saveError}
            </PageMessage>
          )}
          <ContentWrapper>
            {showLoader ? (
              <LoadingWrapper>
                <Activity shape="dots" size="small" />
              </LoadingWrapper>
            ) : (
              <>
                <HeaderContent>
                  <CustomerName>
                    {geofenceInfo?.customerName ?? ''}
                  </CustomerName>
                  {geofenceInfo?.customerAddress ? (
                    <AddressText>{geofenceInfo.customerAddress}</AddressText>
                  ) : null}
                </HeaderContent>
                <DescriptionText>
                  {text('assignments.geofence.drawer.description')}{' '}
                  <a
                    href={ASSIGNMENT_NAVIGATION_ROUTES.TIME_SETTINGS}
                    onClick={(e) => {
                      track(GEOFENCE_TRACKING_POINTS.MANAGE_SETTINGS_LINK);
                      e.preventDefault();
                      sandbox.navigation.navigate(
                        ASSIGNMENT_NAVIGATION_ROUTES.TIME_SETTINGS,
                      );
                    }}
                  >
                    {text('assignments.geofence.drawer.manageSettings')}
                  </a>
                </DescriptionText>
                <AssignNote>
                  {text('assignments.geofence.drawer.assignNote')}
                </AssignNote>
                {mutationLoading ? (
                  <LoadingWrapper>
                    <Activity shape="dots" size="large" />
                  </LoadingWrapper>
                ) : (
                  <>
                    <ToggleRow>
                      <ToggleLabel>
                        {text('assignments.geofence.drawer.toggleLabel')}
                      </ToggleLabel>
                      <Switch
                        checked={geofenceOn}
                        onChange={handleToggle}
                        aria-label={text(
                          'assignments.geofence.drawer.toggleLabel',
                        )}
                      />
                    </ToggleRow>

                    {geofenceOn && (
                      <GeofenceLocationFields
                        addressValue={addressValue}
                        initialMapCenter={initialMapCenter}
                        geofenceCoordinatesSaved={geofenceCoordinatesSaved}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </ContentWrapper>
        </StyledDrawerContent>

        <DrawerFooter>
          <FooterButtonsContainer>
            <Button
              priority="tertiary"
              purpose="standard"
              onClick={handleCloseAttempt}
            >
              {text('assignments.geofence.drawer.cancel')}
            </Button>
            <Button
              priority="primary"
              purpose="standard"
              onClick={handleSave}
              disabled={saveDisabled}
            >
              {text('assignments.geofence.drawer.save')}
            </Button>
          </FooterButtonsContainer>
        </DrawerFooter>
      </Drawer>

      <UnsavedChangesModal
        open={showUnsavedModal}
        onSave={handleModalSave}
        onDontSave={handleModalDontSave}
        onClose={() => setShowUnsavedModal(false)}
      />
    </>
  );
};

export default GeofenceDrawer;
