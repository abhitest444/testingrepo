import { useIntl, useTracking, useSandbox } from '@payroll/quicksand';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import Widget from 'web-shell-core/widgets/HOCWidget';
import React, { useRef, useMemo } from 'react';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { EntityRef } from 'src/js/widgets/common/types';
import useAuthorization from 'src/js/providers/useAuthorization';
import { getQuickFindAssignmentFilter } from 'src/js/common/assignmentFieldUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

/**
 * Class Dropdown Component
 *
 * ASSIGNMENT LOGIC INTEGRATION:
 * - Receives worker/customer/project IDs from parent (useSTEFieldAssignments hook)
 * - Calculates assignmentFilters using getQuickFindAssignmentFilter()
 * - If class SF is DISABLED in settings → Pass assigned: true to QuickFind widget
 * - If class SF is ENABLED in settings → Pass assigned: null to QuickFind widget
 * - assignmentFilters is memoized to prevent infinite re-renders
 *
 * The QuickFind widget then uses these filters to show only assigned class items
 * when the field is disabled globally but enabled for specific customers.
 */

export interface ClassProps {
  name: string;
  width?: number;
  shouldValidate?: boolean;
  trackingPoint: TrackingPoint;
  isClassRequired?: boolean;
  updateLabel?: (field: string, value: string) => void;
  setClassLoading?: (loading: boolean) => void;
  isOTX?: boolean;
  isTimeEntry?: boolean;
  companySettings?: any;
  timeForEntityId?: string;
  customerId?: string;
  projectId?: string;
  /** When provided, QuickFind uses these options and skips SFO fetch */
  preloadedClassOptions?: any[] | null;
  /** When provided with preloadedClassOptions, call SFO again with searchText (debounced); pass null when no text */
  onSearchClass?: (searchText: string | null) => void;
  hasMoreClass?: boolean;
  loadMoreClass?: () => void;
  /** Pre-populated full name from classDAS — shown when selected id is not in the first QuickFind page */
  classDAS?: { id?: string; fullName?: string };
}

export const Class = ({
  name,
  width,
  shouldValidate = false,
  trackingPoint,
  isClassRequired = false,
  updateLabel,
  setClassLoading,
  isOTX = false,
  isTimeEntry = false,
  companySettings,
  timeForEntityId,
  customerId,
  projectId,
  preloadedClassOptions,
  onSearchClass,
  hasMoreClass,
  loadMoreClass,
  classDAS,
}: ClassProps) => {
  const intl = useIntl();
  const track = useTracking();
  const sandbox = useSandbox();
  const { setError } = useFormContext();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const { decision } = useAuthorization({
    resource: { id: 'irn:intuit::accounting_accounting:klass' },
    action: { id: 'create' },
  });
  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  // Watch isLocked from form context
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });

  // Memoize assignment filter to prevent infinite loops
  const assignmentFilters = useMemo(() => {
    if (!companySettings) {
      return { assigned: true };
    }
    const assignedFilter = getQuickFindAssignmentFilter(
      'class',
      companySettings,
    );
    return { assigned: assignedFilter };
  }, [companySettings]);

  const getFieldlabel = () => {
    if (widgetContainerRef.current) {
      const inputElement = widgetContainerRef.current.querySelector('input');
      if (inputElement) {
        // use this value to populate state
        if (updateLabel) updateLabel('class', inputElement.value);
        // set class loading to false as data is loaded now
        setClassLoading?.(false);
      }
    }
  };

  return (
    <Controller
      name={name}
      rules={{
        validate: (value: EntityRef) => {
          if (shouldValidate && isClassRequired && (!value || !value.id)) {
            return intl.formatMessage({
              id: 'drawer.field.required',
            });
          }
          return undefined;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        // QuickFind class dropdown is shown for OTX time entries.
        const shouldUseQuickFind = isOTX && isTimeEntry;

        if (shouldUseQuickFind) {
          return (
            <div ref={widgetContainerRef}>
              <Widget
                widgetId="time-tracking-ui/quickFind"
                dropdownType="class"
                timeForEntityId={timeForEntityId}
                customerId={customerId}
                projectId={projectId}
                assignmentFilters={assignmentFilters}
                preloadedClassOptions={preloadedClassOptions}
                onSearchClass={onSearchClass}
                hasMoreClass={hasMoreClass}
                loadMoreClass={loadMoreClass}
                displayName={classDAS?.fullName || ''}
                value={value?.id || ''}
                onChange={(selectedId: string, item?: any) => {
                  track(trackingPoint);

                  if (!item) {
                    // Clear selection
                    onChange({ id: '', name: '' } as EntityRef);
                    updateLabel?.('class', '');
                    setError(name, { type: 'custom', message: undefined });
                    return;
                  }

                  onChange({
                    id: selectedId,
                    name: item.name,
                  } as EntityRef);

                  updateLabel?.('class', item.name || '');
                  setError(name, { type: 'custom', message: undefined });
                }}
                onReady={() => {
                  getFieldlabel();
                }}
                onLoad={() => {
                  setClassLoading?.(false);
                }}
                autoSelect={isClassRequired}
                onError={(err: any) => {
                  sandbox.logger.error('Class: Error loading class items', {
                    error: err,
                  });
                }}
                placeholder={intl.formatMessage({
                  id: 'drawer.form.class.placeholder',
                })}
                label={
                  intl.formatMessage({
                    id: 'drawer.form.class.label',
                  }) + (isClassRequired ? ' *' : '')
                }
                errorText={error?.message}
                width={width}
                addNew={decision?.isAuthorized === true && !isWorkforceUser}
                disabled={isLocked}
              />
            </div>
          );
        }

        // Non-OTX or time-activity: legacy quickfills widget.
        return (
          <div ref={widgetContainerRef}>
            <Widget
              widgetId="qbo-quickfills-ui/quickfills"
              addNew={decision?.isAuthorized === true && !isWorkforceUser}
              type="klass"
              value={value?.id}
              disabled={isLocked}
              onChange={(e: any) => {
                track(trackingPoint);
                onChange({
                  id: e?.selectedItem?.id || '',
                  name: e?.selectedItem?.displayName || '',
                } as EntityRef);
                updateLabel?.('class', e?.selectedItem?.displayName || '');
                // manually clear the error
                setError(name, { type: 'custom', message: undefined });
              }}
              onReady={() => {
                getFieldlabel();
              }}
              placeholder={intl.formatMessage({
                id: 'drawer.form.class.placeholder',
              })}
              label={
                intl.formatMessage({
                  id: 'drawer.form.class.label',
                }) + (isClassRequired ? ' *' : '') // required class is denoted by asterisk
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
