import { useIntl, useTracking, useSandbox } from '@payroll/quicksand';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import Widget from 'web-shell-core/widgets/HOCWidget';
import React, { useRef, useMemo } from 'react';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { EntityRef, labelPreferenceRef } from 'src/js/widgets/common/types';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import useAuthorization from 'src/js/providers/useAuthorization';
import { getQuickFindAssignmentFilter } from 'src/js/common/assignmentFieldUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

/**
 * Location Dropdown Component
 *
 * ASSIGNMENT LOGIC INTEGRATION:
 * - Receives worker/customer/project IDs from parent (useSTEFieldAssignments hook)
 * - Calculates assignmentFilters using getQuickFindAssignmentFilter()
 * - If location SF is DISABLED in settings → Pass assigned: true to QuickFind widget
 * - If location SF is ENABLED in settings → Pass assigned: null to QuickFind widget
 * - assignmentFilters is memoized to prevent infinite re-renders
 *
 * The QuickFind widget then uses these filters to show only assigned location items
 * when the field is disabled globally but enabled for specific customers.
 */

export interface LocationProps {
  name: string;
  width?: number;
  shouldValidate?: boolean;
  isLocationRequired?: boolean;
  trackingPoint: TrackingPoint;
  updateLabel?: (field: string, value: string) => void;
  labelPreference: labelPreferenceRef;
  setLocationLoading?: (loading: boolean) => void;
  isOTX?: boolean;
  isTimeEntry?: boolean;
  companySettings?: any;
  timeForEntityId?: string;
  customerId?: string;
  projectId?: string;
  /** When provided, QuickFind uses these options and skips SFO fetch */
  preloadedLocationOptions?: any[] | null;
  /** When provided with preloadedLocationOptions, call SFO again with searchText (debounced); pass null when no text */
  onSearchLocation?: (searchText: string | null) => void;
  hasMoreLocation?: boolean;
  loadMoreLocation?: () => void;
  /** Pre-populated full name from departmentDAS — shown when selected id is not in the first QuickFind page */
  departmentDAS?: { id?: string; fullName?: string };
}

export const Location = ({
  name,
  width,
  shouldValidate = false,
  isLocationRequired = false,
  trackingPoint,
  updateLabel,
  labelPreference,
  setLocationLoading,
  isOTX = false,
  isTimeEntry = false,
  companySettings,
  timeForEntityId,
  customerId,
  projectId,
  preloadedLocationOptions,
  onSearchLocation,
  hasMoreLocation,
  loadMoreLocation,
  departmentDAS,
}: LocationProps) => {
  const intl = useIntl();
  const track = useTracking();
  const sandbox = useSandbox();
  const { setError } = useFormContext();
  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );
  // Watch isLocked from form context
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });

  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const { decision } = useAuthorization({
    resource: { id: 'irn:intuit::accounting_accounting:department' },
    action: { id: 'create' },
  });

  // Memoize assignment filter to prevent infinite loops
  const assignmentFilters = useMemo(() => {
    if (!companySettings) {
      return { assigned: true };
    }
    const assignedFilter = getQuickFindAssignmentFilter(
      'location',
      companySettings,
    );
    return { assigned: assignedFilter };
  }, [companySettings]);

  const getFieldLabel = () => {
    if (widgetContainerRef.current) {
      const inputElement = widgetContainerRef.current.querySelector('input');
      if (inputElement) {
        // use this value to populate state
        if (updateLabel) updateLabel('location', inputElement.value);
        // set location loading to false as data is loaded now
        setLocationLoading?.(false);
      }
    }
  };

  const getPlaceholderPreference = (): string =>
    labelPreference.DepartmentTerminology
      ? intl.formatMessage(
          {
            id: 'drawer.form.location.placeholder.with.terminology',
          },
          { terminology: labelPreference.DepartmentTerminology },
        )
      : intl.formatMessage({
          id: 'drawer.form.location.placeholder',
        });

  return (
    <Controller
      name={name}
      rules={{
        validate: (value: EntityRef) => {
          if (shouldValidate && isLocationRequired && (!value || !value.id)) {
            return intl.formatMessage({
              id: 'drawer.field.required',
            });
          }
          return undefined;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        // QuickFind location dropdown is shown for OTX time entries.
        const shouldUseQuickFind = isOTX && isTimeEntry;

        if (shouldUseQuickFind) {
          return (
            <div ref={widgetContainerRef}>
              <Widget
                widgetId="time-tracking-ui/quickFind"
                dropdownType="location"
                timeForEntityId={timeForEntityId}
                customerId={customerId}
                projectId={projectId}
                assignmentFilters={assignmentFilters}
                preloadedLocationOptions={preloadedLocationOptions}
                onSearchLocation={onSearchLocation}
                hasMoreLocation={hasMoreLocation}
                loadMoreLocation={loadMoreLocation}
                displayName={departmentDAS?.fullName || ''}
                value={value?.id || ''}
                onChange={(selectedId: string, item?: any) => {
                  track(trackingPoint);

                  if (!item) {
                    // Clear selection
                    onChange({ id: '', name: '' } as EntityRef);
                    updateLabel?.('location', '');
                    setError(name, { type: 'custom', message: undefined });
                    return;
                  }

                  onChange({
                    id: selectedId,
                    name: item.name,
                  } as EntityRef);

                  updateLabel?.('location', item.name || '');
                  setError(name, { type: 'custom', message: undefined });
                }}
                onReady={() => {
                  getFieldLabel();
                }}
                onLoad={() => {
                  setLocationLoading?.(false);
                }}
                autoSelect={isLocationRequired}
                onError={(err: any) => {
                  sandbox.logger.error(
                    'Location: Error loading location items',
                    {
                      error: err,
                    },
                  );
                }}
                placeholder={getPlaceholderPreference()}
                label={
                  (labelPreference.DepartmentTerminology ||
                    intl.formatMessage({
                      id: 'drawer.form.location.label',
                    })) + (isLocationRequired ? ' *' : '')
                }
                errorText={error?.message}
                width={width}
                addNew={decision?.isAuthorized === true && !isWorkforceUser}
                disabled={isLocked}
              />
            </div>
          );
        }

        // Use old quickfills widget if feature flag is disabled
        return (
          <div ref={widgetContainerRef}>
            <Widget
              widgetId="qbo-quickfills-ui/quickfills"
              type="locationV2"
              addNew={decision?.isAuthorized === true && !isWorkforceUser}
              value={value?.id}
              disabled={isLocked}
              onChange={(e: any) => {
                if (value.id !== e?.selectedItem?.localId?.toString()) {
                  track(trackingPoint);
                  onChange({
                    id: e?.selectedItem?.localId || e?.selectedItem?.id || '',
                    name:
                      e?.selectedItem?.fullName || e?.selectedItem?.name || '',
                  } as EntityRef);
                }
                updateLabel?.('location', e?.selectedItem?.fullName || '');
                // manually clear the error
                setError(name, { type: 'custom', message: undefined });
              }}
              onReady={() => {
                getFieldLabel();
              }}
              placeholder={getPlaceholderPreference()}
              label={
                (labelPreference.DepartmentTerminology ||
                  intl.formatMessage({
                    id: 'drawer.form.location.label',
                  })) + (isLocationRequired ? ' *' : '') // required location is denoted by asterisk
              }
              errorText={error?.message}
              width={width}
            />
          </div>
        );
      }}
    />
  );
};
