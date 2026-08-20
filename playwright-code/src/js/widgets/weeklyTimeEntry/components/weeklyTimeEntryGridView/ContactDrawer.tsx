import React, { useCallback, useEffect, useMemo } from 'react';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { useSandbox } from '@payroll/quicksand';
import { useAppDispatch } from '../../store';
import { updateTimeAgainst } from '../../store/timeEntryGridSlice';
import { addCustomer } from '../../store/customerSlice';
import {
  DataAccess_ContactType,
  DataAccess_Customer,
} from '../../../../../__generated__/oigql/graphql';
import { transformCustomerData } from '../../utils/helpers';

export interface ContactDrawerProps {
  rowId: string;
  defaultName?: string;
  onClose?: () => void;
  onSelect?: () => void;
}

export const ContactDrawer: React.FC<ContactDrawerProps> = ({
  rowId,
  defaultName = '',
  onClose,
  onSelect,
}) => {
  const dispatch = useAppDispatch();
  const sandbox = useSandbox();

  const handleDrawerClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // Shared function to handle customer creation/selection logic
  const handleCustomerSelection = useCallback(
    (customerData: DataAccess_Customer, shouldAddToStore: boolean = false) => {
      if (customerData && customerData.id) {
        // Transform customer data to match the expected format
        const transformedCustomerData = transformCustomerData(customerData);
        // Update timeAgainst with the newly created customer
        dispatch(
          updateTimeAgainst({
            rowId,
            timeAgainst: {
              type: DataAccess_ContactType.Customer,
              id: transformedCustomerData.id,
              displayName: transformedCustomerData.displayName,
            },
          }),
        );
        // Add the new customer to Redux store if needed (only for direct widget saves)
        if (shouldAddToStore) {
          dispatch(addCustomer({ customer: transformedCustomerData }));
        }

        // Call the parent's onSelect callback to handle any additional refresh logic
        if (onSelect) onSelect();
      }
    },
    [dispatch, rowId, onSelect],
  );

  const handleDrawerSaveSuccess = useCallback(
    (customerData: any) => {
      // Handle customer selection with store update and drawer close
      handleCustomerSelection(customerData, true);
      handleDrawerClose();
    },
    [handleCustomerSelection, handleDrawerClose],
  );

  // Prevent drawer from closing on all events
  const handleDrawerEvent = useCallback((event: React.SyntheticEvent) => {
    // Stop event propagation for all events that might cause the drawer to close
    event.stopPropagation();
  }, []);
  // Event handlers object to prevent drawer from closing
  const drawerEventHandlers = useMemo(
    () => ({
      onClick: handleDrawerEvent,
      onMouseDown: handleDrawerEvent,
      onMouseUp: handleDrawerEvent,
      onFocus: handleDrawerEvent,
      onBlur: handleDrawerEvent,
    }),
    [handleDrawerEvent],
  );

  // Memoized onReady callback for the Widget
  const handleWidgetReady = useCallback(() => {
    // This callback ensures the AppFabric widget is properly initialized
    // and calls this.ready() internally to mark the widget as ready for rendering
    sandbox.logger.log('Contact drawer widget ready');
  }, [sandbox.logger]);

  return (
    <div
      aria-hidden="true"
      onClick={drawerEventHandlers.onClick}
      onMouseDown={drawerEventHandlers.onMouseDown}
      onMouseUp={drawerEventHandlers.onMouseUp}
      onFocus={drawerEventHandlers.onFocus}
      onBlur={drawerEventHandlers.onBlur}
    >
      <Widget
        widgetId="qbo-contacts-v2/contact-drawer"
        open
        defaultName={defaultName}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerSaveSuccess}
        onReady={handleWidgetReady}
      />
    </div>
  );
};

export default ContactDrawer;
