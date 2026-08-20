import React, { useEffect, useRef } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import Widget from 'web-shell-core/widgets/HOCWidget';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import GuidanceTooltip from '@ids-ts/guidance-tooltip';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import useAuthorization from 'src/js/providers/useAuthorization';
import { useStorage } from 'src/js/hooks/useStorage';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import type { TimeForContactDAS } from 'src/js/widgets/singleTimeTrowser/types/singleTimeEntryQueryTypes';
import { DataAccess_ContactType } from '../../../../__generated__/oigql/graphql';

export enum TimeForType {
  EMPLOYEE = 'EMPLOYEE',
  VENDOR = 'VENDOR',
  LEGACY_QBO_USER = 'LEGACY_QBO_USER',
}

// LEGACY_QBO_USER mappings are unflagged: only reachable when the gated
// upstream (TeamMemberDropdownGraphQL) emits it; required so flag-ON payloads
// don't silently fall back to Vendor/Employee.
export const TimeForTypeNames = {
  WorkerManagement_Employee: TimeForType.EMPLOYEE,
  Commerce_Vendor: TimeForType.VENDOR,
  TimeTracking_LegacyQboUser: TimeForType.LEGACY_QBO_USER,
};

export const TimeForTypeStringToEnumMap: { [key: string]: TimeForType } = {
  EMPLOYEE: TimeForType.EMPLOYEE,
  VENDOR: TimeForType.VENDOR,
  LEGACY_QBO_USER: TimeForType.LEGACY_QBO_USER,
};

export function mapStringToTimeForType(value: string): TimeForType {
  return TimeForTypeStringToEnumMap[value];
}

/** Normalize type from Quick Find (may send GraphQL enums e.g. WorkerManagement_Employee) to TimeForType so getEmployee/getEmployeeJobCosting runs in STE */
export function normalizeTimeForType(type: string | undefined): TimeForType {
  if (!type) return TimeForType.EMPLOYEE;
  return (
    TimeForTypeNames[type as keyof typeof TimeForTypeNames] ??
    TimeForTypeStringToEnumMap[type] ??
    TimeForTypeStringToEnumMap[String(type).toUpperCase()] ??
    TimeForType.EMPLOYEE
  );
}

export interface TimeForFormState {
  id: string;
  name: string; // need name to print
  type: TimeForType;
}

export const mapTimeForState = (e: any): TimeForFormState => ({
  id: e?.selectedItem?.localId,
  name: e?.selectedItem?.displayName,
  type: mapStringToTimeForType(
    e?.selectedItem?.contact?.type || e?.selectedItem?.type?.toUpperCase(),
  ),
});

export interface TeamMemberProps {
  name: string;
  width?: number;
  timeTrackingOnlyId?: string;
  trackingPoint: TrackingPoint;
  updateLabel?: (field: string, value: string) => void;
  setTeamMemberLoading?: (loading: boolean) => void;
  showQuickFindWidget?: boolean;
  timeForContactDAS?: TimeForContactDAS;
}

export const TeamMember = ({
  name,
  width,
  timeTrackingOnlyId,
  trackingPoint,
  updateLabel,
  setTeamMemberLoading,
  showQuickFindWidget = false,
  timeForContactDAS,
}: TeamMemberProps) => {
  const intl = useIntl();
  const track = useTracking();
  const { setValue, getValues, setError, resetField } = useFormContext();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const { decision } = useAuthorization({
    resource: { id: 'irn:intuit::contacts:names:vendor:ui:v4' },
    action: { id: 'create' },
  });
  const sandbox = useSandbox();
  // Check if current user is in workforce
  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  // Watch isLocked from form context
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });

  const widgetOnReadyFired = useRef(false);
  const [showSelectTeamMemberTooltip, setShowSelectTeamMemberTooltip] =
    useStorage('ttui-showSelectTeamMemberTooltip-single') as [
      boolean,
      (value: boolean) => void,
    ];

  useEffect(() => {
    if (timeTrackingOnlyId) {
      const existingValue = getValues().timeFor;
      const updatedValue = { ...existingValue, id: timeTrackingOnlyId };
      setValue(name, updatedValue, { shouldDirty: true });
    }
  }, [timeTrackingOnlyId]);

  const getFieldlabel = () => {
    if (widgetContainerRef.current) {
      const inputElement = widgetContainerRef.current.querySelector('input');
      if (inputElement) {
        // use this value to populate state
        if (updateLabel) updateLabel('teamMember', inputElement.value);
        // set team member loading to false as data is loaded now
        setTeamMemberLoading?.(false);
      }
    }
  };

  return (
    <Controller
      name={name}
      rules={{
        validate: (value: TimeForFormState) => {
          if (!timeTrackingOnlyId && (!value || !value.id || value.id === '')) {
            return intl.formatMessage({
              id: 'drawer.field.required',
            });
          }
          return undefined;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div aria-label="single-time-team-member-dropdown">
          {showQuickFindWidget ? (
            <>
              <Widget
                errorText={error?.message}
                widgetId="time-tracking-ui/quickFind"
                addNew={decision?.isAuthorized === true && !isWorkforceUser}
                dropdownType="team-member"
                subTypes={[
                  DataAccess_ContactType.Employee,
                  DataAccess_ContactType.Vendor,
                ]}
                value={value?.id}
                // Pre-populate the selected team member's name from the time
                // entry response (timeForContactDAS) so it shows even when the
                // worker is not in the first page of the QuickFind list (e.g.
                // large companies). Falls back to the form state name.
                displayName={
                  `${timeForContactDAS?.firstName ?? ''} ${
                    timeForContactDAS?.lastName ?? ''
                  }`.trim() ||
                  value?.name ||
                  ''
                }
                disabled={!!timeTrackingOnlyId || isLocked}
                placeholder={intl.formatMessage({
                  id: 'team.member.placeholder',
                })}
                label={intl.formatMessage({
                  id: 'team.member',
                })}
                onLoad={(item: any) => {
                  const existingValue = getValues().timeFor;
                  const rawType = item?.contact?.type ?? item?.type;
                  const updatedValue = {
                    ...existingValue,
                    ...(rawType && {
                      type: normalizeTimeForType(rawType),
                    }),
                  };
                  resetField(name, { defaultValue: updatedValue });
                }}
                onChange={(_: string, item: any = {}) => {
                  track(trackingPoint);
                  const normalizedItem: TimeForFormState = {
                    id: item?.id ?? '',
                    name: item?.name ?? '',
                    type: normalizeTimeForType(item?.type),
                  };
                  setValue(name, normalizedItem, { shouldDirty: true });
                  onChange(normalizedItem);
                  setError(name, { type: 'custom', message: undefined });
                }}
                onReady={() => {
                  if (updateLabel)
                    updateLabel('teamMember', getValues().timeFor.name);
                  setTeamMemberLoading?.(false);
                }}
              />
            </>
          ) : (
            <div ref={widgetContainerRef}>
              <Widget
                widgetId="qbo-quickfills-ui/quickfills"
                addNew={decision?.isAuthorized === true && !isWorkforceUser}
                shouldShowSubLabel
                type="contact"
                subTypes={['employee', 'vendor']}
                value={timeTrackingOnlyId || value.id}
                disabled={!!timeTrackingOnlyId || isLocked}
                onChange={(e: any) => {
                  track(trackingPoint);
                  const newValue = mapTimeForState(e);
                  // since using an object for this form value
                  // need to manually dirty the field
                  setValue(name, newValue, { shouldDirty: true });
                  onChange(newValue);

                  // manually clear the error ?
                  setError(name, { type: 'custom', message: undefined });
                }}
                onReady={() => {
                  getFieldlabel();
                  if (
                    !widgetOnReadyFired.current &&
                    !timeTrackingOnlyId &&
                    !value.id
                  ) {
                    // This onReady fires when the widget initially loads
                    // and again when you interact with it the first time.
                    // Also, it fires a 2nd time if you haven't yet interacted with it
                    // and you close the trowser. So, we'll track the first time it fires
                    // to ensure that the tooltip doesn't show up after someone
                    // already dismissed it and then hovers over the dropdown to select
                    // a team member.
                    widgetOnReadyFired.current = true;
                    setShowSelectTeamMemberTooltip(true);
                  }
                }}
                onLoad={(item: any) => {
                  const existingValue = getValues().timeFor;
                  const updatedValue = {
                    ...existingValue,
                    ...(item?.contact?.type && {
                      type: mapStringToTimeForType(item.contact.type),
                    }),
                  };
                  resetField(name, { defaultValue: updatedValue });
                }}
                placeholder={intl.formatMessage({
                  id: 'team.member.placeholder',
                })}
                label={intl.formatMessage({
                  id: 'team.member',
                })}
                errorText={error?.message}
                // width={width}
                excludePayrollInactiveEmployees
              />
            </div>
          )}
        </div>
      )}
    />
  );
};
