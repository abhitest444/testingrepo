import { Sandbox } from 'src/js/common/sandbox';
import { AssignmentsMainTabs, WorkersTabViews } from '../types';

/**
 * Tab Persistence Utility
 * Manages session storage (by personaId) for user's tab selections across sessions
 * Uses Sandbox WebStorage API for user-scoped session with cross-device sync
 *
 * Storage Keys:
 * - assignments_main_tab: Stores main tab selection (CUSTOMERS | WORKERS)
 * - assignments_workers_view: Stores workers sub-view (groups | workers)
 * - assignments_group_detail: Stores selected group detail state (groupId, groupName)
 */

// Storage keys constants
const STORAGE_KEYS = {
  MAIN_TAB: 'assignments_main_tab',
  WORKERS_VIEW: 'assignments_workers_view',
  GROUP_DETAIL: 'assignments_group_detail',
} as const;

/**
 * Group Detail State
 * Stores the currently viewed group's information
 */
export interface GroupDetailState {
  groupId: string;
  groupName: string;
}

/**
 * Tab Persistence API
 * Provides methods to get/set tab selections in localStorage
 */
export const TabPersistence = {
  /**
   * Get the stored main tab selection
   * @param sandbox - Sandbox instance for storage and logging
   * @returns AssignmentsMainTabs (defaults to CUSTOMERS)
   */
  getMainTab: (sandbox: Sandbox): AssignmentsMainTabs => {
    try {
      const saved = sandbox.extensions.qbo.webStorage
        .session()
        .getItemByPersonaId(STORAGE_KEYS.MAIN_TAB);

      // Validate the saved value
      if (
        saved &&
        typeof saved === 'string' &&
        Object.values(AssignmentsMainTabs).includes(
          saved as AssignmentsMainTabs,
        )
      ) {
        return saved as AssignmentsMainTabs;
      }

      return AssignmentsMainTabs.CUSTOMERS; // Default fallback
    } catch (error) {
      sandbox.logger.warn(
        '[Assignments] Failed to read main tab from storage',
        {
          error: String(error),
        },
      );
      return AssignmentsMainTabs.CUSTOMERS;
    }
  },

  /**
   * Save the main tab selection
   * @param sandbox - Sandbox instance for storage and logging
   * @param tab - AssignmentsMainTabs
   */
  setMainTab: (sandbox: Sandbox, tab: AssignmentsMainTabs): void => {
    try {
      // Validate before saving
      if (Object.values(AssignmentsMainTabs).includes(tab)) {
        sandbox.extensions.qbo.webStorage
          .session()
          .setItemByPersonaId(STORAGE_KEYS.MAIN_TAB, tab);
      }
    } catch (error) {
      sandbox.logger.warn('[Assignments] Failed to save main tab to storage', {
        error: String(error),
      });
    }
  },

  /**
   * Clear the stored main tab selection
   * @param sandbox - Sandbox instance for storage and logging
   */
  clearMainTab: (sandbox: Sandbox): void => {
    try {
      sandbox.extensions.qbo.webStorage
        .session()
        .removeItemByPersonaId(STORAGE_KEYS.MAIN_TAB);
    } catch (error) {
      sandbox.logger.warn(
        '[Assignments] Failed to clear main tab from storage',
        {
          error: String(error),
        },
      );
    }
  },

  /**
   * Get the stored workers view selection
   * @param sandbox - Sandbox instance for storage and logging
   * @returns WorkersTabViews (defaults to WORKERS)
   */
  getWorkersView: (sandbox: Sandbox): WorkersTabViews => {
    try {
      const saved = sandbox.extensions.qbo.webStorage
        .session()
        .getItemByPersonaId(STORAGE_KEYS.WORKERS_VIEW);

      // Validate the saved value
      if (
        saved &&
        typeof saved === 'string' &&
        Object.values(WorkersTabViews).includes(saved as WorkersTabViews)
      ) {
        return saved as WorkersTabViews;
      }

      return WorkersTabViews.WORKERS; // Default to workers view
    } catch (error) {
      sandbox.logger.warn(
        '[Assignments] Failed to read workers view from storage',
        {
          error: String(error),
        },
      );
      return WorkersTabViews.WORKERS;
    }
  },

  /**
   * Save the workers view selection
   * @param sandbox - Sandbox instance for storage and logging
   * @param view - WorkersTabViews
   */
  setWorkersView: (sandbox: Sandbox, view: WorkersTabViews): void => {
    try {
      // Validate before saving
      if (Object.values(WorkersTabViews).includes(view)) {
        sandbox.extensions.qbo.webStorage
          .session()
          .setItemByPersonaId(STORAGE_KEYS.WORKERS_VIEW, view);
      }
    } catch (error) {
      sandbox.logger.warn(
        '[Assignments] Failed to save workers view to storage',
        {
          error: String(error),
        },
      );
    }
  },

  /**
   * Clear the stored workers view selection
   * @param sandbox - Sandbox instance for storage and logging
   */
  clearWorkersView: (sandbox: Sandbox): void => {
    try {
      sandbox.extensions.qbo.webStorage
        .session()
        .removeItemByPersonaId(STORAGE_KEYS.WORKERS_VIEW);
    } catch (error) {
      sandbox.logger.warn(
        '[Assignments] Failed to clear workers view from storage',
        {
          error: String(error),
        },
      );
    }
  },

  /**
   * Get the stored group detail state
   * @param sandbox - Sandbox instance for storage and logging
   * @returns GroupDetailState | null (null if not set or invalid)
   */
  getGroupDetail: (sandbox: Sandbox): GroupDetailState | null => {
    try {
      const saved = sandbox.extensions.qbo.webStorage
        .session()
        .getItemByPersonaId(STORAGE_KEYS.GROUP_DETAIL);

      if (!saved || typeof saved !== 'string') {
        return null;
      }

      // Parse and validate
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.groupId === 'string' &&
        typeof parsed.groupName === 'string' &&
        parsed.groupId.trim() !== '' &&
        parsed.groupName.trim() !== ''
      ) {
        return {
          groupId: parsed.groupId,
          groupName: parsed.groupName,
        };
      }

      return null;
    } catch (error) {
      sandbox.logger.warn(
        '[Assignments] Failed to read group detail from storage',
        {
          error: String(error),
        },
      );
      return null;
    }
  },

  /**
   * Save the group detail state
   * @param sandbox - Sandbox instance for storage and logging
   * @param groupId - The ID of the selected group
   * @param groupName - The name of the selected group
   */
  setGroupDetail: (
    sandbox: Sandbox,
    groupId: string,
    groupName: string,
  ): void => {
    try {
      // Validate inputs
      if (
        typeof groupId === 'string' &&
        typeof groupName === 'string' &&
        groupId.trim() !== '' &&
        groupName.trim() !== ''
      ) {
        const state: GroupDetailState = { groupId, groupName };
        sandbox.extensions.qbo.webStorage
          .session()
          .setItemByPersonaId(STORAGE_KEYS.GROUP_DETAIL, JSON.stringify(state));
      } else {
        sandbox.logger.warn('[Assignments] Invalid group detail values', {
          groupId,
          groupName,
        });
      }
    } catch (error) {
      sandbox.logger.warn(
        '[Assignments] Failed to save group detail to storage',
        {
          error: String(error),
        },
      );
    }
  },

  /**
   * Clear the stored group detail state
   * Called when:
   * - User clicks "Back" button in Group Detail View
   * - User switches to "List" view
   * - User switches to "Customers" tab
   * @param sandbox - Sandbox instance for storage and logging
   */
  clearGroupDetail: (sandbox: Sandbox): void => {
    try {
      sandbox.extensions.qbo.webStorage
        .session()
        .removeItemByPersonaId(STORAGE_KEYS.GROUP_DETAIL);
    } catch (error) {
      sandbox.logger.warn(
        '[Assignments] Failed to clear group detail from storage',
        {
          error: String(error),
        },
      );
    }
  },
};

export default TabPersistence;
