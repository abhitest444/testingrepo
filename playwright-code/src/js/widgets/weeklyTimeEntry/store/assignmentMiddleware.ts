import { Middleware } from '@reduxjs/toolkit';
import {
  setCustomerLoading,
  clearCustomerAssignments,
} from './assignmentSlice';
import { DataAccess_ContactType } from '../../../../__generated__/oigql/graphql';

/**
 * Redux Middleware for WTE Assignment Caching
 *
 * This middleware listens for `updateTimeAgainst` actions and automatically
 * triggers assignment fetching when a customer/project is selected.
 *
 * Flow:
 * 1. User selects customer/project in a row
 * 2. `updateTimeAgainst` action is dispatched
 * 3. Middleware intercepts it
 * 4. If entity type is customer/project → Clear that entity's cache and set loading
 * 5. useWTEAssignmentManager sees uncached entity and runs CF, SF, then SFO, CFO when data arrives
 *
 * We clear the selected entity's cache so the full CF/SF/SFO/CFO flow runs on every customer change.
 */
export const assignmentMiddleware: Middleware =
  (store) => (next) => (action) => {
    // Pass the action through first
    const result = next(action);

    // Check if this is an updateTimeAgainst action
    if (action.type === 'timeEntryGrid/updateTimeAgainst') {
      const { timeAgainst } = action.payload;

      if (
        timeAgainst?.id &&
        (timeAgainst?.type === DataAccess_ContactType.Customer ||
          timeAgainst?.type === 'PROJECT')
      ) {
        const entityId = timeAgainst.id;
        // Clear cache for this entity so useWTEAssignmentManager refetches (CF, SF, CFO)
        store.dispatch(clearCustomerAssignments(entityId));
        store.dispatch(
          setCustomerLoading({ customerId: entityId, loading: true }),
        );
      }
    }

    return result;
  };
