import React, { useMemo, useEffect, useRef } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { useFormContext } from 'react-hook-form';

import { TrackingPoint } from 'src/js/common/useClickTracking';
import { GeneralSettingSection } from 'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection';
import { ViewContent } from 'src/js/widgets/timeTrackingSettings/common/viewContent';
import {
  APPROVAL_FIELD_KEYS,
  TimeEntriesFormType,
} from 'src/js/widgets/timeTrackingSettings/constants';
import {
  SECTION_READY_EVENT,
  SECTION_READY_KEYS,
} from 'src/js/common/constants';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { resolveBool } from 'src/js/common/boolQuery';
import { IFormConfig } from '../../../types';
import { EditApprovalsTimeEntrySettings } from './EditApprovalsTimeEntrySettings';

interface IApprovalsTimeEntrySettings {
  approvalFields: IFormConfig;
  setApprovalFields: (approvalFields: IFormConfig) => void;
  isApprovalEditing: boolean;
  onSaveTimeEntrySettings: (trackingPoint?: TrackingPoint) => void;
  approvalFieldSettingSection: string;
  id: string;
  onFormUpdate: (formType: string) => void;
  onFormCancel: (formType: string) => void;
  shouldShowApprovalControls: boolean;
  isApprovalVisibilityResolved: boolean;
  isDataUpdating?: boolean;
}

export const ApprovalsTimeEntrySettings: React.FC<
  IApprovalsTimeEntrySettings
> = ({
  approvalFields,
  setApprovalFields,
  isApprovalEditing,
  onSaveTimeEntrySettings,
  approvalFieldSettingSection,
  id,
  onFormUpdate,
  onFormCancel,
  shouldShowApprovalControls,
  isApprovalVisibilityResolved,
  isDataUpdating = false,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const {
    approvalSettings,
    approvalSettingsLoading,
    approvalSettingsError,
    isFormEditable,
  } = useTimeTrackingSettingsContext();
  const { setValue } = useFormContext();
  const isInitialized = useRef(false);
  // Publish section ready event when data is loaded
  const sectionReadyPublishedRef = useRef(false);
  useEffect(() => {
    if (
      !approvalSettingsLoading &&
      approvalSettings &&
      !sectionReadyPublishedRef.current
    ) {
      sectionReadyPublishedRef.current = true;
      sandbox.logger.info(
        'Component=ApprovalsTimeEntrySettings Event=SECTION_READY section=APPROVALS',
      );
      sandbox.pubsub.publish(SECTION_READY_EVENT, {
        section: SECTION_READY_KEYS.APPROVALS,
      });
    }
  }, [approvalSettingsLoading, approvalSettings, sandbox]);

  useEffect(
    () => {
      if (
        approvalSettings &&
        approvalFields &&
        !approvalSettingsLoading &&
        isApprovalVisibilityResolved &&
        !isInitialized.current
      ) {
        const isApprovalsEnabled =
          approvalSettings.requireApprovalForTrackedTime?.value;

        // Fields that should be visible only when approvals are enabled
        const visibilityDependentFields: string[] = [
          APPROVAL_FIELD_KEYS.REQUIRE_TEAM_MEMBERS_SUBMIT_TIME,
          APPROVAL_FIELD_KEYS.ENABLE_PARTIAL_WEEK_SUBMISSION,
          APPROVAL_FIELD_KEYS.CUSTOM_MESSAGE,
        ];

        const isTeamMemberSubmitRowVisible = resolveBool({
          must: [isApprovalsEnabled, shouldShowApprovalControls],
        });

        Object.keys(approvalFields).forEach((key) => {
          const formField = approvalFields[key];
          formField.forEach((field) => {
            // Update visibility for fields that depend on approval being enabled
            if (visibilityDependentFields.includes(field.key)) {
              field.isVisible = resolveBool({
                must: [isApprovalsEnabled, shouldShowApprovalControls],
              });
            }
            if (
              field.key ===
              APPROVAL_FIELD_KEYS.REQUIRE_APPROVAL_FOR_TRACKED_TIME
            ) {
              field.isVisible = shouldShowApprovalControls;
            }
            if (
              field.key === APPROVAL_FIELD_KEYS.REQUIRE_TEAM_MEMBERS_SUBMIT_TIME
            ) {
              field.isVisible = isTeamMemberSubmitRowVisible;
            }
            switch (field.key) {
              case APPROVAL_FIELD_KEYS.REQUIRE_APPROVAL_FOR_TRACKED_TIME:
                field.value = approvalSettings.requireApprovalForTrackedTime
                  ?.value
                  ? intl.formatMessage({ id: 'on' })
                  : intl.formatMessage({ id: 'off' });
                setValue(
                  field.key,
                  approvalSettings.requireApprovalForTrackedTime?.value,
                  { shouldDirty: false },
                );
                break;
              case APPROVAL_FIELD_KEYS.REQUIRE_TEAM_MEMBERS_SUBMIT_TIME:
                field.value = approvalSettings.requireTeamMembersSubmitTime
                  ?.value
                  ? intl.formatMessage({ id: 'on' })
                  : intl.formatMessage({ id: 'off' });
                setValue(
                  field.key,
                  approvalSettings.requireTeamMembersSubmitTime?.value,
                  { shouldDirty: false },
                );
                break;
              case APPROVAL_FIELD_KEYS.ENABLE_PARTIAL_WEEK_SUBMISSION:
                field.value = approvalSettings.enablePartialWeekSubmission
                  ?.value
                  ? intl.formatMessage({ id: 'on' })
                  : intl.formatMessage({ id: 'off' });
                setValue(
                  field.key,
                  approvalSettings.enablePartialWeekSubmission?.value,
                  { shouldDirty: false },
                );
                break;
              case APPROVAL_FIELD_KEYS.CUSTOM_MESSAGE:
                field.value = approvalSettings.customMessage?.value || '';
                setValue(field.key, approvalSettings.customMessage?.value, {
                  shouldDirty: false,
                });
                break;
              default:
                break;
            }
          });
        });
        setApprovalFields({ ...approvalFields });
        isInitialized.current = true;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      approvalSettings,
      approvalFields,
      approvalSettingsLoading,
      setValue,
      setApprovalFields,
      isApprovalVisibilityResolved,
      shouldShowApprovalControls,
    ],
  );

  return (
    <GeneralSettingSection
      ViewContent={
        <ViewContent
          formFields={approvalFields}
          isErrorInView={!!approvalSettingsError}
        />
      }
      EditContent={
        <EditApprovalsTimeEntrySettings
          shouldShowTeamMemberSubmissionOption={shouldShowApprovalControls}
          shouldShowRequireApprovalForTrackedTime={shouldShowApprovalControls}
        />
      }
      Title={approvalFieldSettingSection}
      onFormUpdate={onFormUpdate}
      onFormCancel={onFormCancel}
      isFormEdit={isApprovalEditing}
      onSaveTimeTrackingSettings={onSaveTimeEntrySettings}
      id={id}
      isFormEditable={isFormEditable && !approvalSettingsError}
      isDataUpdating={isDataUpdating}
      formEditType={TimeEntriesFormType.APPROVALS}
    />
  );
};
