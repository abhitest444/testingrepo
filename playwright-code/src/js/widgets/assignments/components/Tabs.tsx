import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { Tab, Tabs } from '@ids-ts/tabs';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { useInitializeItmTasks } from 'src/js/widgets/qbtOrchestrator/features/overview/hooks';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import CustomerAssignmentsTab from './CustomerAssignments/CustomerAssignmentsTab';
import WorkerAssignmentsTab from './WorkerAssignments/WorkerAssignmentsTab';
import store from '../store';
import {
  CUSTOMER_ASSIGNMENTS_TRACKING_POINTS,
  WORKER_ASSIGNMENTS_TRACKING_POINTS,
} from '../utils/assignmentsTrackingPoints';
import { TabsGlobalStyles } from './styles/Tabs.styled';
import { TabPersistence } from '../utils/tabPersistence';
import { AssignmentsMainTabs } from '../types';

interface AssignmentTabsProps {
  initialTab?: string;
  initialView?: string;
}

const ASSIGNMENTS_TABS = {
  CUSTOMERS: {
    value: 'CUSTOMERS',
    label: 'assignments.tab.title.customers',
  },
  WORKERS: {
    value: 'WORKERS',
    label: 'assignments.tab.title.workers',
  },
};

const AssignmentTabs: React.FC<AssignmentTabsProps> = ({
  initialTab,
  initialView,
}) => {
  const sandbox = useSandbox();

  // Initialize ITM tasks on widget load
  useInitializeItmTasks();

  // Feature flag to enable team members tab and hide workers tab in assignments
  const {
    isEnabled: isTeamMembersTabEnabled,
    isLoading: isTeamMembersFlagLoading,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_ENABLE_TIME_TAB_TEAM_MEMBERS,
    defaultValue: false,
  });

  // Initialize tab from localStorage with fallback priority:
  // 1. initialTab prop (if provided)
  // 2. localStorage saved value (loaded in useEffect)
  // 3. Default to CUSTOMERS
  const [tabID, setTabID] = useState(() => {
    if (initialTab) {
      return initialTab;
    }
    return AssignmentsMainTabs.CUSTOMERS;
  });

  const intl = useIntl();

  const track = useTracking();

  // Load persisted tab from web storage on mount and clear it.
  // Skip when the team members flag is on (single-tab view, nothing to restore)
  // or when initialTab is already provided (it takes priority over persistence).
  useEffect(() => {
    if (!isTeamMembersTabEnabled && !initialTab) {
      const persistedTab = TabPersistence.getMainTab(sandbox);
      setTabID(persistedTab);
      TabPersistence.clearMainTab(sandbox);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab, isTeamMembersTabEnabled]);

  /**
   * Handles tab change
   * @param {string} newValue - The new tab ID
   * @returns {void}
   */
  const handleChange = (newValue: string) => {
    // Track the tab click
    if (newValue === ASSIGNMENTS_TABS.CUSTOMERS.value) {
      track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.ASSIGNMENTS_TAB_CLICKED);
      track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.CUSTOMER_TAB_VIEWED);
    } else if (newValue === ASSIGNMENTS_TABS.WORKERS.value) {
      track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.ASSIGNMENTS_TAB_CLICKED);
      track(WORKER_ASSIGNMENTS_TRACKING_POINTS.WORKER_TAB_VIEWED);
    }
    setTabID(newValue);
  };

  // Avoid flashing both tabs before the feature flag settles
  if (isTeamMembersFlagLoading) {
    return null;
  }

  // If team members new experience is enabled, we only show the customers tab in assignments page
  if (isTeamMembersTabEnabled) {
    return (
      <Provider store={store}>
        <CustomerAssignmentsTab />
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <>
        <TabsGlobalStyles />
        <Tabs selected={tabID} onChange={handleChange} isHorizontalRuleVisible>
          <Tab
            id={ASSIGNMENTS_TABS.CUSTOMERS.value}
            title={intl.formatMessage({
              id: ASSIGNMENTS_TABS.CUSTOMERS.label,
            })}
          >
            <CustomerAssignmentsTab />
          </Tab>
          <Tab
            id={ASSIGNMENTS_TABS.WORKERS.value}
            title={intl.formatMessage({ id: ASSIGNMENTS_TABS.WORKERS.label })}
          >
            <WorkerAssignmentsTab initialView={initialView} />
          </Tab>
        </Tabs>
      </>
    </Provider>
  );
};

export default AssignmentTabs;
