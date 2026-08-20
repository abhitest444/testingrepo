import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Drawer } from '@ids-ts/drawer';
import Button from '@ids-ts/button';
import { Activity } from '@ids-ts/loader';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import {
  useGroupWithAssignments,
  CreateGroupWithAssignmentsResult,
} from 'src/js/service/hooks/groups';
import {
  validateGroupName,
  buildGroupCreationSuccessMessage,
  buildGroupErrorResult,
  hasUnsavedChangesInCreateMode,
  handleGroupCreationPartialSuccess,
} from 'src/js/widgets/assignments/utils/helpers';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';
import { useNttfEligibility } from 'src/js/service/hooks/nttf/useNttfEligibility';
import {
  CREATE_GROUP_TRACKING_POINTS,
  GROUP_MODALS_TRACKING_POINTS,
} from '../../utils/groupsTrackingPoints';
import {
  selectSelectedMembers,
  selectSelectedLeads,
  resetDrawerState,
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
  CreateGroupDrawerProps,
} from '../../types/Groups/GroupDrawer.types';
import { GroupDetailsContent } from './GroupDetailsContent';
import { WorkerAssignmentController } from './WorkerAssignmentController';
import { ManagerAssignmentController } from './ManagerAssignmentController';

export const CreateGroupDrawer: React.FC<CreateGroupDrawerProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const dispatch = useDispatch();
  const track = useTracking();
  const { isNttfEligible, loading: nttfLoading } = useNttfEligibility();
  const shouldShowGroupLeads = !isNttfEligible; // Show leads when NOT NTTF eligible

  const handleSuccess = useCallback(
    (result: CreateGroupWithAssignmentsResult) => {
      sandbox.logger.info(
        'Component="CreateGroupDrawer" Event="Group created with assignments"',
        {
          groupId: result.groupId,
          groupName: result.groupName,
          membersAssigned: result.memberAssignments?.membersAssigned,
          membersFailed: result.memberAssignments?.membersFailed,
          leadsAssigned: result.leadAssignments?.leadsAssigned,
          leadsFailed: result.leadAssignments?.leadsFailed,
        },
      );

      // Check for partial success
      const partialSuccessCheck = handleGroupCreationPartialSuccess(
        result,
        intl,
      );

      if (partialSuccessCheck.hasPartialSuccess) {
        // Log partial success with detailed breakdown
        let eventName: string;
        const scenario = partialSuccessCheck.logDetails?.scenario;

        if (scenario === 'both') {
          eventName = 'Partial success in both members and leads';
        } else if (scenario === 'members') {
          eventName = 'Partial success in members';
        } else {
          eventName = 'Partial success in leads';
        }

        sandbox.logger.warn(
          `Component="CreateGroupDrawer" Event="${eventName}"`,
          partialSuccessCheck.logDetails,
        );

        // Show error in drawer
        if (partialSuccessCheck.error) {
          dispatch(
            setDrawerError({
              errorTitle: partialSuccessCheck.error.errorTitle,
              errorMessage: partialSuccessCheck.error.errorMessage,
            }),
          );
        }

        // Don't close drawer - let user see the error and retry
        return;
      }

      // Full success - show success message and close drawer
      const successMessage = buildGroupCreationSuccessMessage(result, intl);
      onSuccess(successMessage);
      onClose();
    },
    [onSuccess, onClose, intl, sandbox, dispatch],
  );

  const handleError = useCallback(
    (error: string, errorCode?: string, source?: ErrorSource) => {
      sandbox.logger.error(
        'Component="CreateGroupDrawer" Event="Error during group creation"',
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
        GroupDrawerContext.CreateGroup,
      );

      dispatch(
        setDrawerError({
          errorTitle: errorTitle || null,
          errorMessage: errorMessage || null,
        }),
      );
    },
    [intl],
  );

  const { createGroupWithAssignments, loading } = useGroupWithAssignments({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const [currentView, setCurrentView] = useState<GroupDrawerView>(
    GroupDrawerView.Details,
  );
  const [groupName, setGroupName] = useState('');
  const [hasTrackedTyping, setHasTrackedTyping] = useState(false);

  const unsavedChangesModal = useSelector(selectUnsavedChangesModal);

  const selectedMembers = useSelector(selectSelectedMembers);
  const selectedLeads = useSelector(selectSelectedLeads);

  const selectedWorkersCount = Object.keys(selectedMembers).length;
  const selectedLeadsCount = Object.keys(selectedLeads).length;

  // Reset state when drawer opens or closes
  useEffect(() => {
    if (open) {
      setGroupName('');
      setCurrentView(GroupDrawerView.Details);
      setHasTrackedTyping(false);

      // Track drawer view
      sandbox.logger.info(
        'Component="CreateGroupDrawer" Event="Create group drawer viewed"',
      );
      track(CREATE_GROUP_TRACKING_POINTS.VIEW_CREATE_DRAWER);
    } else {
      setGroupName('');
      setCurrentView(GroupDrawerView.Details);
      dispatch(clearDrawerError());
      setHasTrackedTyping(false);
      dispatch(resetDrawerState());
    }
  }, [open, dispatch]);

  // Track modal view changes
  useEffect(() => {
    if (open && currentView === GroupDrawerView.AssignWorkers) {
      sandbox.logger.info(
        'Component="CreateGroupDrawer" Event="Assign workers modal viewed"',
      );
      track(GROUP_MODALS_TRACKING_POINTS.VIEW_WORKER_MODAL);
    } else if (open && currentView === GroupDrawerView.AssignLeads) {
      sandbox.logger.info(
        'Component="CreateGroupDrawer" Event="Assign leads modal viewed"',
      );
      track(GROUP_MODALS_TRACKING_POINTS.VIEW_LEAD_MODAL);
    }
  }, [open, currentView]);

  const handleCreate = useCallback(async () => {
    const validation = validateGroupName(groupName, intl);
    if (!validation.isValid) {
      dispatch(
        setDrawerError({ errorMessage: validation.errorMessage || null }),
      );
      return;
    }

    const membersArray = Object.values(selectedMembers);
    const leadsArray = Object.values(selectedLeads);

    // Track save group action
    sandbox.logger.info(
      'Component="CreateGroupDrawer" Event="Save group clicked"',
    );
    track(CREATE_GROUP_TRACKING_POINTS.SAVE_GROUP);

    sandbox.logger.info(
      'Component="CreateGroupDrawer" Event="Creating group with assignments"',
      {
        groupName: groupName.trim(),
        membersCount: membersArray.length,
        leadsCount: leadsArray.length,
      },
    );

    try {
      await createGroupWithAssignments({
        groupName: groupName.trim(),
        members: membersArray,
        leads: shouldShowGroupLeads ? leadsArray : [],
      });
    } catch (err) {
      sandbox.logger.error(
        'Component="CreateGroupDrawer" Event="Exception during mutation"',
        {
          err,
        },
      );
    }
  }, [
    groupName,
    selectedMembers,
    selectedLeads,
    intl,
    dispatch,
    track,
    createGroupWithAssignments,
  ]);

  const handleCancel = () => {
    // Track cancel action
    sandbox.logger.info(
      'Component="CreateGroupDrawer" Event="Cancel group clicked"',
    );
    track(CREATE_GROUP_TRACKING_POINTS.CANCEL_GROUP);

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleAssignWorkers = useCallback(() => {
    // Track assign workers click
    sandbox.logger.info(
      'Component="CreateGroupDrawer" Event="Assign workers clicked"',
    );
    track(CREATE_GROUP_TRACKING_POINTS.CLICK_ASSIGN_WORKERS);

    setCurrentView(GroupDrawerView.AssignWorkers);
  }, []);

  const handleAssignLeads = useCallback(() => {
    if (!shouldShowGroupLeads) return;

    // Track assign leads click
    sandbox.logger.info(
      'Component="CreateGroupDrawer" Event="Assign leads clicked"',
    );
    track(CREATE_GROUP_TRACKING_POINTS.CLICK_ASSIGN_LEADS);

    setCurrentView(GroupDrawerView.AssignLeads);
  }, [shouldShowGroupLeads]);

  const handleBackToDetails = useCallback(() => {
    setCurrentView(GroupDrawerView.Details);
  }, []);

  const handleSaveWorkers = useCallback(() => {
    // Track save worker action
    sandbox.logger.info(
      'Component="CreateGroupDrawer" Event="Save assign workers clicked"',
    );
    track(GROUP_MODALS_TRACKING_POINTS.SAVE_WORKER);

    handleBackToDetails();
  }, [handleBackToDetails]);

  const handleSaveLeads = useCallback(() => {
    // Track save lead action
    sandbox.logger.info(
      'Component="CreateGroupDrawer" Event="Save assign leads clicked"',
    );
    track(GROUP_MODALS_TRACKING_POINTS.SAVE_LEAD);

    handleBackToDetails();
  }, [handleBackToDetails]);

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
          id: 'groups.drawer.title.create',
          defaultMessage: 'Create group',
        });
    }
  };

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(
    () =>
      hasUnsavedChangesInCreateMode(groupName, selectedMembers, selectedLeads),
    [groupName, selectedMembers, selectedLeads],
  );

  // Internal close handler (actual close logic)
  const handleDrawerClose = useCallback(() => {
    // Track close modal action when on AssignWorkers or AssignLeads view
    if (currentView === GroupDrawerView.AssignWorkers) {
      sandbox.logger.info(
        'Component="CreateGroupDrawer" Event="Close assign workers modal clicked"',
      );
      track(GROUP_MODALS_TRACKING_POINTS.CLOSE_WORKER_MODAL);
    } else if (currentView === GroupDrawerView.AssignLeads) {
      sandbox.logger.info(
        'Component="CreateGroupDrawer" Event="Close assign leads modal clicked"',
      );
      track(GROUP_MODALS_TRACKING_POINTS.CLOSE_LEAD_MODAL);
    }

    currentView !== GroupDrawerView.Details ? handleBackToDetails() : onClose();
  }, [currentView, handleBackToDetails, onClose]);

  // Intercept close attempts
  const handleAttemptClose = useCallback(() => {
    // Track X button click on create group drawer
    track(CREATE_GROUP_TRACKING_POINTS.CLOSE_CREATE_GROUP_DRAWER);

    if (hasUnsavedChanges && currentView === GroupDrawerView.Details) {
      dispatch(openUnsavedChangesModal());
    } else {
      handleDrawerClose();
    }
  }, [hasUnsavedChanges, currentView, dispatch, handleDrawerClose, track]);

  // Handler for "Don't Save"
  const handleDontSave = useCallback(() => {
    dispatch(closeUnsavedChangesModal());
    handleDrawerClose();
  }, [dispatch, handleDrawerClose]);

  // Handler for "Save" from modal
  const handleSaveFromModal = useCallback(() => {
    // Modal will close when save succeeds via handleSuccess callback
    dispatch(closeUnsavedChangesModal());
    // In Create mode, always call handleCreate
    handleCreate();
  }, [handleCreate, dispatch]);

  return (
    <Drawer
      open={open}
      onClose={handleAttemptClose}
      size="large"
      autoFocus
      restoreFocus
      data-testid="create-group-drawer"
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
                  // Track typing event once when user first starts typing
                  if (!hasTrackedTyping && value.length > 0) {
                    sandbox.logger.info(
                      'Component="CreateGroupDrawer" Event="Group name typed"',
                    );
                    track(CREATE_GROUP_TRACKING_POINTS.TYPE_GROUP_NAME);
                    setHasTrackedTyping(true);
                  }

                  setGroupName(value);
                  dispatch(clearDrawerError());
                }}
                onClearError={() => {
                  dispatch(clearDrawerError());
                }}
                onAssignWorkers={handleAssignWorkers}
                onAssignLeads={handleAssignLeads}
                onKeyDown={handleKeyDown}
                selectedWorkersCount={selectedWorkersCount}
                selectedLeadsCount={selectedLeadsCount}
                loading={loading}
                shouldShowGroupLeads={shouldShowGroupLeads}
              />
            )}

            {currentView === GroupDrawerView.AssignWorkers && (
              <WorkerAssignmentController
                groupId={undefined}
                groupName={
                  groupName ||
                  intl.formatMessage({
                    id: 'groups.drawer.new_group',
                    defaultMessage: 'the new group',
                  })
                }
                mode="create"
                context={GroupDrawerContext.CreateGroup}
                memberCount={undefined}
                open={open}
                currentView={currentView}
              />
            )}

            {shouldShowGroupLeads &&
              currentView === GroupDrawerView.AssignLeads && (
                <ManagerAssignmentController
                  groupId={undefined}
                  groupName={
                    groupName ||
                    intl.formatMessage({
                      id: 'groups.drawer.new_group',
                      defaultMessage: 'the new group',
                    })
                  }
                  mode="create"
                  context={GroupDrawerContext.CreateGroup}
                  managerCount={undefined}
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
                onClick={handleCancel}
                priority="secondary"
                disabled={loading}
                data-testid="create-group-drawer-cancel-btn"
              >
                {intl.formatMessage({
                  id: 'groups.drawer.button.cancel',
                  defaultMessage: 'Cancel',
                })}
              </Button>
              <Button
                onClick={handleCreate}
                priority="primary"
                disabled={loading}
                isLoading={loading}
                loadingComponent={<Activity shape="dots" size="small" />}
                data-testid="create-group-drawer-submit-btn"
              >
                {intl.formatMessage({
                  id: 'groups.drawer.button.create',
                  defaultMessage: 'Create group',
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
          }
        }}
        title={intl.formatMessage({
          id: 'groups.unsaved_changes.title',
          defaultMessage: 'Want to save your changes?',
        })}
        size="small"
        isLoading={loading}
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
        dismissible={!loading}
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

export default CreateGroupDrawer;
