import React, { useState, useEffect, useRef } from 'react';
import { Drawer, DrawerContent, DrawerFooter } from '@ids-ts/drawer';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Button } from '@ids-ts/button';
import { Activity } from '@ids-ts/loader';
import { TeamMember } from 'src/js/widgets/breaks/types';
import { Payroll_CreateBreakAssignmentInput } from 'src/__generated__/oigql/graphql';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import PageMessage from './PageMessage';
import {
  FooterContainer,
  ShadowedDrawerHeader,
  ScrollableListContainer,
  TeamMembersListWrapper,
  ReviewText,
} from '../features/breaks-settings/styles/Breaks.styled';
import BreakAssignmentsForm from '../features/breaks-settings/components/assign-team-members/BreakAssignmentsForm';
import AssignTeamMembersSearch from '../features/breaks-settings/components/assign-team-members/AssignTeamMembersSearch';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectTeamMembers } from '../store/workerSlice';
import {
  selectBreakRulesUpdateLoading,
  selectBreakRuleById,
} from '../store/breakRulesSlice';
import {
  selectTempAssignments,
  setTempAssignments,
  clearValidationErrors,
} from '../store/breakPolicyFormSlice';
import {
  selectBreakAssignmentsByPolicyId,
  selectBreakAssignmentsLoading,
  selectBreakAssignmentsCreateError,
  setBreakAssignmentsLoading,
  setBreakAssignmentsCreateError,
  BreakAssignment,
} from '../store/breakAssignmentsSlice';
import {
  selectIsAssignmentEditorOpen,
  selectIsDrawerOpen,
  selectPageMessage,
  setIsAssignmentEditorOpen,
  setPageMessage,
  clearPageMessage,
} from '../store/uiSlice';
import useBreakAssignmentCrud from '../hooks/useBreakAssignmentCrud';
import useBreaksCrud from '../hooks/useBreaksCrud';
import useBreakAssignmentsByBreakId from '../hooks/useBreakAssignmentsByBreakId';
import { deriveAssignmentTypeFromWorkerType } from '../utils';
import {
  BREAK_LOGGING_CONSTANTS,
  BREAK_SETTINGS_TRACKING_POINTS,
} from '../constants';
import { DYN_BREAKS_CANCEL_ASSIGNMENTS } from '../trackingMetadata';

interface AssignmentEditorContainerProps {
  breakPolicyId: string;
  onClose?: () => void;
}

const AssignmentEditorContainer: React.FC<AssignmentEditorContainerProps> = ({
  breakPolicyId,
  onClose,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const dispatch = useAppDispatch();
  const logger = useLoggingConfig();
  const [search, setSearch] = useState('');
  const hasProcessedAssignments = useRef(false);
  const sandbox = useSandbox();

  const isAssignmentEditorOpen = useAppSelector(selectIsAssignmentEditorOpen);
  const tempAssignments = useAppSelector(selectTempAssignments);
  const teamMembers = useAppSelector(selectTeamMembers);
  const { createBreakAssignments } = useBreakAssignmentCrud();
  const { updateBreaksPolicy } = useBreaksCrud();
  const { getBreakAssignments } = useBreakAssignmentsByBreakId();

  // Get existing assignments and loading state
  const existingAssignments = useAppSelector((state) =>
    selectBreakAssignmentsByPolicyId(state, breakPolicyId),
  );
  const assignmentsLoading = useAppSelector(selectBreakAssignmentsLoading);
  const breakAssignmentsCreateLoading = useAppSelector(
    (state) => state.breakAssignments.createLoading,
  );
  const breakRulesUpdateLoading = useAppSelector(selectBreakRulesUpdateLoading);
  const pageMessage = useAppSelector(selectPageMessage);
  const createError = useAppSelector(selectBreakAssignmentsCreateError);

  // Get the break rule to check if it's a default policy
  const breakRule = useAppSelector((state) =>
    selectBreakRuleById(state, breakPolicyId),
  );

  // Watch for create errors and set page message
  useEffect(() => {
    if (createError) {
      dispatch(
        setPageMessage({
          show: true,
          type: 'error',
          message: createError,
          titleNlsKey: 'breaks.api.save.error.title',
          descriptionNlsKey: 'breaks.api.save.error.description',
        }),
      );
    }
  }, [createError, dispatch]);

  // Load existing assignments when the editor opens
  useEffect(() => {
    if (isAssignmentEditorOpen && breakPolicyId) {
      // Reset the processed flag when opening for a new break policy
      hasProcessedAssignments.current = false;
      getBreakAssignments(breakPolicyId, (freshAssignments) => {
        // This callback is called when fresh data is loaded
        if (
          isAssignmentEditorOpen &&
          !hasProcessedAssignments.current &&
          freshAssignments
        ) {
          // Create tempAssignments with all team members, setting isActive based on fresh assignments
          // If it's a default policy and no assignments exist, set all as active
          const allTeamMembersWithActiveStatus = teamMembers.map((member) => {
            const existingAssignment = freshAssignments.find(
              (assignment) => assignment.assignee.id === member.id,
            );

            // If it's a default policy and no assignments exist, default to active
            const defaultActive =
              breakRule?.isDefaultPolicy && freshAssignments.length === 0;

            return {
              ...member,
              isActive: existingAssignment
                ? existingAssignment.isActive
                : false,
            };
          });
          dispatch(setTempAssignments(allTeamMembersWithActiveStatus));
          hasProcessedAssignments.current = true;
        }
      });
    }
  }, [
    isAssignmentEditorOpen,
    breakPolicyId,
    getBreakAssignments,
    dispatch,
    teamMembers,
    breakRule,
  ]);

  const handleClose = (source?: string) => {
    logger.info(BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.FORM_CANCEL_CLICKED);
    switch (source) {
      case 'header':
        track(BREAK_SETTINGS_TRACKING_POINTS.EXIT_ASSIGNMENTS);
        break;
      case 'footer':
        track(BREAK_SETTINGS_TRACKING_POINTS.CANCEL_ASSIGNMENTS);
        sandbox.analytics.track({ dynamic_id: DYN_BREAKS_CANCEL_ASSIGNMENTS });
        break;
      default:
        break;
    }
    dispatch(setIsAssignmentEditorOpen(false));
    dispatch(setBreakAssignmentsCreateError(null)); // Clear any error when closing
    dispatch(clearPageMessage()); // Clear page message when closing
    if (onClose) {
      onClose();
    }
  };

  const handleSave = async () => {
    logger.info(BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.FORM_SAVE_CLICKED, {
      breakPolicyId,
      assignmentCount: tempAssignments?.length || 0,
    });

    // Clear any existing validation errors before saving
    dispatch(clearValidationErrors());

    if (tempAssignments) {
      // Get all active assignments
      const activeAssignments = tempAssignments.filter(
        (member) => member.isActive,
      );

      // Check if all team members are selected (all are active)
      const allTeamMembersSelected =
        activeAssignments.length >= teamMembers.length;

      if (allTeamMembersSelected) {
        // All team members selected, update break policy to be default
        updateBreaksPolicy(
          breakPolicyId,
          { isDefaultPolicy: true },
          tempAssignments,
        );
      } else {
        // Create break assignments for all workers with their respective isActive status
        const breakAssignments = tempAssignments.map((member) => ({
          assigneeId: member.id,
          assignmentType: deriveAssignmentTypeFromWorkerType(member),
          isActive: member.isActive || false,
        }));

        const breakAssignmentInput: Payroll_CreateBreakAssignmentInput = {
          breakPolicyId,
          breakAssignments,
        };
        createBreakAssignments(breakAssignmentInput);
      }
    } else {
      // No assignments selected, just close the editor
      handleClose();
    }
  };

  const isDrawerOpen = useAppSelector(selectIsDrawerOpen);

  return (
    <Drawer open={isAssignmentEditorOpen} size="large" autoFocus restoreFocus>
      <ShadowedDrawerHeader
        title={intl.formatMessage({ id: 'breaks.assignments.title' })}
        onClose={() => handleClose('header')}
      />
      <DrawerContent>
        {pageMessage.show && isDrawerOpen && (
          <PageMessage
            clearAction={clearPageMessage}
            testId="assignment-editor-error-message"
          />
        )}
        {assignmentsLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <Activity shape="dots" />
          </div>
        ) : (
          <ScrollableListContainer>
            <ReviewText>
              {intl.formatMessage({ id: 'breaks.assignments.review' })}
            </ReviewText>
            <AssignTeamMembersSearch value={search} onChange={setSearch} />
            <TeamMembersListWrapper>
              <BreakAssignmentsForm search={search} />
            </TeamMembersListWrapper>
          </ScrollableListContainer>
        )}
      </DrawerContent>
      <DrawerFooter color="#fff">
        <FooterContainer>
          <Button
            type="button"
            priority="secondary"
            onClick={() => handleClose('footer')}
            style={{ marginRight: 8 }}
            id={DYN_BREAKS_CANCEL_ASSIGNMENTS}
          >
            {intl.formatMessage({ id: 'breaks.assignments.cancel' })}
          </Button>
          <Button
            type="button"
            priority="primary"
            isLoading={
              breakAssignmentsCreateLoading ||
              breakRulesUpdateLoading ||
              assignmentsLoading
            }
            loadingComponent={<Activity shape="dots" />}
            disabled={
              breakAssignmentsCreateLoading ||
              breakRulesUpdateLoading ||
              assignmentsLoading
            }
            onClick={handleSave}
          >
            {intl.formatMessage({ id: 'breaks.assignments.save' })}
          </Button>
        </FooterContainer>
      </DrawerFooter>
    </Drawer>
  );
};

export default AssignmentEditorContainer;
