import React, { useRef, useEffect, useState } from 'react';
import { Drawer, DrawerContent, DrawerFooter } from '@ids-ts/drawer';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Button } from '@ids-ts/button';
import { Activity } from '@ids-ts/loader';
import { TeamMember } from 'src/js/widgets/breaks/types';
import { Payroll_EmployerBreakInput } from 'src/__generated__/oigql/graphql';
import PrefillController from 'src/js/widgets/breaks/components/PrefillController';
import {
  selectBreakAssignmentsCreateLoading,
  selectBreakAssignmentsState,
} from 'src/js/widgets/breaks/store/breakAssignmentsSlice';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import {
  FooterContainer,
  ShadowedDrawerHeader,
  ScrollableListContainer,
  TeamMembersListWrapper,
  ReviewText,
} from '../styles/Breaks.styled';
import BreakAssignmentsForm from './assign-team-members/BreakAssignmentsForm';
import BreakPolicyForm from './BreakPolicyForm';
import AssignTeamMembersSearch from './assign-team-members/AssignTeamMembersSearch';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectTeamMembers } from '../../../store/workerSlice';
import {
  BREAK_LOGGING_CONSTANTS,
  BREAK_SETTINGS_TRACKING_POINTS,
} from '../../../constants';

import {
  selectIsDrawerOpen,
  selectIsEditBreakOpen,
  selectPageMessage,
  clearPageMessage,
} from '../../../store/uiSlice';
import {
  selectShowAssignTeamMembers,
  closeForm,
  setShowAssignTeamMembers,
  selectHasValidationErrors,
  selectTempAssignments,
  setTempAssignments,
} from '../../../store/breakPolicyFormSlice';
import PageMessage from '../../../components/PageMessage';
import {
  DYN_BREAKS_CANCEL_ADDING_BREAK_RULE,
  DYN_BREAKS_SAVE_ASSIGNMENTS,
  DYN_BREAKS_SAVE_BREAK_RULE,
  DYN_BREAKS_SELECT_ASSIGNMENTS,
} from '../../../trackingMetadata';

interface BreakPolicyFormContainerProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    data: Payroll_EmployerBreakInput,
    assignments?: TeamMember[],
  ) => void;
}

const BreakPolicyFormContainer: React.FC<BreakPolicyFormContainerProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const logger = useLoggingConfig();
  const [search, setSearch] = useState('');
  const sandbox = useSandbox();

  const isDrawerOpen = useAppSelector(selectIsDrawerOpen);
  // Redux state
  const showAssignTeamMembers = useAppSelector(selectShowAssignTeamMembers);
  const tempAssignments = useAppSelector(selectTempAssignments);
  const teamMembers = useAppSelector(selectTeamMembers);

  // Determine if we're editing based on Redux state
  const isEditing = useAppSelector(selectIsEditBreakOpen);

  // Get loading state from break rules (where the actual API calls happen)
  const { createLoading, updateLoading } = useAppSelector(
    (state) => state.breakRules,
  );
  const breakAssignmentsCreateLoading = useAppSelector(
    selectBreakAssignmentsCreateLoading,
  );
  const isSubmitting =
    createLoading || updateLoading || breakAssignmentsCreateLoading;

  useEffect(() => {
    if (!open) {
      dispatch(closeForm());
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (open && isEditing) {
      track(BREAK_SETTINGS_TRACKING_POINTS.VIEW_BREAK_RULE_DRAWER);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = (
    data: Payroll_EmployerBreakInput,
    assignments?: TeamMember[],
  ) => {
    logger.info(BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.FORM_SAVE_CLICKED, {
      isEditing,
      hasAssignments: !!assignments?.length,
    });
    // For new break rules, include the temporary team member selections
    onSave(data, assignments);
    // Note: clearTempAssignments is handled in the success callbacks in useBreaksCrud
  };

  const handleClose = (source: string) => {
    if (showAssignTeamMembers) {
      track(BREAK_SETTINGS_TRACKING_POINTS.EXIT_ASSIGNMENTS);
    } else {
      // Map 'source' to tracking points based on editing state
      const trackingMap: Record<string, TrackingPoint> = {
        header: BREAK_SETTINGS_TRACKING_POINTS.EXIT_ADD_BREAK_RULE,
        footer: BREAK_SETTINGS_TRACKING_POINTS.CANCEL_ADD_BREAK_RULE,
      };

      const trackingPoint = trackingMap[source];
      if (trackingPoint) {
        if (source === 'cancel') {
          sandbox.analytics.track({
            dynamic_id: DYN_BREAKS_CANCEL_ADDING_BREAK_RULE,
          });
        }
        track(trackingPoint);
      }
    }
    logger.info(BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.FORM_CANCEL_CLICKED);
    onClose();
  };

  const handleBackAction = () => {
    if (showAssignTeamMembers) {
      dispatch(setShowAssignTeamMembers(false));
      track(BREAK_SETTINGS_TRACKING_POINTS.GO_BACK_FROM_ASSIGNMENTS);
    }
  };

  const handleEditTeamMembers = () => {
    dispatch(setShowAssignTeamMembers(true));
    track(BREAK_SETTINGS_TRACKING_POINTS.SELECT_ASSIGNMENTS);
    sandbox.analytics.track({
      dynamic_id: DYN_BREAKS_SELECT_ASSIGNMENTS,
    });
  };

  // Store the submit function from the form component
  let submitForm: (() => void) | null = null;

  return (
    <Drawer open={open} size="large" autoFocus restoreFocus>
      <ShadowedDrawerHeader
        title={
          showAssignTeamMembers
            ? 'Assign team members'
            : intl.formatMessage({
                id: isEditing ? 'breaks.edit.title' : 'breaks.create.title',
              })
        }
        onClose={() => handleClose('header')}
        onBackActionClick={showAssignTeamMembers ? handleBackAction : undefined}
        backActionLabel={showAssignTeamMembers ? 'Back' : undefined}
      />
      <DrawerContent>
        {isDrawerOpen && (
          <PageMessage clearAction={clearPageMessage} testId="page-message" />
        )}
        <PrefillController>
          {showAssignTeamMembers ? (
            <ScrollableListContainer>
              <ReviewText>
                {intl.formatMessage({ id: 'breaks.create.teamMembers.review' })}
              </ReviewText>
              <AssignTeamMembersSearch value={search} onChange={setSearch} />
              <TeamMembersListWrapper>
                <BreakAssignmentsForm search={search} />
              </TeamMembersListWrapper>
            </ScrollableListContainer>
          ) : (
            <BreakPolicyForm
              open={open}
              onClose={() => handleClose('form')}
              onSave={handleSave}
              nameInputRef={nameInputRef}
              onEditTeamMembers={handleEditTeamMembers}
              setSubmitForm={(submitFn) => {
                submitForm = submitFn;
              }}
            />
          )}
        </PrefillController>
      </DrawerContent>
      <DrawerFooter color="#fff">
        <FooterContainer>
          {!showAssignTeamMembers && (
            <Button
              type="button"
              priority="secondary"
              onClick={() => handleClose('footer')}
              style={{ marginRight: 8 }}
              id={DYN_BREAKS_CANCEL_ADDING_BREAK_RULE}
            >
              {intl.formatMessage({ id: 'breaks.create.cancel' })}
            </Button>
          )}
          <Button
            type="button"
            priority="primary"
            isLoading={isSubmitting}
            loadingComponent={<Activity shape="dots" />}
            disabled={isSubmitting}
            onClick={() => {
              if (showAssignTeamMembers) {
                track(BREAK_SETTINGS_TRACKING_POINTS.SAVE_ASSIGNMENTS);
                // Just go back to form when on Assign Team Members page
                dispatch(setShowAssignTeamMembers(false));
                sandbox.analytics.track({
                  dynamic_id: DYN_BREAKS_SAVE_ASSIGNMENTS,
                });
              } else if (submitForm) {
                // Submit the form when on the main form
                submitForm();
                track(BREAK_SETTINGS_TRACKING_POINTS.SAVE_BREAK_RULE);
                sandbox.analytics.track({
                  dynamic_id: DYN_BREAKS_SAVE_BREAK_RULE,
                });
              }
            }}
            id={
              showAssignTeamMembers
                ? DYN_BREAKS_SAVE_ASSIGNMENTS
                : DYN_BREAKS_SAVE_BREAK_RULE
            }
          >
            {intl.formatMessage({
              id: showAssignTeamMembers
                ? 'breaks.create.done'
                : 'breaks.create.save',
            })}
          </Button>
        </FooterContainer>
      </DrawerFooter>
    </Drawer>
  );
};

export default BreakPolicyFormContainer;
