import React, { type CSSProperties } from 'react';
import { B1, B2, Demi, Medium } from '@ids-ts/typography';
import { Button } from '@ids-ts/button';
import { Checkbox, CheckboxOnChangeEventType } from '@ids-ts/checkbox';
import { RadioGroup, RadioOnChangeEventType } from '@ids-ts/radio';
import Tooltip from '@ids-ts/tooltip';
import { CircleQuestion } from '@design-systems/icons';
import { useIntl } from '@payroll/quicksand';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/userSettings/store';
import {
  selectDraftPermissions,
  selectPermissions,
  selectPermissionsSaving,
  setDraftManageMyTimesheets,
  setDraftManageSchedule,
  setDraftManageScheduleScope,
  setDraftMobileTimeEntry,
  setDraftProjectsAccess,
  setDraftRole,
  setDraftViewSchedule,
  setDraftViewScheduleScope,
  setDraftViewWhosWorking,
} from 'src/js/widgets/userSettings/store/slices/permissionsSlice';
import {
  PERMISSIONS_CARD_NLS,
  PERMISSIONS_ROLE_NLS_ID,
  PERMISSIONS_ROLE_OPTIONS,
  PERMISSIONS_ROLE_VALUE,
  PROJECTS_ACCESS_NLS_ID,
  PROJECTS_ACCESS_EDIT_OPTIONS,
  PROJECTS_ACCESS_OPTIONS,
  PROJECTS_ACCESS_VALUE,
  PermissionsRole,
  ProjectsAccess,
  SCHEDULE_SCOPE_NLS_ID,
  SCHEDULE_SCOPE_OPTIONS,
  SCHEDULE_SCOPE_RANK,
  SCHEDULE_SCOPE_VALUE,
  ScheduleScope,
} from '../constants';
import {
  CheckboxLabelRow,
  CheckboxStack,
  EditFooter,
  FormSection,
  PermissionsCardHeaderRow,
  PermissionsForm,
  ScheduleGroup,
  ScheduleRow,
  ScheduleSubOptions,
  SectionSubHeader,
} from '../styles/permissionsCard.styles';
import {
  isLockedByCompanySdk,
  resolveTimesheetPermission,
} from '../utils/resolveTimesheetPermission';

export interface PermissionsCardEditProps {
  onSave: () => void;
  onCancel: () => void;
  /** SDK company-grant flags from the parent; lock + force-check the matching rows when true. */
  companyPermissionsSdkFlags: {
    canUseCompanyMobile: boolean;
    canCompanyManageMyTimesheets: boolean;
  };
}

/** Inline-icon style shared with `EditTimeSheetTimeTrackingSettings` for consistent (?) icons. */
const HELP_ICON_STYLE: CSSProperties = {
  marginLeft: '4px',
  alignItems: 'center',
  display: 'inline-block',
  verticalAlign: 'middle',
  cursor: 'default',
  backgroundColor: 'transparent',
  border: 'none',
};

/** Edit surface for the Permissions card; draft + presentational dispatches only. */
const PermissionsCardEdit: React.FC<PermissionsCardEditProps> = ({
  onSave,
  onCancel,
  companyPermissionsSdkFlags,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const draft = useAppSelector(selectDraftPermissions);
  const persisted = useAppSelector(selectPermissions);
  const saving = useAppSelector(selectPermissionsSaving);

  // Type-narrowing guard; parent gates on a successful fetch.
  if (!draft || !persisted) return null;

  // Time-admin role: every checkbox force-checked + schedule/projects at max scope (display-only override).
  const isAdmin = draft.role === PERMISSIONS_ROLE_VALUE.TIME_ADMIN;

  const displayed = {
    mobileTimeEntry: isAdmin
      ? true
      : resolveTimesheetPermission(
          companyPermissionsSdkFlags.canUseCompanyMobile,
          draft.timesheets.mobileTimeEntry,
        ),
    manageMyTimesheets: isAdmin
      ? true
      : resolveTimesheetPermission(
          companyPermissionsSdkFlags.canCompanyManageMyTimesheets,
          draft.timesheets.manageMyTimesheets,
        ),
    viewSchedule: isAdmin ? true : draft.schedule.viewSchedule,
    viewScheduleScope: isAdmin
      ? SCHEDULE_SCOPE_VALUE.COMPANY
      : draft.schedule.viewScheduleScope,
    manageSchedule: isAdmin ? true : draft.schedule.manageSchedule,
    manageScheduleScope: isAdmin
      ? SCHEDULE_SCOPE_VALUE.COMPANY
      : draft.schedule.manageScheduleScope,
    projectsAccess: isAdmin
      ? PROJECTS_ACCESS_VALUE.CREATE_EDIT
      : draft.projectsAccess,
    viewWhosWorking: isAdmin ? true : draft.company.viewWhosWorking,
  };

  const roleOptions = PERMISSIONS_ROLE_OPTIONS.map((value) => ({
    value,
    label: intl.formatMessage({ id: PERMISSIONS_ROLE_NLS_ID[value] }),
  }));

  const scheduleScopeOptions = SCHEDULE_SCOPE_OPTIONS.map((value) => ({
    value,
    label: intl.formatMessage({ id: SCHEDULE_SCOPE_NLS_ID[value] }),
  }));

  /** View-schedule scope options; scopes narrower than the manage scope are disabled (view ⊇ manage). */
  const viewScheduleScopeOptions = SCHEDULE_SCOPE_OPTIONS.map((value) => {
    const disabledByManage =
      displayed.manageSchedule &&
      SCHEDULE_SCOPE_RANK[value] <
        SCHEDULE_SCOPE_RANK[displayed.manageScheduleScope];
    return {
      value,
      label: intl.formatMessage({ id: SCHEDULE_SCOPE_NLS_ID[value] }),
      disabled: isAdmin || disabledByManage,
    };
  });

  let projectsAccessValues: ProjectsAccess[];
  if (isAdmin) {
    projectsAccessValues = PROJECTS_ACCESS_OPTIONS;
  } else if (draft.projectsAccess === PROJECTS_ACCESS_VALUE.CREATE_EDIT) {
    projectsAccessValues = [
      PROJECTS_ACCESS_VALUE.CREATE_EDIT,
      ...PROJECTS_ACCESS_EDIT_OPTIONS,
    ];
  } else {
    projectsAccessValues = PROJECTS_ACCESS_EDIT_OPTIONS;
  }

  const projectsOptions = projectsAccessValues.map((value) => ({
    value,
    label: intl.formatMessage({ id: PROJECTS_ACCESS_NLS_ID[value] }),
    disabled: isAdmin || value === PROJECTS_ACCESS_VALUE.CREATE_EDIT,
  }));

  const isUnchanged = JSON.stringify(draft) === JSON.stringify(persisted);

  const sectionLabel = (id: string) => (
    <B2>
      <Demi>{intl.formatMessage({ id })}</Demi>
    </B2>
  );

  /** Inline checkbox label + (?) tooltip; mirrors `EditTimeSheetTimeTrackingSettings`. */
  const labelWithHelp = (labelId: string, helpId: string) => (
    <CheckboxLabelRow>
      {intl.formatMessage({ id: labelId })}
      <Tooltip
        position="right"
        tooltipOffsetSkidding={-2}
        message={intl.formatMessage({ id: helpId })}
      >
        <CircleQuestion
          size="small"
          color="#6B6C72"
          style={HELP_ICON_STYLE}
          aria-label={intl.formatMessage({ id: helpId })}
        />
      </Tooltip>
    </CheckboxLabelRow>
  );

  return (
    <>
      <PermissionsCardHeaderRow>
        <B1>
          <Medium>
            {intl.formatMessage({ id: PERMISSIONS_CARD_NLS.title })}
          </Medium>
        </B1>
      </PermissionsCardHeaderRow>

      <SectionSubHeader>
        <B2>
          <Demi>
            {intl.formatMessage({ id: PERMISSIONS_CARD_NLS.workforceAccess })}
          </Demi>
        </B2>
      </SectionSubHeader>

      <PermissionsForm data-testid="permissions-card-edit-form">
        {/* Role */}
        <FormSection>
          <RadioGroup
            label={sectionLabel(PERMISSIONS_CARD_NLS.role)}
            options={roleOptions}
            value={draft.role}
            name="permissions-role"
            aria-label={intl.formatMessage({ id: PERMISSIONS_CARD_NLS.role })}
            size="medium"
            onChange={(e: RadioOnChangeEventType) => {
              dispatch(setDraftRole(e.target.value as PermissionsRole));
            }}
          />
        </FormSection>

        {/* Timesheets */}
        <FormSection aria-disabled={isAdmin}>
          {sectionLabel(PERMISSIONS_CARD_NLS.timesheets)}
          <CheckboxStack>
            <Checkbox
              checked={displayed.mobileTimeEntry}
              disabled={
                isAdmin ||
                isLockedByCompanySdk(
                  companyPermissionsSdkFlags.canUseCompanyMobile,
                )
              }
              data-testid="permissions-mobile-time-entry"
              onChange={(e: CheckboxOnChangeEventType) =>
                dispatch(setDraftMobileTimeEntry(!!e.target.checked))
              }
            >
              {labelWithHelp(
                PERMISSIONS_CARD_NLS.mobileTimeEntry,
                PERMISSIONS_CARD_NLS.mobileTimeEntryHelp,
              )}
            </Checkbox>
            <Checkbox
              checked={displayed.manageMyTimesheets}
              disabled={
                isAdmin ||
                isLockedByCompanySdk(
                  companyPermissionsSdkFlags.canCompanyManageMyTimesheets,
                )
              }
              data-testid="permissions-manage-my-timesheets"
              onChange={(e: CheckboxOnChangeEventType) =>
                dispatch(setDraftManageMyTimesheets(!!e.target.checked))
              }
            >
              {labelWithHelp(
                PERMISSIONS_CARD_NLS.manageMyTimesheets,
                PERMISSIONS_CARD_NLS.manageMyTimesheetsHelp,
              )}
            </Checkbox>
          </CheckboxStack>
        </FormSection>

        {/* Schedule */}
        <FormSection aria-disabled={isAdmin}>
          {sectionLabel(PERMISSIONS_CARD_NLS.schedule)}
          <ScheduleGroup>
            <ScheduleRow>
              <Checkbox
                checked={displayed.viewSchedule}
                disabled={isAdmin || displayed.manageSchedule}
                data-testid="permissions-view-schedule"
                onChange={(e: CheckboxOnChangeEventType) =>
                  dispatch(setDraftViewSchedule(!!e.target.checked))
                }
              >
                {intl.formatMessage({ id: PERMISSIONS_CARD_NLS.viewSchedule })}
              </Checkbox>
              {displayed.viewSchedule && (
                <ScheduleSubOptions>
                  <RadioGroup
                    options={viewScheduleScopeOptions}
                    value={displayed.viewScheduleScope}
                    name="permissions-view-schedule-scope"
                    aria-label={intl.formatMessage({
                      id: PERMISSIONS_CARD_NLS.viewSchedule,
                    })}
                    size="medium"
                    vertical
                    disabled={isAdmin}
                    onChange={(e: RadioOnChangeEventType) =>
                      dispatch(
                        setDraftViewScheduleScope(
                          e.target.value as ScheduleScope,
                        ),
                      )
                    }
                  />
                </ScheduleSubOptions>
              )}
            </ScheduleRow>

            <ScheduleRow>
              <Checkbox
                checked={displayed.manageSchedule}
                disabled={isAdmin}
                data-testid="permissions-manage-schedule"
                onChange={(e: CheckboxOnChangeEventType) =>
                  dispatch(setDraftManageSchedule(!!e.target.checked))
                }
              >
                {intl.formatMessage({
                  id: PERMISSIONS_CARD_NLS.manageSchedule,
                })}
              </Checkbox>
              {displayed.manageSchedule && (
                <ScheduleSubOptions>
                  <RadioGroup
                    options={scheduleScopeOptions}
                    value={displayed.manageScheduleScope}
                    name="permissions-manage-schedule-scope"
                    aria-label={intl.formatMessage({
                      id: PERMISSIONS_CARD_NLS.manageSchedule,
                    })}
                    size="medium"
                    vertical
                    disabled={isAdmin}
                    onChange={(e: RadioOnChangeEventType) =>
                      dispatch(
                        setDraftManageScheduleScope(
                          e.target.value as ScheduleScope,
                        ),
                      )
                    }
                  />
                </ScheduleSubOptions>
              )}
            </ScheduleRow>
          </ScheduleGroup>
        </FormSection>

        {/* Projects */}
        <FormSection aria-disabled={isAdmin}>
          <RadioGroup
            label={sectionLabel(PERMISSIONS_CARD_NLS.projects)}
            options={projectsOptions}
            value={displayed.projectsAccess}
            name="permissions-projects-access"
            aria-label={intl.formatMessage({
              id: PERMISSIONS_CARD_NLS.projects,
            })}
            size="medium"
            vertical
            disabled={isAdmin}
            onChange={(e: RadioOnChangeEventType) =>
              dispatch(setDraftProjectsAccess(e.target.value as ProjectsAccess))
            }
          />
        </FormSection>

        {/* Company */}
        <FormSection aria-disabled={isAdmin}>
          {sectionLabel(PERMISSIONS_CARD_NLS.company)}
          <Checkbox
            checked={displayed.viewWhosWorking}
            disabled={isAdmin}
            data-testid="permissions-view-whos-working"
            onChange={(e: CheckboxOnChangeEventType) =>
              dispatch(setDraftViewWhosWorking(!!e.target.checked))
            }
          >
            <CheckboxLabelRow>
              {intl.formatMessage(
                { id: PERMISSIONS_CARD_NLS.viewWhosWorking },
                {
                  scope: intl.formatMessage({
                    id: PERMISSIONS_CARD_NLS.viewWhosWorkingAllWorkers,
                  }),
                },
              )}
              <Tooltip
                position="right"
                tooltipOffsetSkidding={-2}
                message={intl.formatMessage({
                  id: PERMISSIONS_CARD_NLS.viewWhosWorkingHelp,
                })}
              >
                <CircleQuestion
                  size="small"
                  color="#6B6C72"
                  style={HELP_ICON_STYLE}
                  aria-label={intl.formatMessage({
                    id: PERMISSIONS_CARD_NLS.viewWhosWorkingHelp,
                  })}
                />
              </Tooltip>
            </CheckboxLabelRow>
          </Checkbox>
        </FormSection>
      </PermissionsForm>

      <EditFooter>
        <Button priority="tertiary" onClick={onCancel} disabled={saving}>
          {intl.formatMessage({ id: 'actions.cancel' })}
        </Button>
        <Button onClick={onSave} disabled={isUnchanged || saving}>
          {intl.formatMessage({ id: 'actions.save' })}
        </Button>
      </EditFooter>
    </>
  );
};

export default PermissionsCardEdit;
