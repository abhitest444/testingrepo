import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Drawer } from '@ids-ts/drawer';
import Button from '@ids-ts/button';
import { Activity } from '@ids-ts/loader';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { useAssignGroupMembers } from 'src/js/service/hooks/groups/useAssignGroupMembers';
import { useRemoveGroupMembers } from 'src/js/service/hooks/groups/useRemoveGroupMembers';
import { useAssignGroupManagers } from 'src/js/service/hooks/groups/useAssignGroupManagers';
import { useRemoveGroupManagers } from 'src/js/service/hooks/groups/useRemoveGroupManagers';
import {
  buildGroupErrorResult,
  hasUnsavedChangesInWorkersOrLeadsSelections,
} from 'src/js/widgets/assignments/utils/helpers';
import {
  buildSelectedWorkers,
  handleSaveOperation,
} from 'src/js/widgets/assignments/utils/groupSaveHelpers';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';
import { useNttfEligibility } from 'src/js/service/hooks/nttf/useNttfEligibility';
import {
  SAVE_MEMBERS_CONFIG,
  SAVE_MANAGERS_CONFIG,
} from '../../utils/constants';
import { useGroupNameUpdate } from './hooks/useGroupNameUpdate';
import {
  selectDrawerContext,
  selectManagerCount,
  selectMemberCount,
  selectInitialMembers,
  selectInitialLeads,
  setDrawerContext,
  clearDrawerWorkers,
  clearDrawerData,
  resetDrawerState,
  selectDrawerWorkersById,
  selectDrawerWorkersAllIds,
  updateGroupCounts,
  updateCurrentGroupName,
  setDrawerError,
  clearDrawerError,
  selectUnsavedChangesModal,
  openUnsavedChangesModal,
  closeUnsavedChangesModal,
} from '../../store/workersGroupViewSlice';
import {
  StyledDrawerHeader,
  StyledDrawerFooter,
  StyledDrawerContent,
  FooterButtonsContainer,
  ModalMessage,
} from '../../styles/Groups/GroupDrawer.styled';
import { CenteredContainer } from '../styles/WorkersTableByGroupsView.styled';
import {
  GroupDrawerView,
  GroupDrawerContext,
  ErrorSource,
  EditGroupDrawerProps,
} from '../../types/Groups/GroupDrawer.types';
import { GroupDetailsContent } from './GroupDetailsContent';
import { WorkerAssignmentController } from './WorkerAssignmentController';
import { ManagerAssignmentController } from './ManagerAssignmentController';
import { GROUP_MODALS_TRACKING_POINTS } from '../../utils/groupsTrackingPoints';

export const EditGroupDrawer: React.FC<EditGroupDrawerProps> = ({
  open,
  onClose,
  onSuccess,
  initialGroupName,
  groupId,
  groupVersion,
  initialView = GroupDrawerView.Details,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const dispatch = useDispatch();
  const track = useTracking();

  const managerCount = useSelector(selectManagerCount);
  const memberCount = useSelector(selectMemberCount);
  const { isNttfEligible, loading: nttfLoading } = useNttfEligibility();
  const shouldShowGroupLeads = !isNttfEligible; // Show leads when NOT NTTF eligible

  const handleError = useCallback(
    (error: string, errorCode?: string, source?: ErrorSource) => {
      sandbox.logger.error(
        'Component="EditGroupDrawer" Event="Error during group operation"',
        {
          error,
          errorCode,
          source,
        },
      );

      const { errorTitle, errorMessage } = buildGroupErrorResult(
        error,
        errorCode,
        source,
        intl,
        GroupDrawerContext.EditGroup,
      );

      // Set error in Redux for display in WorkerSelectionContent
      dispatch(
        setDrawerError({
          errorTitle: errorTitle || null,
          errorMessage: errorMessage || null,
        }),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [assignMembers, { loading: assigningMembers }] = useAssignGroupMembers({
    onSuccess: (result) => {
      sandbox.logger.info(
        'Component="EditGroupDrawer" Event="Members assigned successfully"',
        {
          assignedCount: result.assignedCount,
          failedCount: result.failedCount,
        },
      );
    },
    onError: (error, errorCode) => {
      handleError(error, errorCode, ErrorSource.AssignMembers);
    },
  });

  const [removeMembers, { loading: removingMembers }] = useRemoveGroupMembers({
    onSuccess: (result) => {
      sandbox.logger.info(
        'Component="EditGroupDrawer" Event="Members removed successfully"',
        {
          removedCount: result.removedCount,
          failedCount: result.failedCount,
        },
      );
    },
    onError: (error, errorCode) => {
      handleError(error, errorCode, ErrorSource.RemoveMembers);
    },
  });

  const [assignManagers, { loading: assigningManagers }] =
    useAssignGroupManagers({
      onSuccess: (result) => {
        sandbox.logger.info(
          'Component="EditGroupDrawer" Event="Managers assigned successfully"',
          {
            assignedCount: result.assignedCount,
            failedCount: result.failedCount,
          },
        );
      },
      onError: (error, errorCode) => {
        handleError(error, errorCode, ErrorSource.AssignManagers);
      },
    });

  const [removeManagers, { loading: removingManagers }] =
    useRemoveGroupManagers({
      onSuccess: (result) => {
        sandbox.logger.info(
          'Component="EditGroupDrawer" Event="Managers removed successfully"',
          {
            removedCount: result.removedCount,
            failedCount: result.failedCount,
          },
        );
      },
      onError: (error, errorCode) => {
        handleError(error, errorCode, ErrorSource.RemoveManagers);
      },
    });

  // State declarations (must be before they're used in callbacks)
  const [currentView, setCurrentView] = useState<GroupDrawerView>(initialView);
  const [groupName, setGroupName] = useState('');
  const [pendingNavigation, setPendingNavigation] =
    useState<GroupDrawerView | null>(null);

  // Custom onSuccess handler that handles navigation after successful save
  const handleSuccessAfterSave = useCallback(
    (message: string) => {
      // Update Redux state with the new group name (save was successful)
      dispatch(updateCurrentGroupName(groupName));

      // Check if we have a pending navigation (save-and-navigate flow)
      if (pendingNavigation) {
        // Navigate to the pending view
        dispatch(clearDrawerWorkers());
        setCurrentView(pendingNavigation);
        setPendingNavigation(null);

        // Show success message
        onSuccess(message);
      } else {
        // Normal success flow - show message and close drawer
        onSuccess(message);
      }
    },
    [pendingNavigation, dispatch, onSuccess, groupName],
  );

  // Custom onClose handler that prevents closing when we're saving and navigating
  const handleOnCloseAfterSave = useCallback(() => {
    // If we're in the middle of save-and-navigate flow, don't close the drawer
    if (pendingNavigation) {
      return;
    }
    // Otherwise, proceed with normal close
    onClose();
  }, [pendingNavigation, onClose]);

  // Hook for group name updates
  const { updatingGroup, handleSaveGroupName } = useGroupNameUpdate({
    groupId,
    initialGroupName,
    onSuccess: handleSuccessAfterSave,
    onError: handleError,
    onClose: handleOnCloseAfterSave,
  });

  const isSaving =
    assigningMembers ||
    removingMembers ||
    assigningManagers ||
    removingManagers ||
    updatingGroup;

  const unsavedChangesModal = useSelector(selectUnsavedChangesModal);

  const drawerWorkersById = useSelector(selectDrawerWorkersById);
  const drawerWorkersAllIds = useSelector(selectDrawerWorkersAllIds);
  const drawerContext = useSelector(selectDrawerContext);
  const initialMembers = useSelector(selectInitialMembers);
  const initialLeads = useSelector(selectInitialLeads);

  // Use counts from Redux for Details view (pre-populated from group stats)
  // These will be correct even before navigating to Assign Workers/Leads views
  const selectedWorkersCount = memberCount || 0;
  const selectedLeadsCount = managerCount || 0;

  // Initialize drawer state when opened
  useEffect(() => {
    if (!open || !groupId) return;

    // Set drawer context for controllers
    dispatch(
      setDrawerContext({
        groupId,
        groupName: initialGroupName,
        context: drawerContext || GroupDrawerContext.EditGroup,
        initialMembers: {},
        initialLeads: {},
        memberCount: memberCount || 0,
        managerCount: managerCount || 0,
      }),
    );

    // Set local state
    setGroupName(initialGroupName);
    setCurrentView(initialView);

    // Clear any previous errors when drawer opens
    dispatch(clearDrawerError());
  }, [
    open,
    groupId,
    initialGroupName,
    initialView,
    memberCount,
    managerCount,
    drawerContext,
    dispatch,
  ]);

  useEffect(() => {
    if (!open) {
      setCurrentView(initialView);
      setGroupName('');
      setPendingNavigation(null);
      dispatch(clearDrawerError());
      dispatch(resetDrawerState());
    }
  }, [open, initialView, dispatch]);

  // Track modal view changes
  useEffect(() => {
    if (open && currentView === GroupDrawerView.AssignWorkers) {
      sandbox.logger.info(
        'Component="EditGroupDrawer" Event="Assign workers modal viewed"',
      );
      track(GROUP_MODALS_TRACKING_POINTS.VIEW_WORKER_MODAL);
    } else if (open && currentView === GroupDrawerView.AssignLeads) {
      sandbox.logger.info(
        'Component="EditGroupDrawer" Event="Assign leads modal viewed"',
      );
      track(GROUP_MODALS_TRACKING_POINTS.VIEW_LEAD_MODAL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentView]);

  // Helper to check if group name has unsaved changes (only for EditGroup context)
  const hasUnsavedGroupNameChanges = useMemo(
    () =>
      drawerContext === GroupDrawerContext.EditGroup &&
      currentView === GroupDrawerView.Details &&
      initialGroupName.trim() !== groupName.trim(),
    [drawerContext, currentView, initialGroupName, groupName],
  );

  const handleAssignWorkers = useCallback(() => {
    // Check for unsaved group name changes before navigating
    if (hasUnsavedGroupNameChanges) {
      setPendingNavigation(GroupDrawerView.AssignWorkers);
      dispatch(openUnsavedChangesModal());
      return;
    }

    // Clear all drawer data to force fresh data load with updated group memberships
    dispatch(clearDrawerData());
    setCurrentView(GroupDrawerView.AssignWorkers);
  }, [dispatch, hasUnsavedGroupNameChanges]);

  const handleAssignLeads = useCallback(() => {
    if (!shouldShowGroupLeads) return;

    // Check for unsaved group name changes before navigating
    if (hasUnsavedGroupNameChanges) {
      setPendingNavigation(GroupDrawerView.AssignLeads);
      dispatch(openUnsavedChangesModal());
      return;
    }

    // Clear all drawer data to force fresh data load with updated group memberships
    dispatch(clearDrawerData());
    setCurrentView(GroupDrawerView.AssignLeads);
  }, [dispatch, hasUnsavedGroupNameChanges, shouldShowGroupLeads]);

  const handleBackToDetails = useCallback(() => {
    setCurrentView(GroupDrawerView.Details);
  }, []);

  const handleSaveWorkers = useCallback(async () => {
    // Clear any errors on before initiating the save operation
    dispatch(clearDrawerError());
    // Track save worker action
    sandbox.logger.info(
      'Component="EditGroupDrawer" Event="Save assign workers clicked"',
    );
    track(GROUP_MODALS_TRACKING_POINTS.SAVE_WORKER);
    const currentSelected = buildSelectedWorkers(drawerWorkersById);

    const result = await handleSaveOperation(SAVE_MEMBERS_CONFIG, {
      currentSelected,
      initialSelected: initialMembers,
      groupId,
      groupName: initialGroupName,
      assignMutation: assignMembers,
      removeMutation: removeMembers,
      handleError,
      intl,
      logger: sandbox.logger,
      sandbox,
    });

    if (!result.success) {
      // Partial success - errors displayed in the drawer
      sandbox.logger.warn(
        'Component="EditGroupDrawer" Event="Partial success - keeping user on current view to see error"',
        {
          currentView,
          failureHandled: true,
        },
      );
      return;
    }

    if (result.counts?.memberCount !== undefined) {
      dispatch(updateGroupCounts(result.counts));
    }

    // Capture drawerContext before any state changes
    const currentDrawerContext = drawerContext;

    // Show success toast (handleQuickActionSuccess will check context before closing)
    if (result.successMessage) {
      onSuccess(result.successMessage);
    }

    // Navigate based on context
    if (currentDrawerContext === GroupDrawerContext.QuickAction) {
      // QuickAction: Close drawer and reset state (handleQuickActionSuccess already closed it)
      dispatch(resetDrawerState());
      onClose();
    } else {
      // Edit Group: Navigate back to Details view
      // Clear all drawer data to ensure fresh data on next view switch
      dispatch(clearDrawerData());
      handleBackToDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    drawerWorkersById,
    initialMembers,
    groupId,
    assignMembers,
    removeMembers,
    dispatch,
    drawerContext,
    onClose,
    handleBackToDetails,
    initialGroupName,
    onSuccess,
    handleError,
  ]);

  const handleSaveLeads = useCallback(async () => {
    // Clear any errors on before initiating the save operation
    dispatch(clearDrawerError());
    // Track save lead action
    sandbox.logger.info(
      'Component="EditGroupDrawer" Event="Save assign leads clicked"',
    );
    track(GROUP_MODALS_TRACKING_POINTS.SAVE_LEAD);
    const currentSelected = buildSelectedWorkers(drawerWorkersById);

    const result = await handleSaveOperation(SAVE_MANAGERS_CONFIG, {
      currentSelected,
      initialSelected: initialLeads,
      groupId,
      groupName: initialGroupName,
      assignMutation: assignManagers,
      removeMutation: removeManagers,
      handleError,
      intl,
      logger: sandbox.logger,
      sandbox,
    });

    if (!result.success) {
      // Partial success - errors displayed in the drawer
      sandbox.logger.warn(
        'Component="EditGroupDrawer" Event="Partial success - keeping user on current view to see error"',
        {
          currentView,
          failureHandled: true,
        },
      );
      return;
    }

    if (result.counts?.managerCount !== undefined) {
      dispatch(updateGroupCounts(result.counts));
    }

    // Capture drawerContext before any state changes
    const currentDrawerContext = drawerContext;

    // Show success toast (handleQuickActionSuccess will check context before closing)
    if (result.successMessage) {
      onSuccess(result.successMessage);
    }

    // Navigate based on context
    if (currentDrawerContext === GroupDrawerContext.QuickAction) {
      // QuickAction: Close drawer and reset state (handleQuickActionSuccess already closed it)
      dispatch(resetDrawerState());
      onClose();
    } else {
      // Edit Group: Navigate back to Details view
      // Clear all drawer data to ensure fresh data on next view switch
      dispatch(clearDrawerData());
      handleBackToDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    drawerWorkersById,
    initialLeads,
    groupId,
    assignManagers,
    removeManagers,
    dispatch,
    drawerContext,
    onClose,
    handleBackToDetails,
    initialGroupName,
    onSuccess,
    handleError,
  ]);

  const getTitle = () => {
    switch (currentView) {
      case GroupDrawerView.AssignWorkers:
        return intl.formatMessage({
          id: 'groups.drawer.title.assign_workers',
          defaultMessage: 'Assign workers',
        });
      case GroupDrawerView.AssignLeads:
        return intl.formatMessage({
          id: 'groups.drawer.title.assign_leads',
          defaultMessage: 'Assign group lead',
        });
      case GroupDrawerView.Details:
      default:
        return intl.formatMessage({
          id: 'groups.drawer.title.edit',
          defaultMessage: 'Edit group name',
        });
    }
  };

  // Check for unsaved changes based on context and view
  const checkUnsavedChanges = useCallback((): boolean => {
    // For EditGroup context in Details view, only check group name changes
    if (
      drawerContext === GroupDrawerContext.EditGroup &&
      currentView === GroupDrawerView.Details
    ) {
      return initialGroupName.trim() !== groupName.trim();
    }

    // Get current selections for change detection
    const currentSelections = buildSelectedWorkers(drawerWorkersById);

    // For AssignWorkers or AssignLeads views (both EditGroup and QuickAction contexts),
    // check for changes in selections based on current view
    if (currentView === GroupDrawerView.AssignWorkers) {
      return hasUnsavedChangesInWorkersOrLeadsSelections(
        initialMembers,
        currentSelections,
      );
    }
    if (currentView === GroupDrawerView.AssignLeads) {
      return hasUnsavedChangesInWorkersOrLeadsSelections(
        initialLeads,
        currentSelections,
      );
    }

    // Default: no changes detected
    return false;
  }, [
    drawerContext,
    currentView,
    initialGroupName,
    groupName,
    initialMembers,
    initialLeads,
    drawerWorkersById,
  ]);

  // Internal close handler (actual close logic)
  const handleDrawerClose = useCallback(() => {
    // Track close modal action when on AssignWorkers or AssignLeads view
    if (currentView === GroupDrawerView.AssignWorkers) {
      sandbox.logger.info(
        'Component="EditGroupDrawer" Event="Close assign workers modal clicked"',
      );
      track(GROUP_MODALS_TRACKING_POINTS.CLOSE_WORKER_MODAL);
    } else if (currentView === GroupDrawerView.AssignLeads) {
      sandbox.logger.info(
        'Component="EditGroupDrawer" Event="Close assign leads modal clicked"',
      );
      track(GROUP_MODALS_TRACKING_POINTS.CLOSE_LEAD_MODAL);
    }

    if (drawerContext === GroupDrawerContext.QuickAction) {
      onClose();
    } else if (currentView !== GroupDrawerView.Details) {
      handleBackToDetails();
    } else {
      onClose();
    }
  }, [
    currentView,
    drawerContext,
    handleBackToDetails,
    onClose,
    sandbox,
    track,
  ]);

  // Intercept close attempts
  const handleAttemptClose = useCallback(() => {
    if (checkUnsavedChanges()) {
      dispatch(openUnsavedChangesModal());
    } else {
      handleDrawerClose();
    }
  }, [checkUnsavedChanges, dispatch, handleDrawerClose]);

  // Handler for "Don't Save"
  const handleDontSave = useCallback(() => {
    dispatch(closeUnsavedChangesModal());

    // If there's a pending navigation (from Details view with unsaved group name changes)
    if (pendingNavigation) {
      // Discard group name changes by reverting to initial value
      setGroupName(initialGroupName);

      // Navigate to the pending view
      dispatch(clearDrawerWorkers());
      setCurrentView(pendingNavigation);
      setPendingNavigation(null);
    } else {
      // Normal close behavior
      handleDrawerClose();
    }
  }, [dispatch, handleDrawerClose, pendingNavigation, initialGroupName]);

  // Handler for "Save" from modal
  const handleSaveFromModal = useCallback(() => {
    dispatch(closeUnsavedChangesModal());

    // If there's a pending navigation (from Details view with unsaved group name changes)
    // or if we're in Details view, save the group name
    // (navigation will happen in handleSuccessAfterSave if pendingNavigation is set)
    if (pendingNavigation || currentView === GroupDrawerView.Details) {
      handleSaveGroupName(groupName);
    } else if (currentView === GroupDrawerView.AssignWorkers) {
      handleSaveWorkers();
    } else if (currentView === GroupDrawerView.AssignLeads) {
      handleSaveLeads();
    }
  }, [
    currentView,
    groupName,
    handleSaveGroupName,
    handleSaveWorkers,
    handleSaveLeads,
    dispatch,
    pendingNavigation,
  ]);

  // Check if there are changes to save (for disabling Save button)
  const hasChanges = checkUnsavedChanges();

  return (
    <Drawer
      open={open}
      onClose={handleAttemptClose}
      size="large"
      autoFocus
      restoreFocus
      data-testid="edit-group-drawer"
    >
      <StyledDrawerHeader
        title={getTitle()}
        onClose={handleAttemptClose}
        showBoxShadow={currentView === GroupDrawerView.Details}
      />

      <StyledDrawerContent>
        {nttfLoading ? (
          <CenteredContainer>
            <Activity shape="dots" size="large" />
          </CenteredContainer>
        ) : (
          <>
            {currentView === GroupDrawerView.Details && (
              <GroupDetailsContent
                groupName={groupName}
                onGroupNameChange={(value) => {
                  setGroupName(value);
                  dispatch(clearDrawerError());
                }}
                onClearError={() => {
                  dispatch(clearDrawerError());
                }}
                onAssignWorkers={handleAssignWorkers}
                onAssignLeads={handleAssignLeads}
                onKeyDown={() => {}}
                selectedWorkersCount={selectedWorkersCount}
                selectedLeadsCount={selectedLeadsCount}
                loading={false}
                shouldShowGroupLeads={shouldShowGroupLeads}
              />
            )}

            {currentView === GroupDrawerView.AssignWorkers && (
              <WorkerAssignmentController
                groupId={groupId}
                groupName={groupName}
                mode="edit"
                context={drawerContext || GroupDrawerContext.EditGroup}
                memberCount={memberCount}
                open={open}
                currentView={currentView}
              />
            )}

            {shouldShowGroupLeads &&
              currentView === GroupDrawerView.AssignLeads && (
                <ManagerAssignmentController
                  groupId={groupId}
                  groupName={groupName}
                  mode="edit"
                  context={drawerContext || GroupDrawerContext.EditGroup}
                  managerCount={managerCount}
                  open={open}
                  currentView={currentView}
                />
              )}
          </>
        )}
      </StyledDrawerContent>

      <>
        {!nttfLoading && currentView === GroupDrawerView.Details && (
          <StyledDrawerFooter>
            <FooterButtonsContainer>
              <Button
                onClick={onClose}
                priority="secondary"
                data-testid="edit-group-drawer-cancel-btn"
                disabled={isSaving}
              >
                {intl.formatMessage({
                  id: 'groups.drawer.button.cancel',
                  defaultMessage: 'Cancel',
                })}
              </Button>
              <Button
                onClick={() => handleSaveGroupName(groupName)}
                priority="primary"
                disabled={isSaving || !hasChanges}
                isLoading={updatingGroup}
                loadingComponent={<Activity shape="dots" size="small" />}
                data-testid="edit-group-drawer-save-btn"
              >
                {intl.formatMessage({
                  id: 'groups.drawer.button.save',
                  defaultMessage: 'Save',
                })}
              </Button>
            </FooterButtonsContainer>
          </StyledDrawerFooter>
        )}

        {currentView === GroupDrawerView.AssignWorkers && (
          <StyledDrawerFooter>
            <FooterButtonsContainer>
              <Button
                onClick={handleSaveWorkers}
                priority="primary"
                disabled={isSaving || !hasChanges}
                isLoading={isSaving}
                loadingComponent={<Activity shape="dots" size="small" />}
                data-testid="save-workers-btn"
              >
                {intl.formatMessage({
                  id: 'groups.assign_workers.save',
                  defaultMessage: 'Save',
                })}
              </Button>
            </FooterButtonsContainer>
          </StyledDrawerFooter>
        )}

        {shouldShowGroupLeads &&
          currentView === GroupDrawerView.AssignLeads && (
            <StyledDrawerFooter>
              <FooterButtonsContainer>
                <Button
                  onClick={handleSaveLeads}
                  priority="primary"
                  disabled={isSaving || !hasChanges}
                  isLoading={isSaving}
                  loadingComponent={<Activity shape="dots" size="small" />}
                  data-testid="save-leads-btn"
                >
                  {intl.formatMessage({
                    id: 'groups.assign_leads.save',
                    defaultMessage: 'Save',
                  })}
                </Button>
              </FooterButtonsContainer>
            </StyledDrawerFooter>
          )}
      </>
      <ConfirmationModal
        open={unsavedChangesModal.open}
        setOpen={(open) => {
          if (!open) {
            // Handler for "X button" (Close modal, keep drawer open)
            dispatch(closeUnsavedChangesModal());
            setPendingNavigation(null);
          }
        }}
        title={intl.formatMessage({
          id: 'groups.unsaved_changes.title',
          defaultMessage: 'Want to save your changes?',
        })}
        size="small"
        isLoading={isSaving}
        onYesClick={handleSaveFromModal}
        onNoClick={handleDontSave}
        yesButtonLabel={intl.formatMessage({
          id: 'groups.unsaved_changes.save',
          defaultMessage: 'Save',
        })}
        noButtonLabel={intl.formatMessage({
          id: 'groups.unsaved_changes.dont_save',
          defaultMessage: "Don't save",
        })}
        dismissible={!isSaving}
        headerAlignment="center"
        contentAlignment="center"
        actionAlignment="center"
        showSectionDivider={false}
      >
        <ModalMessage>
          {intl.formatMessage({
            id: 'groups.unsaved_changes.message',
            defaultMessage:
              "You'll lose any changes you made if you don't save them.",
          })}
        </ModalMessage>
      </ConfirmationModal>
    </Drawer>
  );
};

export default EditGroupDrawer;
