import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ComboLink, { MenuItem } from '@ids-ts/combo-link';
import { IconControl } from '@ids-ts/icon-control';
import { Table } from '@ids-ts/table';
import Switch from '@ids-ts/switch';
import PageMessage from '@ids-ts/page-message';
import { ChevronDown, ChevronUp } from '@design-systems/icons';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Activity } from '@ids-ts/loader';
import {
  TimeAgainstAssignmentSummaryConnection,
  TimeAgainstAssignmentSummaryEdge,
} from 'src/js/service/types/assignmentTypes';
import { getAssignmentDisplayText } from 'src/js/widgets/common/assignment/assignmentUtils';
import { ASSIGNMENT_ACTIONS } from 'src/js/widgets/assignments/constants';
import { DetailedErrorInfo } from 'src/js/widgets/assignments/types';
import {
  CUSTOMER_ASSIGNMENTS_TRACKING_POINTS,
  GEOFENCE_TRACKING_POINTS,
} from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/assignments/store/hooks';
import { useGeofenceConfiguration } from 'src/js/service/hooks/assignments/useGeofenceConfiguration';
import { useUpdateGeofenceConfiguration } from 'src/js/service/hooks/assignments/useUpdateGeofenceConfiguration';
import {
  selectGeofenceConfigurationError,
  selectGeofenceConfigurationLoading,
  selectGeofenceConfigurationNodes,
  selectGeofenceOverrides,
  setGeofenceConfigurationError,
  setGeofenceConfigurationLoading,
  setGeofenceConfigurationNodes,
  setGeofenceOverride,
  upsertGeofenceNode,
} from 'src/js/widgets/assignments/store/geofenceConfigurationSlice';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import {
  useGetEntitlements,
  computeHasTimeElite,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import { useGetQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';
import { buildGeofenceConfigMap } from 'src/js/widgets/assignments/utils/geofenceUtils';
import {
  ActionsContainer,
  CenteredErrorContainer,
  CustomerName,
  ExpandableCell,
  GeofenceAddress,
  HeaderTable,
} from './CustomerAssignmentTable.styled';
import FieldAssignmentIntegration from './FieldAssignmentIntegration';

import WorkerAssignmentIntegration from './WorkerAssignmentIntegration';
import GeofenceDrawer from './GeofenceDrawer';

interface CustomerAssignmentTableProps {
  data: TimeAgainstAssignmentSummaryConnection | null;
  error: string | null;
  onRefresh?: () => void;
  onError?: (errorInfo: DetailedErrorInfo) => void;
  onClearError?: () => void;
  onShowSuccess?: (message: string) => void;
  searchValue?: string;
  activeFieldAssignment?: TimeAgainstAssignmentSummaryEdge | null;
  onSetActiveFieldAssignment?: (
    assignment: TimeAgainstAssignmentSummaryEdge | null,
  ) => void;
  activeWorkerAssignment?: TimeAgainstAssignmentSummaryEdge | null;
  onSetActiveWorkerAssignment?: (
    assignment: TimeAgainstAssignmentSummaryEdge | null,
  ) => void;
  onEditCustomer?: (contactId: string, customerId: string) => void;
}

// Helper interface for hierarchical data structure
interface HierarchicalNode extends TimeAgainstAssignmentSummaryEdge {
  children?: HierarchicalNode[];
  level: number; // 0 = top level, 1 = child, 2 = grandchild, 3 = great-grandchild, 4 = great-great-grandchild
}

const CustomerAssignmentTable: React.FC<CustomerAssignmentTableProps> = ({
  data,
  error,
  onError,
  onClearError,
  onShowSuccess,
  searchValue = '',
  activeFieldAssignment,
  onSetActiveFieldAssignment,
  activeWorkerAssignment,
  onSetActiveWorkerAssignment,
  onEditCustomer,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();

  const { isEnabled: isGeofenceFeatureFlagEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_R6_GEOFENCE,
    defaultValue: false,
  });

  const { data: entitlements } = useGetEntitlements();
  const isTimeElite = computeHasTimeElite(entitlements || []);
  const { qlSettings } = useGetQLSettings();
  const geofenceSettingsEnabled = qlSettings.geofenceEnabled?.value ?? false;
  const isGeofenceEnabled =
    isTimeElite && isGeofenceFeatureFlagEnabled && geofenceSettingsEnabled;

  const dispatch = useAppDispatch();
  const geofenceConfigLoading = useAppSelector(
    selectGeofenceConfigurationLoading,
  );
  const geofenceConfigNodes = useAppSelector(selectGeofenceConfigurationNodes);
  const geofenceConfigError = useAppSelector(selectGeofenceConfigurationError);

  const {
    loading: geofenceLoading,
    data: geofenceData,
    error: geofenceError,
    loadGeofenceConfiguration,
  } = useGeofenceConfiguration();

  // Stable ref to the latest edges so callbacks below don't capture stale data
  const edgesRef = useRef(data?.edges);

  const refreshGeofenceConfiguration = useCallback(() => {
    const edges = edgesRef.current;
    if (!edges || edges.length === 0) return;
    const timeAgainstList = edges.map((edge) => {
      const { project, customer } = edge.node.timeAgainst.timeAgainstContactDAS;
      return {
        customerId: customer?.id ?? '',
        ...(project?.id ? { projectId: project.id } : {}),
      };
    });
    loadGeofenceConfiguration({ input: { timeAgainstList } });
  }, [loadGeofenceConfiguration]);

  const [updateGeofenceConfiguration] = useUpdateGeofenceConfiguration();

  const handleInlineGeofenceToggle = useCallback(
    (
      nodeId: string,
      geofenceEnabledVersion: string | null,
      timeAgainst: { customerId: string; projectId?: string },
    ) => {
      dispatch(setGeofenceOverride({ entityId: nodeId, value: false }));
      setTogglingNodeIds((prev) => new Set(prev).add(nodeId));
      updateGeofenceConfiguration({
        variables: {
          input: {
            timeAgainst,
            geofenceEnabled: {
              value: false,
              version: geofenceEnabledVersion ?? '',
            },
          },
        },
      })
        .then((result) => {
          const response =
            result?.data?.timeTrackingUpdateGeofenceConfiguration;
          if (response && !('errorCode' in response)) {
            dispatch(upsertGeofenceNode(response.geofenceConfiguration));
          } else {
            dispatch(setGeofenceOverride({ entityId: nodeId, value: true }));
            onError?.({
              title: intl.formatMessage({
                id: 'assignments.geofence.inlineToggle.error.title',
              }),
              description: intl.formatMessage({
                id: 'assignments.geofence.inlineToggle.error.description',
              }),
            });
          }
        })
        .catch(() => {
          dispatch(setGeofenceOverride({ entityId: nodeId, value: true }));
          onError?.({
            title: intl.formatMessage({
              id: 'assignments.geofence.inlineToggle.error.title',
            }),
            description: intl.formatMessage({
              id: 'assignments.geofence.inlineToggle.error.description',
            }),
          });
        })
        .finally(() => {
          setTogglingNodeIds((prev) => {
            const next = new Set(prev);
            next.delete(nodeId);
            return next;
          });
        });
    },
    [dispatch, updateGeofenceConfiguration, onError, intl],
  );

  useEffect(() => {
    dispatch(setGeofenceConfigurationLoading(geofenceLoading));
    dispatch(setGeofenceConfigurationNodes(geofenceData));
    dispatch(setGeofenceConfigurationError(geofenceError));
  }, [geofenceLoading, geofenceData, geofenceError, dispatch]);

  edgesRef.current = data?.edges;

  // Derive a stable string key from edge IDs so the effect only fires when IDs actually change,
  // not on every render cycle caused by cache-and-network returning new array references
  const edgeIdsKey = useMemo(
    () =>
      data?.edges
        ?.map((e) => {
          const { project, customer } =
            e.node.timeAgainst.timeAgainstContactDAS;
          return project?.id ?? customer?.id ?? '';
        })
        .join(',') ?? '',
    [data?.edges],
  );

  // Fetch geofence configuration when table data / flags change
  useEffect(() => {
    if (!isGeofenceEnabled || !edgeIdsKey) {
      return;
    }
    const edges = edgesRef.current;
    if (!edges || edges.length === 0) return;

    const timeAgainstList = edges.map((edge) => {
      const { project, customer } = edge.node.timeAgainst.timeAgainstContactDAS;
      return {
        customerId: customer?.id ?? '',
        ...(project?.id ? { projectId: project.id } : {}),
      };
    });
    loadGeofenceConfiguration({ input: { timeAgainstList } });
  }, [isGeofenceEnabled, edgeIdsKey, loadGeofenceConfiguration]);

  const geofenceOverrides = useAppSelector(selectGeofenceOverrides);

  const geofenceConfigMap = useMemo(
    () =>
      isGeofenceEnabled && data?.edges
        ? buildGeofenceConfigMap(data.edges, geofenceConfigNodes)
        : {},
    [isGeofenceEnabled, data?.edges, geofenceConfigNodes],
  );

  const text = useCallback(
    (id: string, values?: Record<string, any>) =>
      intl.formatMessage({ id }, values),
    [intl],
  );

  const [togglingNodeIds, setTogglingNodeIds] = useState<Set<string>>(
    () => new Set(),
  );

  // Geofence drawer state
  const [geofenceDrawer, setGeofenceDrawer] =
    useState<TimeAgainstAssignmentSummaryEdge | null>(null);

  // Stores the geofence state before drawer was opened so we can revert on cancel
  const preDrawerGeofenceRef = useRef<boolean>(false);

  // Build hierarchical structure up to 5 levels
  const hierarchicalData = useMemo<HierarchicalNode[]>(() => {
    if (!data?.edges || data.edges.length === 0) return [];

    const nodeMap = new Map<string, HierarchicalNode>();
    const rootNodes: HierarchicalNode[] = [];

    // First pass: create all nodes with level 0
    data.edges.forEach((edge) => {
      const { project, customer } = edge.node.timeAgainst.timeAgainstContactDAS;
      const id = project?.id || customer?.id || '';
      if (id) {
        nodeMap.set(id, {
          ...edge,
          children: [],
          level: 0,
        });
      }
    });

    // Second pass: build hierarchy
    data.edges.forEach((edge) => {
      const { project, customer } = edge.node.timeAgainst.timeAgainstContactDAS;
      const { parentId } = edge.node.timeAgainst;
      const id = project?.id || customer?.id || '';
      const node = nodeMap.get(id);

      if (!node) return;

      if (!parentId) {
        // Root level node
        rootNodes.push(node);
      } else {
        // Child node - find parent and add as child
        const parentNode = nodeMap.get(parentId);
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = [];
          }
          node.level = parentNode.level + 1;
          // Only support up to 5 levels (0, 1, 2, 3, 4)
          if (node.level <= 4) {
            parentNode.children.push(node);
          }
        } else {
          // If parent not found, treat as root
          rootNodes.push(node);
        }
      }
    });

    return rootNodes;
  }, [data?.edges]);

  // Filter hierarchical data based on search value
  const filteredHierarchicalData = useMemo(() => {
    if (!searchValue) return hierarchicalData;

    const searchLower = searchValue.toLowerCase();

    const filterNode = (node: HierarchicalNode): HierarchicalNode | null => {
      const displayName =
        node.node.timeAgainst.displayName ||
        node.node.timeAgainst.fullName ||
        '';
      const matchesSearch = displayName.toLowerCase().includes(searchLower);

      // Filter children recursively
      const filteredChildren =
        node.children
          ?.map(filterNode)
          .filter((child): child is HierarchicalNode => child !== null) || [];

      // Include node if it matches or if any of its children match
      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    };

    return hierarchicalData
      .map(filterNode)
      .filter((node): node is HierarchicalNode => node !== null);
  }, [hierarchicalData, searchValue]);

  // Initialize expandedNodes with all node IDs (expanded by default)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const allNodeIds = new Set<string>();
    if (data?.edges) {
      data.edges.forEach((edge) => {
        const { project, customer } =
          edge.node.timeAgainst.timeAgainstContactDAS;
        const id = project?.id || customer?.id || '';
        if (id) {
          allNodeIds.add(id);
        }
      });
    }
    return allNodeIds;
  });

  // Update expandedNodes when data changes
  React.useEffect(() => {
    if (data?.edges) {
      const allNodeIds = new Set<string>();
      data.edges.forEach((edge) => {
        const { project, customer } =
          edge.node.timeAgainst.timeAgainstContactDAS;
        const id = project?.id || customer?.id || '';
        if (id) {
          allNodeIds.add(id);
        }
      });
      setExpandedNodes(allNodeIds);
    }
  }, [data?.edges]);

  const toggleExpansion = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const getTeamMemberSummary = useCallback(
    (node: HierarchicalNode) => {
      const assignmentCount = node.node.assignedTimeForCount || 0;
      const totalCount = data?.totalTimeForAssignments || 0;
      return getAssignmentDisplayText(assignmentCount, totalCount, intl);
    },
    [data, intl],
  );

  const getFieldSummary = useCallback(
    (node: HierarchicalNode) => {
      const assignmentCount =
        (node.node.assignedCustomFieldCount || 0) +
        (node.node.assignedStandardFieldCount || 0);
      const totalCount =
        (data?.totalCustomFieldAssignments || 0) +
        (data?.totalStandardFieldAssignments || 0);
      return getAssignmentDisplayText(assignmentCount, totalCount, intl);
    },
    [data, intl],
  );

  const handleActionSelect = useCallback(
    (action: unknown, node: HierarchicalNode) => {
      const { project, customer } = node.node.timeAgainst.timeAgainstContactDAS;
      const nodeId = project?.id || customer?.id || '';
      // For customer: customerId is the same as nodeId
      // For project: customerId comes from parentId (the parent customer)
      const customerId = customer?.id || node.node.timeAgainst.parentId || '';

      if (action === ASSIGNMENT_ACTIONS.EDIT_CUSTOMER) {
        // Open contact drawer in edit mode
        // For customer: pass customer ID as both contactId and customerId
        // For project: pass project ID as contactId and parent customer ID as customerId
        if (onEditCustomer && nodeId) {
          onEditCustomer(nodeId, customerId);
        }
      } else if (action === ASSIGNMENT_ACTIONS.ASSIGN_TEAM_MEMBERS) {
        // Clear any previous errors before opening drawer
        onClearError?.();
        sandbox.logger.info('Assign team members', { nodeId });
        track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.ASSIGN_WORKERS_LINK);
        // Open worker assignment integration - pass whole node
        onSetActiveWorkerAssignment?.(node);
      } else if (action === ASSIGNMENT_ACTIONS.ASSIGN_FIELDS) {
        // Clear any previous errors before opening drawer
        onClearError?.();
        sandbox.logger.info('Assignment. type=cusomter_to_field, Obj=', {
          nodeId,
        });
        track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.ASSIGN_FIELDS_EDIT_LINK);
        // Open field assignment integration - pass whole node
        onSetActiveFieldAssignment?.(node);
      } else if (action === ASSIGNMENT_ACTIONS.ASSIGN_GEOFENCE) {
        const geofenceConfig = geofenceConfigMap[nodeId];
        track(GEOFENCE_TRACKING_POINTS.ASSIGN_GEOFENCE_LOCATION);
        preDrawerGeofenceRef.current =
          geofenceOverrides[nodeId] ??
          (geofenceConfig?.geofenceEnabled || false);
        setGeofenceDrawer(node);
      }
    },
    [
      sandbox,
      track,
      onClearError,
      onSetActiveFieldAssignment,
      onSetActiveWorkerAssignment,
      onEditCustomer,
      geofenceOverrides,
      geofenceConfigMap,
    ],
  );

  const handleGeofenceSave = useCallback(
    (geofenceOn: boolean) => {
      if (geofenceDrawer) {
        const { project, customer } =
          geofenceDrawer.node.timeAgainst.timeAgainstContactDAS;
        const nodeId = project?.id || customer?.id || '';
        dispatch(setGeofenceOverride({ entityId: nodeId, value: geofenceOn }));
      }
      onClearError?.();
      setGeofenceDrawer(null);
      refreshGeofenceConfiguration();
    },
    [geofenceDrawer, dispatch, onClearError, refreshGeofenceConfiguration],
  );

  const handleGeofenceCancel = useCallback(() => {
    if (geofenceDrawer) {
      const { project, customer } =
        geofenceDrawer.node.timeAgainst.timeAgainstContactDAS;
      const nodeId = project?.id || customer?.id || '';
      dispatch(
        setGeofenceOverride({
          entityId: nodeId,
          value: preDrawerGeofenceRef.current,
        }),
      );
    }
    setGeofenceDrawer(null);
  }, [geofenceDrawer, dispatch]);

  // Close the drawer if config has finished loading but the node is absent from the API response
  useEffect(() => {
    if (!geofenceDrawer || geofenceConfigLoading) return;
    const { project, customer } =
      geofenceDrawer.node.timeAgainst.timeAgainstContactDAS;
    const drawerNodeId = project?.id || customer?.id || '';
    if (drawerNodeId && !geofenceConfigMap[drawerNodeId]) {
      handleGeofenceCancel();
    }
  }, [
    geofenceDrawer,
    geofenceConfigLoading,
    geofenceConfigMap,
    handleGeofenceCancel,
  ]);

  // Surface geofence configuration API errors to the user
  useEffect(() => {
    if (geofenceConfigError) {
      onError?.({
        title: 'Failed to load geofence configuration',
        description: geofenceConfigError,
      });
    }
  }, [geofenceConfigError, onError]);

  const renderNode = useCallback(
    (node: HierarchicalNode): React.ReactNode[] => {
      const { project, customer } = node.node.timeAgainst.timeAgainstContactDAS;
      const nodeId = project?.id || customer?.id || '';
      const displayName =
        node.node.timeAgainst.displayName ||
        node.node.timeAgainst.fullName ||
        '';
      const hasChildren = Boolean(node.children && node.children.length > 0);
      const isExpanded = expandedNodes.has(nodeId);
      const teamMemberSummary = getTeamMemberSummary(node);
      const fieldSummary = getFieldSummary(node);

      const rows: React.ReactNode[] = [];
      const indentLevel = node.level;

      const geofenceConfig = geofenceConfigMap[nodeId];
      const geofenceEnabled =
        geofenceOverrides[nodeId] ?? (geofenceConfig?.geofenceEnabled || false);
      const customerAddress = geofenceConfig?.customerAddress || '';

      const cellContent = (
        <>
          <ExpandableCell
            $hasChildren={hasChildren}
            onClick={hasChildren ? () => toggleExpansion(nodeId) : undefined}
            style={{ paddingLeft: `${indentLevel * 24 + 16}px` }}
          >
            <div>
              {node.level === 0 ? (
                <CustomerName as="strong">
                  {displayName}
                  {/* {hasChildren && node.children && ` (${node.children.length})`} */}
                </CustomerName>
              ) : (
                <CustomerName>
                  {displayName}
                  {/* {hasChildren && node.children && ` (${node.children.length})`} */}
                </CustomerName>
              )}
              {hasChildren && (
                <IconControl
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    toggleExpansion(nodeId);
                  }}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  size="small"
                  style={{ backgroundColor: 'transparent' }}
                >
                  {isExpanded ? <ChevronUp /> : <ChevronDown />}
                </IconControl>
              )}
            </div>
          </ExpandableCell>
          <Table.Cell data-testid={`team-members-${nodeId}`}>
            {teamMemberSummary.text}
          </Table.Cell>
          <Table.Cell data-testid={`time-tracking-fields-${nodeId}`}>
            {fieldSummary.text}
          </Table.Cell>
          {isGeofenceEnabled && (
            <>
              <Table.Cell data-testid={`geofence-toggle-${nodeId}`}>
                {geofenceConfigLoading || togglingNodeIds.has(nodeId) ? (
                  <Activity shape="dots" size="small" />
                ) : (
                  <Switch
                    checked={geofenceEnabled}
                    onChange={() => {
                      if (geofenceEnabled) {
                        track(GEOFENCE_TRACKING_POINTS.TURN_OFF_GEOFENCE);
                        const geofenceConfig = geofenceConfigMap[nodeId];
                        const timeAgainst = {
                          customerId: customer?.id ?? '',
                          ...(project?.id ? { projectId: project.id } : {}),
                        };
                        handleInlineGeofenceToggle(
                          nodeId,
                          geofenceConfig?.geofenceEnabledVersion ?? null,
                          timeAgainst,
                        );
                      } else {
                        track(GEOFENCE_TRACKING_POINTS.TURN_ON_GEOFENCE);
                        preDrawerGeofenceRef.current = false;
                        dispatch(
                          setGeofenceOverride({
                            entityId: nodeId,
                            value: true,
                          }),
                        );
                        setGeofenceDrawer(node);
                      }
                    }}
                    aria-label={`Geofence for ${displayName}`}
                  />
                )}
              </Table.Cell>
              <Table.Cell data-testid={`geofence-address-${nodeId}`}>
                {geofenceConfigLoading ? (
                  <Activity shape="dots" size="small" />
                ) : (
                  <GeofenceAddress>
                    {customerAddress || text('assignments.status.none')}
                  </GeofenceAddress>
                )}
              </Table.Cell>
            </>
          )}
          <Table.Cell data-testid={`actions-${nodeId}`}>
            <ActionsContainer>
              <span>
                <ComboLink
                  label={text('assignments.actions.assignTeamMembers')}
                  size="mini"
                  onClick={() => {
                    handleActionSelect(
                      ASSIGNMENT_ACTIONS.ASSIGN_TEAM_MEMBERS,
                      node,
                    );
                  }}
                  onSelect={(event) => {
                    const value = (event.target as any)?.value;
                    if (value) {
                      handleActionSelect(value, node);
                    }
                  }}
                  data-testid={`action-combo-link-${nodeId}`}
                >
                  {[
                    <MenuItem
                      key="fields"
                      value={ASSIGNMENT_ACTIONS.ASSIGN_FIELDS}
                    >
                      {text('assignments.actions.assignFields')}
                    </MenuItem>,
                    ...(isGeofenceEnabled
                      ? [
                          <MenuItem
                            key="geofence"
                            value={ASSIGNMENT_ACTIONS.ASSIGN_GEOFENCE}
                            disabled={geofenceConfigLoading}
                          >
                            {geofenceEnabled
                              ? text('assignments.actions.editGeofence')
                              : text('assignments.actions.assignGeofence')}
                          </MenuItem>,
                        ]
                      : []),
                    <MenuItem
                      key="edit"
                      value={ASSIGNMENT_ACTIONS.EDIT_CUSTOMER}
                    >
                      {text('assignments.actions.edit')}
                    </MenuItem>,
                  ]}
                </ComboLink>
              </span>
            </ActionsContainer>
          </Table.Cell>
        </>
      );

      // Render row
      rows.push(<Table.Row key={nodeId}>{cellContent}</Table.Row>);

      // Recursively render children if expanded
      if (isExpanded && hasChildren && node.children) {
        node.children.forEach((child) => {
          rows.push(...renderNode(child));
        });
      }

      return rows;
    },
    [
      expandedNodes,
      toggleExpansion,
      text,
      handleActionSelect,
      getTeamMemberSummary,
      getFieldSummary,
      isGeofenceEnabled,
      geofenceOverrides,
      geofenceConfigMap,
      geofenceConfigLoading,
      togglingNodeIds,
      handleInlineGeofenceToggle,
      dispatch,
    ],
  );

  const tableRows = useMemo(
    () => filteredHierarchicalData.flatMap((node) => renderNode(node)),
    [filteredHierarchicalData, renderNode],
  );

  const totalCustomerCount = data?.totalTimeAgainstCount || 0;

  if (error) {
    return (
      <CenteredErrorContainer>
        <PageMessage
          type="warn"
          open
          automationId="CustomerAssignmentErrorPageMessage"
          title={`${text('assignments.error.title')}: ${text(
            'assignments.error.message',
          )}`}
        />
      </CenteredErrorContainer>
    );
  }

  return (
    <>
      <HeaderTable
        divider="horizontal"
        responsive="elevate"
        hover="row"
        summary="Customer assignment table"
        density="roomy"
        $showGeofence={isGeofenceEnabled}
      >
        <Table.Header>
          <Table.Row>
            <Table.Cell>
              {text('assignments.table.header.customers', {
                count: totalCustomerCount,
              })}
            </Table.Cell>
            <Table.Cell>
              {text('assignments.table.header.teamMembers')}
            </Table.Cell>
            <Table.Cell>
              {text('assignments.table.header.timeTrackingFields')}
            </Table.Cell>
            {isGeofenceEnabled && (
              <>
                <Table.Cell>
                  {text('assignments.table.header.geofence')}
                </Table.Cell>
                <Table.Cell>
                  {text('assignments.table.header.geofenceAddress')}
                </Table.Cell>
              </>
            )}
            <Table.Cell>{text('assignments.table.header.actions')}</Table.Cell>
          </Table.Row>
        </Table.Header>
        <Table.Body>{tableRows}</Table.Body>
      </HeaderTable>

      {/* Geofence Drawer */}
      {geofenceDrawer &&
        (() => {
          const { project, customer } =
            geofenceDrawer.node.timeAgainst.timeAgainstContactDAS;
          const drawerNodeId = project?.id || customer?.id || '';
          const geofenceInfo = geofenceConfigMap[drawerNodeId];
          if (!geofenceInfo) {
            const { project: drawerProject, customer: drawerCustomer } =
              geofenceDrawer.node.timeAgainst.timeAgainstContactDAS;
            return geofenceConfigLoading ? (
              <GeofenceDrawer
                key={drawerNodeId}
                open
                entityId={drawerNodeId}
                timeAgainst={{
                  customerId: drawerCustomer?.id ?? '',
                  ...(drawerProject?.id ? { projectId: drawerProject.id } : {}),
                }}
                onSave={handleGeofenceSave}
                onClose={handleGeofenceCancel}
                onShowSuccess={onShowSuccess}
              />
            ) : null;
          }
          return (
            <GeofenceDrawer
              key={drawerNodeId}
              open
              entityId={drawerNodeId}
              timeAgainst={{
                customerId: customer?.id ?? '',
                ...(project?.id ? { projectId: project.id } : {}),
              }}
              geofenceInfo={geofenceInfo}
              initialGeofenceOn={geofenceOverrides[drawerNodeId]}
              onSave={handleGeofenceSave}
              onClose={handleGeofenceCancel}
              onShowSuccess={onShowSuccess}
            />
          );
        })()}

      {/* Field Assignment Integration */}
      {activeFieldAssignment && (
        <FieldAssignmentIntegration
          node={activeFieldAssignment}
          allEdges={data?.edges}
          onClose={() => onSetActiveFieldAssignment?.(null)}
          onSuccess={() => {
            // This callback is for pure errors only - do nothing here
            // Success/partial success handled by onShowSuccess/onError
          }}
          onError={(errorInfo) => {
            // Pass error to parent - parent will close drawer synchronously
            onError?.(errorInfo);
          }}
          onShowSuccess={(message) => {
            // Pass success message to parent - parent will close drawer synchronously
            onShowSuccess?.(message);
          }}
        />
      )}

      {/* Worker Assignment Integration */}
      {activeWorkerAssignment && (
        <WorkerAssignmentIntegration
          node={activeWorkerAssignment}
          allEdges={data?.edges}
          customerId={
            activeWorkerAssignment.node.timeAgainst.timeAgainstContactDAS
              .customer?.id ||
            activeWorkerAssignment.node.timeAgainst.parentId ||
            ''
          }
          projectId={
            activeWorkerAssignment.node.timeAgainst.timeAgainstContactDAS
              .project?.id
          }
          displayName={
            activeWorkerAssignment.node.timeAgainst.displayName || ''
          }
          onClose={() => onSetActiveWorkerAssignment?.(null)}
          onError={onError}
          onShowSuccess={onShowSuccess}
        />
      )}
    </>
  );
};

export default CustomerAssignmentTable;
