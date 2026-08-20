import React, { useRef, useMemo } from 'react';
import { useIntl, useTracking, useSandbox } from '@payroll/quicksand';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import { EntityRef, ServiceSalesData } from 'src/js/widgets/common/types';
import useAuthorization from 'src/js/providers/useAuthorization';
import { getQuickFindAssignmentFilter } from 'src/js/common/assignmentFieldUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { getRegion } from 'src/js/service/ApolloClientBuilderUtils';
import { TrackingPoint } from '../../../common/useClickTracking';

/**
 * Determines if a service item has tax setup based on company region.
 * AU companies: `taxable` is always false, so use `saleDetails.taxCodeId`.
 * All other regions (US, CA, GB etc.): use the `taxable` boolean directly.
 */
export const isServiceTaxable = (
  region: string,
  taxable: boolean,
  taxCodeId?: string | null,
): boolean => {
  if (region === 'AU') {
    return !!taxCodeId || taxable;
  }
  return taxable;
};

/**
 * Service Dropdown Component
 *
 * ASSIGNMENT LOGIC INTEGRATION:
 * - Receives worker/customer/project IDs from parent (useSTEFieldAssignments hook)
 * - Calculates assignmentFilters using getQuickFindAssignmentFilter()
 * - If service SF is DISABLED in settings → Pass assigned: true to QuickFind widget
 * - If service SF is ENABLED in settings → Pass assigned: null to QuickFind widget
 * - assignmentFilters is memoized to prevent infinite re-renders
 *
 * The QuickFind widget then uses these filters to show only assigned service items
 * when the field is disabled globally but enabled for specific customers.
 */

export interface ServiceProps {
  name: string;
  width?: number;
  shouldValidate?: boolean;
  isServiceRequired?: boolean;
  trackingPoint: TrackingPoint;
  serviceItemPriceRef?: React.RefObject<number>;
  serviceDescriptionRef?: React.RefObject<string>;
  serviceTaxableRef?: React.RefObject<boolean>;
  preLoadedServiceItemsRef?: React.RefObject<ServiceSalesData>;
  isFormEdited?: React.MutableRefObject<boolean[]>;
  rowIndex?: number;
  updateLabel?: (field: string, value: string) => void;
  setServiceLoading?: (loading: boolean) => void;
  isOTX?: boolean;
  isTimeEntry?: boolean;
  companySettings?: any;
  timeForEntityId?: string;
  customerId?: string;
  projectId?: string;
  /** When provided, QuickFind uses these options and skips SFO fetch */
  preloadedServiceOptions?: any[] | null;
  /** When provided with preloadedServiceOptions, call SFO again with searchText (debounced); pass null when no text */
  onSearchService?: (searchText: string | null) => void;
  hasMoreService?: boolean;
  loadMoreService?: () => void;
}

export const Service = ({
  name,
  width,
  shouldValidate = false,
  isServiceRequired = false,
  trackingPoint,
  serviceItemPriceRef,
  serviceDescriptionRef,
  serviceTaxableRef,
  preLoadedServiceItemsRef,
  isFormEdited,
  rowIndex,
  updateLabel,
  setServiceLoading,
  isOTX = false,
  isTimeEntry = false,
  companySettings,
  timeForEntityId,
  customerId,
  projectId,
  preloadedServiceOptions,
  onSearchService,
  hasMoreService,
  loadMoreService,
}: ServiceProps) => {
  const intl = useIntl();
  const track = useTracking();
  const sandbox = useSandbox();
  const region = getRegion(sandbox);
  const { setError } = useFormContext();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const { decision } = useAuthorization({
    resource: { id: 'irn:intuit::inventory:product:items:ui:v4' },
    action: { id: 'create' },
  });
  // Check if current user is in workforce
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
      'service',
      companySettings,
    );
    return { assigned: assignedFilter };
  }, [companySettings]);

  const getFieldlabel = () => {
    if (widgetContainerRef.current) {
      const inputElement = widgetContainerRef.current.querySelector('input');
      if (inputElement) {
        // use this value to populate state
        if (updateLabel) updateLabel('service', inputElement.value);
        // set service loading to false as data is loaded now
        setServiceLoading?.(false);
      }
    }
  };

  return (
    <Controller
      name={name}
      rules={{
        validate: (value: EntityRef) => {
          if (shouldValidate && isServiceRequired && (!value || !value.id)) {
            return intl.formatMessage({
              id: 'drawer.field.required',
            });
          }
          return undefined;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        // QuickFind service dropdown is shown for OTX time entries.
        const shouldUseQuickFind = isOTX && isTimeEntry;

        if (shouldUseQuickFind) {
          return (
            <div ref={widgetContainerRef}>
              <Widget
                widgetId="time-tracking-ui/quickFind"
                dropdownType="service"
                timeForEntityId={timeForEntityId}
                customerId={customerId}
                projectId={projectId}
                assignmentFilters={assignmentFilters}
                preloadedServiceOptions={preloadedServiceOptions}
                onSearchService={onSearchService}
                hasMoreService={hasMoreService}
                loadMoreService={loadMoreService}
                displayName={value?.name || ''}
                value={value?.id || ''}
                onChange={(selectedId: string, item?: any) => {
                  track(trackingPoint);

                  if (!item) {
                    // Clear selection
                    onChange({ id: '', name: '' } as EntityRef);
                    updateLabel?.('service', '');
                    setError(name, { type: 'custom', message: undefined });
                    return;
                  }

                  // Update refs for price, description, taxable
                  if (serviceItemPriceRef) {
                    (
                      serviceItemPriceRef as React.MutableRefObject<number>
                    ).current = item.price || 0;
                  }
                  if (serviceDescriptionRef) {
                    (
                      serviceDescriptionRef as React.MutableRefObject<string>
                    ).current = item.description || '';
                  }
                  if (serviceTaxableRef) {
                    (
                      serviceTaxableRef as React.MutableRefObject<boolean>
                    ).current = item.taxable || false;
                  }

                  if (isFormEdited != null && rowIndex != null) {
                    isFormEdited.current[rowIndex] = true;
                  }

                  onChange({
                    id: selectedId,
                    name: item.name,
                  } as EntityRef);

                  updateLabel?.('service', item.name || '');
                  setError(name, { type: 'custom', message: undefined });
                }}
                onReady={() => {
                  getFieldlabel();
                }}
                onLoad={() => {
                  setServiceLoading?.(false);
                }}
                autoSelect={isServiceRequired}
                onError={(err: any) => {
                  sandbox.logger.error('Service: Error loading service items', {
                    error: err,
                  });
                }}
                placeholder={intl.formatMessage({
                  id: 'drawer.form.service.placeholder',
                })}
                label={
                  intl.formatMessage({
                    id: 'drawer.form.service.label',
                  }) + (isServiceRequired ? ' *' : '')
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
              type="productService"
              subTypes={['SERVICE', 'NONINVENTORY']}
              addNew={decision?.isAuthorized === true && !isWorkforceUser}
              value={value?.id}
              disabled={isLocked}
              onChange={(e: any) => {
                track(trackingPoint);
                // eslint-disable-next-line no-param-reassign
                (
                  serviceItemPriceRef as React.MutableRefObject<number>
                ).current = e?.selectedItem?.traits?.sale?.price || 0;
                // eslint-disable-next-line no-param-reassign
                (
                  serviceDescriptionRef as React.MutableRefObject<string>
                ).current = e?.selectedItem?.traits?.sale?.description || '';
                // eslint-disable-next-line no-param-reassign
                (serviceTaxableRef as React.MutableRefObject<boolean>).current =
                  isServiceTaxable(
                    region,
                    e?.selectedItem?.taxable,
                    e?.selectedItem?.traits?.sale?.taxCodeId,
                  );

                if (isFormEdited != null && rowIndex != null) {
                  // eslint-disable-next-line no-param-reassign
                  isFormEdited.current[rowIndex] = true;
                }
                onChange({
                  id: e?.selectedItem?.localId || '',
                  name: e?.selectedItem?.fullName || '',
                } as EntityRef);
                updateLabel?.('service', e?.selectedItem?.fullName || '');
                // manually clear the error
                setError(name, { type: 'custom', message: undefined });
              }}
              onReady={() => {
                getFieldlabel();
              }}
              onLoad={(item: any) => {
                // Required only for weekly summary, skipping if not available
                if (!preLoadedServiceItemsRef) {
                  return;
                }
                // Try different possible data structures
                const selectedItem =
                  item?.selectedItem || item?.productService || item;
                if (selectedItem?.traits?.sale) {
                  // eslint-disable-next-line no-param-reassign
                  (
                    preLoadedServiceItemsRef as React.MutableRefObject<ServiceSalesData>
                  ).current = {
                    billRate: selectedItem.traits.sale.price || 0,
                    taxable: isServiceTaxable(
                      region,
                      selectedItem?.taxable,
                      selectedItem?.traits?.sale?.taxCodeId,
                    ),
                  };

                  // Update the label with the loaded item name
                  updateLabel?.('service', selectedItem.fullName || '');
                }
              }}
              placeholder={intl.formatMessage({
                id: 'drawer.form.service.placeholder',
              })}
              label={
                intl.formatMessage({
                  id: 'drawer.form.service.label',
                }) + (isServiceRequired ? ' *' : '') // required service is denoted by asterisk
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
