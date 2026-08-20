import React, { useEffect, useRef } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import styled from 'styled-components';

import Widget from 'web-shell-core/widgets/HOCWidget';
import { useIntl, useTracking, useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { EntityRef, labelPreferenceRef } from 'src/js/widgets/common/types';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import useAuthorization from 'src/js/providers/useAuthorization';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import type { TimeAgainstContactDAS } from 'src/js/widgets/singleTimeTrowser/types/singleTimeEntryQueryTypes';

export interface TimeAgainstFormState {
  customer: EntityRef | null;
  project: EntityRef;
}

export interface CustomerProjectProps {
  name: string;
  width?: number;
  shouldValidate?: boolean;
  hasProjects: boolean;
  trackingPoint: TrackingPoint;
  toggledBillable: boolean;
  isBillingFieldEnabled?: boolean;
  updateLabel?: (field: string, value: string) => void;
  labelPreference: labelPreferenceRef;
  shouldOpenDropdown?: boolean;
  onDropdownOpened?: () => void;
  isTimeClockEntry?: boolean;
  setCustomerProjectLoading?: (loading: boolean) => void;
  isOTX?: boolean;
  isTimeEntry?: boolean;
  timeAgainstContactDAS?: TimeAgainstContactDAS;
}

export const CustomerProject = ({
  name,
  width,
  shouldValidate = false,
  hasProjects,
  trackingPoint,
  toggledBillable,
  isBillingFieldEnabled,
  updateLabel,
  labelPreference,
  shouldOpenDropdown,
  onDropdownOpened,
  isTimeClockEntry,
  setCustomerProjectLoading,
  isOTX = false,
  timeAgainstContactDAS,
}: CustomerProjectProps) => {
  const intl = useIntl();
  const track = useTracking();
  const sandbox = useSandbox();
  const { setError, clearErrors } = useFormContext();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const { decision } = useAuthorization({
    resource: { id: 'irn:intuit::contacts:names:customer:ui:v4' },
    action: { id: 'create' },
  });

  // Check if current user is in workforce
  const isWorkforceUser = isWorkforceEnvironment(
    sandbox as QuickbooksOnlineSandbox,
  );

  // Watch timeFor to get the entity ID for QuickFind customer dropdown
  const timeFor = useWatch({
    name: 'timeFor',
    defaultValue: { id: '', type: 'EMPLOYEE', name: '' },
  });

  // Watch isLocked from form context
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });

  // Customer/project is only required for billable time records
  // Clear the error when billable is false
  useEffect(() => {
    if (!toggledBillable && shouldValidate) {
      clearErrors(name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggledBillable, shouldValidate]);

  useEffect(() => {
    if (shouldOpenDropdown && widgetContainerRef.current) {
      const input = widgetContainerRef.current.querySelector('input');
      if (input) {
        input.focus();
        input.click();
        if (onDropdownOpened) onDropdownOpened();

        // Create a MutationObserver to watch for the dropdown menu
        const observer = new MutationObserver((mutations) => {
          const dropdownMenu = document.querySelector(
            '[id^="idsMenu-position-idsDropdownTypeahead"]',
          );
          if (dropdownMenu) {
            const firstChild = dropdownMenu.firstElementChild;
            if (firstChild) {
              (firstChild as HTMLElement).style.marginTop = '42px';
              observer.disconnect(); // Stop observing once we've found and styled the dropdown
            }
          }
        });

        // Start observing the document body for changes
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        // Cleanup observer on unmount
        return () => observer.disconnect();
      }
    }
    return undefined;
  }, [shouldOpenDropdown, onDropdownOpened]);

  const getFieldlabel = () => {
    if (widgetContainerRef.current) {
      const inputElement = widgetContainerRef.current.querySelector('input');
      if (inputElement) {
        // use this value to populate state
        if (updateLabel) updateLabel('customerProject', inputElement.value);
        // set customer project loading to false as data is loaded now
        setCustomerProjectLoading?.(false);
      }
    }
  };

  const getLabelPreference = (): string => {
    if (hasProjects) {
      if (labelPreference.CustomerTerminology !== '') {
        return `${labelPreference.CustomerTerminology}/${intl.formatMessage({
          id: 'drawer.form.project.label',
        })}`;
      }
      return intl.formatMessage({
        id: 'drawer.form.customer.slash.project.label',
      });
    }
    return (
      labelPreference.CustomerTerminology ||
      intl.formatMessage({ id: 'drawer.form.customer.label' })
    );
  };

  const getPlaceholderPreference = (): string => {
    // if the user has enabled projects for this company
    if (hasProjects) {
      return labelPreference.CustomerTerminology
        ? intl.formatMessage(
            {
              id: 'drawer.form.customer.slash.project.placeholder.with.terminology',
            },
            { terminology: labelPreference.CustomerTerminology },
          )
        : intl.formatMessage({
            id: 'drawer.form.customer.slash.project.placeholder',
          });
    }
    // if the user has not enabled projects for this company
    return labelPreference.CustomerTerminology
      ? intl.formatMessage(
          {
            id: 'drawer.form.customer.placeholder.with.terminology',
          },
          { terminology: labelPreference.CustomerTerminology },
        )
      : intl.formatMessage({
          id: 'drawer.form.customer.placeholder',
        });
  };

  return (
    <Controller
      name={name}
      rules={{
        validate: (value: TimeAgainstFormState) => {
          if (
            shouldValidate &&
            toggledBillable &&
            isBillingFieldEnabled &&
            (!value || !value.customer || !value.customer.id)
          ) {
            return intl.formatMessage({
              id: 'customer.field.required.for.billable.time',
            });
          }
          return undefined;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        // QuickFind customer dropdown is used for OTX customers.
        const shouldUseQuickFind = isOTX;

        if (shouldUseQuickFind) {
          // Use only customer.id for dropdown value so selection works in edit mode when time entry
          // has both customer and project. SFO options are keyed by customer.id when project is null,
          // so passing project.id would show blank for sub-customers/projects. Coerce to string for reliable match.
          const quickFindValue =
            value?.customer?.id != null ? String(value.customer.id) : '';

          // Get display name from timeAgainstContactDAS for pre-populating the dropdown
          const contactDisplayName =
            timeAgainstContactDAS?.customer?.fullName || '';
          return (
            <div ref={widgetContainerRef}>
              <Widget
                widgetId="time-tracking-ui/quickFind"
                dropdownType="customer"
                timeForEntityId={timeFor?.id}
                value={quickFindValue}
                displayName={contactDisplayName}
                onChange={(selectedId: string, item?: any) => {
                  track(trackingPoint);

                  if (!item) {
                    // Clear selection
                    onChange({
                      customer: { id: null, name: null },
                      project: { id: '', name: '' },
                    } as TimeAgainstFormState);
                    updateLabel?.('customer', '');
                    updateLabel?.('project', '');
                    setError(name, { type: 'custom', message: undefined });
                    return;
                  }

                  // Determine if this is a project or customer (support both type and customerType for widget compatibility)
                  const isProject =
                    item.type === 'PROJECT' || item.customerType === 'PROJECT';
                  const projectName = isProject ? item.name : '';

                  // Always use selectedId for customerId; do not pass parentId
                  const customerId = selectedId;

                  const customerName = isProject
                    ? item.fullName?.split(':')[0] || item.name
                    : item.name;

                  // Store project.id when project selected so QuickFind value matches and project stays selected (same as WTE).
                  // API/save still send only customerId (mapSingleTimeForm / mapTimeClockFormInput).
                  onChange({
                    customer: {
                      id: customerId || null,
                      name: customerName,
                    },
                    project: {
                      id: isProject ? selectedId : '',
                      name: projectName,
                    },
                  } as TimeAgainstFormState);

                  updateLabel?.('customer', customerName || '');
                  updateLabel?.('project', projectName || '');
                  setError(name, { type: 'custom', message: undefined });
                }}
                onReady={() => {
                  getFieldlabel();
                }}
                onLoad={() => {
                  setCustomerProjectLoading?.(false);
                }}
                onError={(err: any) => {
                  // Log error but don't fail - widget handles error display
                  sandbox.logger.error(
                    'CustomerProject: Error loading customers',
                    { error: err },
                  );
                }}
                placeholder={getPlaceholderPreference()}
                label={getLabelPreference()}
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
              type="contact"
              addNew={decision?.isAuthorized === true && !isWorkforceUser}
              subTypes="customer"
              disabled={isLocked}
              shouldShowSubLabel
              shouldShowIndentation
              value={value?.customer?.id}
              displayValueKey="fullName"
              onChange={(e: any) => {
                track(trackingPoint);

                const { projectRef, displayName, localId } =
                  e.selectedItem || {};
                const projectId = projectRef?.split(':')[1] || '';
                const projectName = projectId ? displayName : '';
                const customerName =
                  (projectId ? e.selectedItem.parentName : displayName) || null;

                // does this need to manually dirty the field like in TeamMember ?
                onChange({
                  customer: {
                    id: localId || null,
                    name: customerName,
                  },
                  project: {
                    id: isTimeClockEntry ? localId : projectId,
                    name: projectName,
                  },
                } as TimeAgainstFormState);
                updateLabel?.('customer', customerName || '');
                updateLabel?.('project', projectName || '');
                // manually clear the error ?
                setError(name, { type: 'custom', message: undefined });
              }}
              onReady={() => {
                getFieldlabel();
              }}
              placeholder={getPlaceholderPreference()}
              label={getLabelPreference()}
              errorText={error?.message}
              width={width}
            />
          </div>
        );
      }}
    />
  );
};
