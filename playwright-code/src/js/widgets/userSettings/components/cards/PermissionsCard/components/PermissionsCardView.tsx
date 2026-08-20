import React from 'react';
import { B1, B2, B4, Demi, Medium } from '@ids-ts/typography';
import { IconControl } from '@ids-ts/icon-control';
import { Edit, ThumbDown } from '@design-systems/icons';
import { Skeleton } from '@cgds/skeleton';
import { useIntl } from '@payroll/quicksand';
import {
  Actions,
  FieldGroup,
} from 'src/js/widgets/userSettings/components/styles/cards.styles';
import { useAppSelector } from 'src/js/widgets/userSettings/store';
import {
  selectPermissions,
  selectPermissionsError,
  selectPermissionsLoading,
} from 'src/js/widgets/userSettings/store/slices/permissionsSlice';
import BreaksStateMessage from '../../BreaksCard/components/BreaksStateMessage';
import {
  PERMISSIONS_CARD_NLS,
  PERMISSIONS_ROLE_NLS_ID,
  PROJECTS_ACCESS_NLS_ID,
  PROJECTS_ACCESS_VALUE,
  SCHEDULE_SCOPE_LOWER_NLS_ID,
} from '../constants';
import {
  PermissionsCardHeaderRow,
  PermissionsFieldsGrid,
  ViewSection,
} from '../styles/permissionsCard.styles';
import { resolveTimesheetPermission } from '../utils/resolveTimesheetPermission';

/** Small uppercase-letter field label (Figma view-mode style). */
const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <B4 style={{ color: 'var(--color-text-secondary)' }}>{children}</B4>
);

/** B2 / Medium field value. */
const FieldValue: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <B2>
    <Medium>{children}</Medium>
  </B2>
);

/** Sub-section bold header ("Workforce access", "Timesheets", etc.). */
const SectionHeader: React.FC<{ id: string }> = ({ id }) => {
  const intl = useIntl();
  return (
    <B2>
      <Demi>{intl.formatMessage({ id })}</Demi>
    </B2>
  );
};

export interface PermissionsCardViewProps {
  showActions?: boolean;
  onEditClick?: () => void;
  companyPermissionsSdkFlags: {
    canUseCompanyMobile: boolean;
    canCompanyManageMyTimesheets: boolean;
    isLoading: boolean;
  };
}

/** View-mode summary: four sub-sections in a 2-col label/value grid (matches Figma). */
const PermissionsCardView: React.FC<PermissionsCardViewProps> = ({
  showActions = true,
  onEditClick,
  companyPermissionsSdkFlags,
}) => {
  const intl = useIntl();
  const permissions = useAppSelector(selectPermissions);
  const loading = useAppSelector(selectPermissionsLoading);
  const error = useAppSelector(selectPermissionsError);

  const isFetching = loading || companyPermissionsSdkFlags.isLoading;
  const showSkeletons = isFetching || !permissions;

  const renderHeader = () => (
    <PermissionsCardHeaderRow>
      <B1>
        <Medium>
          {intl.formatMessage({ id: PERMISSIONS_CARD_NLS.title })}
        </Medium>
      </B1>
      {showActions && (
        <Actions>
          <IconControl
            disabled={showSkeletons}
            onClick={onEditClick}
            aria-label="edit-permissions"
          >
            <Edit />
          </IconControl>
        </Actions>
      )}
    </PermissionsCardHeaderRow>
  );

  // Error takes precedence — failed fetch leaves `permissions` null, so don't gate on loading.
  if (error) {
    return (
      <>
        {renderHeader()}
        <BreaksStateMessage
          icon={ThumbDown}
          messageId={PERMISSIONS_CARD_NLS.errorStateMessage}
          testId="permissions-error-state"
        />
      </>
    );
  }

  const renderValue = (content: React.ReactNode) =>
    showSkeletons ? (
      <Skeleton variant="rectangular" height={18} />
    ) : (
      <FieldValue>{content}</FieldValue>
    );

  const displayedMobileTimeEntry = permissions
    ? resolveTimesheetPermission(
        companyPermissionsSdkFlags.canUseCompanyMobile,
        permissions.timesheets.mobileTimeEntry,
      )
    : false;
  const displayedManageMyTimesheets = permissions
    ? resolveTimesheetPermission(
        companyPermissionsSdkFlags.canCompanyManageMyTimesheets,
        permissions.timesheets.manageMyTimesheets,
      )
    : false;

  const onOff = (b: boolean) =>
    intl.formatMessage({
      id: b ? PERMISSIONS_CARD_NLS.valueOn : PERMISSIONS_CARD_NLS.valueOff,
    });

  const scheduleSummary = (
    on: boolean,
    scope: NonNullable<typeof permissions>['schedule']['viewScheduleScope'],
  ) =>
    on
      ? intl.formatMessage(
          { id: PERMISSIONS_CARD_NLS.scheduleOnWithScope },
          {
            scope: intl.formatMessage({
              id: SCHEDULE_SCOPE_LOWER_NLS_ID[scope],
            }),
          },
        )
      : intl.formatMessage({ id: PERMISSIONS_CARD_NLS.valueOff });

  const projectsSummary = () => {
    if (!permissions) return '';
    return permissions.projectsAccess === PROJECTS_ACCESS_VALUE.NO_ACCESS
      ? intl.formatMessage({ id: PERMISSIONS_CARD_NLS.valueOff })
      : intl.formatMessage({
          id: PROJECTS_ACCESS_NLS_ID[permissions.projectsAccess],
        });
  };

  return (
    <>
      {renderHeader()}

      <ViewSection>
        <SectionHeader id={PERMISSIONS_CARD_NLS.workforceAccess} />
        <PermissionsFieldsGrid>
          <FieldGroup>
            <FieldLabel>
              {intl.formatMessage({ id: PERMISSIONS_CARD_NLS.role })}
            </FieldLabel>
            {renderValue(
              permissions
                ? intl.formatMessage({
                    id: PERMISSIONS_ROLE_NLS_ID[permissions.role],
                  })
                : null,
            )}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>
              {intl.formatMessage(
                { id: PERMISSIONS_CARD_NLS.viewWhosWorking },
                {
                  scope: intl.formatMessage({
                    id: PERMISSIONS_CARD_NLS.viewWhosWorkingAllWorkers,
                  }),
                },
              )}
            </FieldLabel>
            {renderValue(
              permissions ? onOff(permissions.company.viewWhosWorking) : null,
            )}
          </FieldGroup>
        </PermissionsFieldsGrid>
      </ViewSection>

      <ViewSection>
        <SectionHeader id={PERMISSIONS_CARD_NLS.timesheets} />
        <PermissionsFieldsGrid>
          <FieldGroup>
            <FieldLabel>
              {intl.formatMessage({ id: PERMISSIONS_CARD_NLS.mobileTimeEntry })}
            </FieldLabel>
            {renderValue(onOff(displayedMobileTimeEntry))}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>
              {intl.formatMessage({
                id: PERMISSIONS_CARD_NLS.manageTimesheets,
              })}
            </FieldLabel>
            {renderValue(onOff(displayedManageMyTimesheets))}
          </FieldGroup>
        </PermissionsFieldsGrid>
      </ViewSection>

      <ViewSection>
        <SectionHeader id={PERMISSIONS_CARD_NLS.schedule} />
        <PermissionsFieldsGrid>
          <FieldGroup>
            <FieldLabel>
              {intl.formatMessage({ id: PERMISSIONS_CARD_NLS.viewSchedule })}
            </FieldLabel>
            {renderValue(
              permissions
                ? scheduleSummary(
                    permissions.schedule.viewSchedule,
                    permissions.schedule.viewScheduleScope,
                  )
                : null,
            )}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>
              {intl.formatMessage({ id: PERMISSIONS_CARD_NLS.manageSchedule })}
            </FieldLabel>
            {renderValue(
              permissions
                ? scheduleSummary(
                    permissions.schedule.manageSchedule,
                    permissions.schedule.manageScheduleScope,
                  )
                : null,
            )}
          </FieldGroup>
        </PermissionsFieldsGrid>
      </ViewSection>

      <ViewSection>
        <SectionHeader id={PERMISSIONS_CARD_NLS.projects} />
        <PermissionsFieldsGrid>
          <FieldGroup>
            <FieldLabel>
              {intl.formatMessage({ id: PERMISSIONS_CARD_NLS.viewProjects })}
            </FieldLabel>
            {renderValue(projectsSummary())}
          </FieldGroup>
        </PermissionsFieldsGrid>
      </ViewSection>
    </>
  );
};

export default PermissionsCardView;
