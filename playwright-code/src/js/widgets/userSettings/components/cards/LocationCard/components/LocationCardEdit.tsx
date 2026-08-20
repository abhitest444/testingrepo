// @ts-nocheck
import React, { useState } from 'react';
import { B2, Demi, H6 } from '@ids-ts/typography';
import { Button } from '@ids-ts/button';
import { RadioGroup } from '@ids-ts/radio';
import { Activity } from '@ids-ts/loader';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { LOCATION_CARD_EDIT_TRACKING_POINTS } from 'src/js/widgets/userSettings/utils/userSettingsTrackingPoints';
import { NAVIGATION_ROUTES } from 'src/js/widgets/userSettings/components/constants/UserSettingsPage.constants';
import {
  TimeTracking_UserLocationTrackingType,
  TimeTracking_LocationTrackingType,
  TimeTracking_ManageUnifiedUserSettingsPayload,
} from 'src/__generated__/timeTracking/graphql';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/userSettings/store';
import {
  cancelLocationEdit,
  selectLocationDraftSettings,
  selectLocationSettings,
  updateLocationDraft,
  saveLocationSettings,
} from 'src/js/widgets/userSettings/store/slices/locationSlice';
import { selectSettingsFor } from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import { useManageUnifiedUserSettings } from 'src/js/service/hooks/userLevelSettings/useManageUnifiedUserSettings';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';
import {
  Section,
  SectionTitle,
  Divider,
  ActionButtons,
  CompanySettingsLink,
  StyledPageMessage,
  CustomRulesSection,
  LocationSettingsGroup,
} from '../styles/LocationCardEdit.styles';
import { LocationSettingsType } from '../types/LocationCard.types';

interface LocationCardEditProps {
  onSaveSuccess?: () => void;
}

/**
 * LocationCardEdit Component
 *
 * Edit mode for location settings.
 * Reads draft state from Redux and dispatches actions.
 */
const LocationCardEdit: React.FC<LocationCardEditProps> = ({
  onSaveSuccess,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();
  const dispatch = useAppDispatch();
  const draftSettings = useAppSelector(selectLocationDraftSettings);
  const originalSettings = useAppSelector(selectLocationSettings);
  const settingsFor = useAppSelector(selectSettingsFor);

  const [error, setError] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Check if any changes have been made
  const hasChanges = draftSettings.value !== originalSettings.value;

  // Mutation hook for saving location settings
  const { saveLocationSettings: saveLocationMutation, loading: isLoading } =
    useManageUnifiedUserSettings({
      onSuccess: (data: TimeTracking_ManageUnifiedUserSettingsPayload) => {
        sandbox.logger.info(
          'Component=LocationCardEdit Event=Location settings saved successfully',
          { data },
        );
        // Build the expected query format for the Redux action
        const queryData = {
          timeTrackingUnifiedUserSettings: data.userSettings,
        };
        dispatch(saveLocationSettings(queryData));
        onSaveSuccess?.();
      },
      onError: (errorMessage: string) => {
        setError(errorMessage);
      },
      interaction: TimeCustomerInteraction.USER_LOCATION_SETTINGS_SAVE,
    });

  // Determine if using company settings based on draft value
  const isCompanySettings =
    draftSettings.value ===
    TimeTracking_UserLocationTrackingType.UseCompanySetting;

  // Get the current custom rule value - always show effectiveValue from API
  // This shows the actual company setting when using company settings,
  // or the user's custom setting when using custom rules
  const getCustomRuleValue = (): TimeTracking_LocationTrackingType =>
    draftSettings.effectiveValue;

  const handleCancel = () => {
    track(LOCATION_CARD_EDIT_TRACKING_POINTS.CANCEL_LOCATION_CARD);
    if (hasChanges) {
      setShowConfirmModal(true);
    } else {
      setError('');
      dispatch(cancelLocationEdit());
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirmModal(false);
    setError('');
    dispatch(cancelLocationEdit());
  };

  const handleSaveFromModal = () => {
    setShowConfirmModal(false);
    handleSave();
  };

  const handleSave = async () => {
    track(LOCATION_CARD_EDIT_TRACKING_POINTS.SAVE_LOCATION_CARD);
    setError('');

    if (!settingsFor?.id || !settingsFor?.timeForType) {
      sandbox.logger.error(
        'Component=LocationCardEdit Event=Missing settingsFor context',
      );
      setError(
        intl.formatMessage({
          id: 'catch.all.error.content',
        }),
      );
      return;
    }

    sandbox.logger.info(
      'Component=LocationCardEdit Event=Saving location settings',
      { draftSettings, settingsFor },
    );

    await saveLocationMutation(
      {
        id: settingsFor.id,
        timeForType: settingsFor.timeForType,
      },
      {
        value: draftSettings.value,
        version: draftSettings.version,
      },
    );
  };

  const handleSettingsTypeChange = (useCompanySetting: boolean) => {
    if (useCompanySetting) {
      track(LOCATION_CARD_EDIT_TRACKING_POINTS.USE_COMPANY_LEVEL_SETTINGS);
      dispatch(
        updateLocationDraft({
          value: TimeTracking_UserLocationTrackingType.UseCompanySetting,
        }),
      );
    } else {
      track(
        LOCATION_CARD_EDIT_TRACKING_POINTS.USE_CUSTOM_RULES_FOR_THIS_WORKER,
      );
      // When switching to custom, map the effective value to user location tracking type
      const { effectiveValue } = draftSettings;
      let userValue: TimeTracking_UserLocationTrackingType;

      switch (effectiveValue) {
        case TimeTracking_LocationTrackingType.Required:
          userValue = TimeTracking_UserLocationTrackingType.Required;
          break;
        case TimeTracking_LocationTrackingType.Off:
          userValue = TimeTracking_UserLocationTrackingType.Off;
          break;
        default:
          userValue = TimeTracking_UserLocationTrackingType.Optional;
      }

      dispatch(
        updateLocationDraft({
          value: userValue,
        }),
      );
    }
  };

  const handleLocationTrackingChange = (
    value: TimeTracking_LocationTrackingType,
  ) => {
    // Track the location tracking option selection
    switch (value) {
      case TimeTracking_LocationTrackingType.Required:
        track(LOCATION_CARD_EDIT_TRACKING_POINTS.LOCATION_TRACKING_REQUIRED);
        break;
      case TimeTracking_LocationTrackingType.Optional:
        track(LOCATION_CARD_EDIT_TRACKING_POINTS.LOCATION_TRACKING_OPTIONAL);
        break;
      case TimeTracking_LocationTrackingType.Off:
        track(LOCATION_CARD_EDIT_TRACKING_POINTS.LOCATION_TRACKING_OFF);
        break;
      default:
        break;
    }

    // Map LocationTrackingType to UserLocationTrackingType
    let userValue: TimeTracking_UserLocationTrackingType;

    switch (value) {
      case TimeTracking_LocationTrackingType.Required:
        userValue = TimeTracking_UserLocationTrackingType.Required;
        break;
      case TimeTracking_LocationTrackingType.Off:
        userValue = TimeTracking_UserLocationTrackingType.Off;
        break;
      default:
        userValue = TimeTracking_UserLocationTrackingType.Optional;
    }

    dispatch(
      updateLocationDraft({
        value: userValue,
        effectiveValue: value,
      }),
    );
  };

  const handleManageCompanySettings = (e: React.MouseEvent) => {
    e.preventDefault();
    track(LOCATION_CARD_EDIT_TRACKING_POINTS.MANAGE_COMPANY_LOCATION_TRACKING);
    sandbox.navigation.navigate(NAVIGATION_ROUTES.TIME_SETTINGS);
    sandbox.logger.info(
      'Component=LocationCardEdit Event=Navigate to company location settings',
    );
  };

  return (
    <div>
      <H6>
        <Demi>{intl.formatMessage({ id: 'location.title' })}</Demi>
      </H6>

      {/* Error Message */}
      {error && (
        <div>
          <StyledPageMessage
            type="error"
            open
            dismissible={false}
            automationId="LocationCardEditErrorPageMessage"
            title={intl.formatMessage({
              id: 'location.error.title',
            })}
            onClose={() => setError('')}
          >
            {error}
          </StyledPageMessage>
        </div>
      )}

      {/* Location tracking settings radio */}
      <Section>
        <B2>
          <Demi>{intl.formatMessage({ id: 'location.tracking.label' })}</Demi>
        </B2>
        <LocationSettingsGroup>
          <RadioGroup
            options={[
              {
                label: (
                  <span>
                    {intl.formatMessage({
                      id: 'location.use.company.settings',
                    })}{' '}
                    <CompanySettingsLink
                      href="#"
                      onClick={handleManageCompanySettings}
                    >
                      {intl.formatMessage({
                        id: 'location.manage.company.settings',
                      })}
                    </CompanySettingsLink>
                  </span>
                ),
                value: LocationSettingsType.COMPANY,
              },
              {
                label: intl.formatMessage({
                  id: 'location.use.custom.rules',
                }),
                value: LocationSettingsType.CUSTOM,
              },
            ]}
            value={
              isCompanySettings
                ? LocationSettingsType.COMPANY
                : LocationSettingsType.CUSTOM
            }
            onChange={(e) =>
              handleSettingsTypeChange(
                e.target.value === LocationSettingsType.COMPANY,
              )
            }
            name="location-settings-type"
            aria-label="location-settings-type"
            size="medium"
            vertical
          />
        </LocationSettingsGroup>
      </Section>

      <Divider />

      {/* Custom location tracking rules */}
      <CustomRulesSection>
        <SectionTitle>
          <B2>
            <Demi>
              {intl.formatMessage({ id: 'location.custom.rules.title' })}
            </Demi>
          </B2>
        </SectionTitle>

        <LocationSettingsGroup>
          <RadioGroup
            options={[
              {
                label: intl.formatMessage({
                  id: 'location.tracking.required',
                }),
                value: TimeTracking_LocationTrackingType.Required,
                description: intl.formatMessage({
                  id: 'location.tracking.required.description',
                }),
                disabled: isCompanySettings,
              },
              {
                label: intl.formatMessage({
                  id: 'location.tracking.optional',
                }),
                value: TimeTracking_LocationTrackingType.Optional,
                description: intl.formatMessage({
                  id: 'location.tracking.optional.description',
                }),
                disabled: isCompanySettings,
              },
              {
                label: intl.formatMessage({
                  id: 'location.tracking.off',
                }),
                value: TimeTracking_LocationTrackingType.Off,
                description: intl.formatMessage({
                  id: 'location.tracking.off.description',
                }),
                disabled: isCompanySettings,
              },
            ]}
            value={getCustomRuleValue()}
            onChange={(e) =>
              handleLocationTrackingChange(
                e.target.value as TimeTracking_LocationTrackingType,
              )
            }
            name="location-tracking-option"
            aria-label="location-tracking-options"
            size="medium"
            vertical
            disabled={isCompanySettings}
          />
        </LocationSettingsGroup>
      </CustomRulesSection>

      <ActionButtons>
        <Button
          priority="tertiary"
          onClick={handleCancel}
          aria-label="cancel-location"
          disabled={isLoading}
        >
          {intl.formatMessage({ id: 'actions.cancel' })}
        </Button>
        <Button
          onClick={handleSave}
          aria-label="save-location"
          disabled={isLoading || !hasChanges}
          isLoading={isLoading}
          loadingComponent={<Activity shape="dots" size="small" />}
        >
          {intl.formatMessage({ id: 'actions.save' })}
        </Button>
      </ActionButtons>

      {/* Confirmation Modal for unsaved changes */}
      <ConfirmationModal
        open={showConfirmModal}
        setOpen={setShowConfirmModal}
        title={intl.formatMessage({ id: 'unsaved.changes.modal.title' })}
        onYesClick={handleSaveFromModal}
        onNoClick={handleConfirmDiscard}
        yesButtonLabel={intl.formatMessage({
          id: 'unsaved.changes.modal.save',
        })}
        noButtonLabel={intl.formatMessage({
          id: 'unsaved.changes.modal.dont.save',
        })}
        size="small"
        dismissible
        showSectionDivider={false}
        actionAlignment="center"
        contentAlignment="center"
        headerAlignment="center"
      >
        <span>
          {intl.formatMessage({ id: 'unsaved.changes.modal.message' })}
        </span>
      </ConfirmationModal>
    </div>
  );
};

export default LocationCardEdit;
