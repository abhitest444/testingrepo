import React, { useState, useEffect, useRef } from 'react';
import { useSandbox, useTracking } from '@payroll/quicksand';
import { Activity } from '@ids-ts/loader';
import styled from 'styled-components';
import { TeamMember } from 'src/js/widgets/breaks/types';

import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/breaks/store/hooks';
import {
  selectBreakRules,
  selectBreakRulesLoading,
} from 'src/js/widgets/breaks/store/breakRulesSlice';
import { selectTeamMembers } from 'src/js/widgets/breaks/store/workerSlice';

import {
  clearPageMessage,
  closeDrawer,
  selectIsDrawerOpen,
} from 'src/js/widgets/breaks/store/uiSlice';
import { RootState } from 'src/js/widgets/breaks/store';
import { withBreaksController } from 'src/js/widgets/breaks/components/withBreaksController';
import {
  Payroll_EmployerBreakInput,
  Payroll_CreateBreakAssignmentInput,
} from 'src/__generated__/oigql/graphql';

import useBreaksCrud from 'src/js/widgets/breaks/hooks/useBreaksCrud';
import { getModifiedBreakRuleFields } from 'src/js/widgets/breaks/utils';
import BreaksPopoverTourAdapter from 'src/js/widgets/breaks/features/breaks-settings/components/BreaksPopoverTourAdapter';
import BreaksWhatsNewButton from 'src/js/widgets/breaks/features/breaks-settings/components/BreaksWhatsNewButton';

import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import BreakPolicyFormContainer from './BreakPolicyFormContainer';
import BreakPreferences from './BreakPreferences';
import DeleteBreakRuleConfirmationModal from './DeleteBreakRuleConfirmationModal';
import PageMessage from '../../../components/PageMessage';
import {
  BREAK_LOGGING_CONSTANTS,
  BREAKS_TRACKING_POINTS,
} from '../../../constants';

const CenteredLoader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
`;

interface BreakPreferencesContainerProps {}

const BreakPreferencesContainer: React.FC<
  BreakPreferencesContainerProps
> = () => {
  const [tourOpen, setTourOpen] = useState(false);
  const {
    data: uxPreferencesData,
    getPreference,
    setPreference,
  } = useUxPreferences();
  const tourShownRef = useRef(false);
  const sandbox = useSandbox();
  const logger = useLoggingConfig();
  const track = useTracking();

  const dispatch = useAppDispatch();

  const loading = useAppSelector(selectBreakRulesLoading);
  const breakRules = useAppSelector(selectBreakRules);
  const teamMembers = useAppSelector(selectTeamMembers);
  const { isCreateBreakOpen, isEditBreakOpen, breakToEdit } = useAppSelector(
    (state: RootState) => state.ui,
  );

  // Load preference when component opens
  useEffect(() => {
    getPreference(UxPreferenceKey.BREAKS_TOUR_COMPLETED);
  }, [getPreference]);

  // Start the tour when the container opens and preference allows it
  useEffect(() => {
    if (!loading && !tourShownRef.current) {
      const tourCompleted =
        uxPreferencesData[UxPreferenceKey.BREAKS_TOUR_COMPLETED];

      if (tourCompleted !== true) {
        setTourOpen(true);
        tourShownRef.current = true; // Mark that we've shown the tour
        logger.info(BREAK_LOGGING_CONSTANTS.NAVIGATION.TOUR_STARTED);
        track(BREAKS_TRACKING_POINTS.BREAK_TOUR_MODAL_OPEN);
      } else {
        setTourOpen(false);
        tourShownRef.current = true; // Mark that we've checked and decided not to show
        track(BREAKS_TRACKING_POINTS.BREAK_TOUR_MODAL_CLOSE);
        logger.info(BREAK_LOGGING_CONSTANTS.NAVIGATION.TOUR_NOT_STARTED);
      }
    } else if (loading) {
      setTourOpen(false);
    }
  }, [loading, uxPreferencesData, logger, track]);

  const handleCancel = () => {
    dispatch(closeDrawer());
  };

  const { createBreaksPolicy, updateBreaksPolicy } = useBreaksCrud();

  const isDrawerOpen = useAppSelector(selectIsDrawerOpen);

  const handleSave = (
    updatedRule: Payroll_EmployerBreakInput,
    assignments?: TeamMember[],
  ) => {
    if (isCreateBreakOpen) {
      createBreaksPolicy(updatedRule, assignments);
    } else if (isEditBreakOpen && breakToEdit) {
      // Get the original break rule from the store
      const originalBreakRule = breakRules.find(
        (rule) => rule.id === breakToEdit.id,
      );

      if (originalBreakRule) {
        const modifiedFields = getModifiedBreakRuleFields(
          originalBreakRule,
          updatedRule,
        );
        updateBreaksPolicy(breakToEdit.id, modifiedFields, assignments);
      }
    }
  };

  const handleTourClose = async () => {
    try {
      setTourOpen(false);
      logger.info(BREAK_LOGGING_CONSTANTS.NAVIGATION.TOUR_COMPLETED);
      track(BREAKS_TRACKING_POINTS.BREAK_TOUR_MODAL_CLOSE);
    } catch (error) {
      logger.error('Failed to save preference:', { error });
      track(BREAKS_TRACKING_POINTS.BREAK_TOUR_MODAL_FAILED);
    }

    setTourOpen(false);
  };

  const handleTourFinish = async () => {
    setTourOpen(false);
    try {
      await setPreference(UxPreferenceKey.BREAKS_TOUR_COMPLETED, true);
      logger.info(BREAK_LOGGING_CONSTANTS.NAVIGATION.TOUR_COMPLETED);
      track(BREAKS_TRACKING_POINTS.BREAK_TOUR_MODAL_FINISH);
    } catch (error) {
      const errorMessage = String(error);
      logger.error('Failed to save preference:', { error: errorMessage });
      track(BREAKS_TRACKING_POINTS.BREAK_TOUR_MODAL_FAILED);
    }
  };

  return (
    <>
      {!isDrawerOpen && (
        <PageMessage clearAction={clearPageMessage} testId="ui-page-message" />
      )}
      {loading && (
        <CenteredLoader>
          <Activity shape="dots" />
        </CenteredLoader>
      )}
      {!loading && <BreakPreferences />}

      {/* What's New Button */}
      {!loading && (
        <BreaksWhatsNewButton
          onClick={() => {
            setTourOpen(true);
          }}
        />
      )}

      {!loading && tourOpen && (
        <BreaksPopoverTourAdapter
          open={tourOpen}
          onClose={handleTourClose}
          onFinish={handleTourFinish}
        />
      )}
      <DeleteBreakRuleConfirmationModal />

      {/* Combined Create/Edit Break Form */}

      <BreakPolicyFormContainer
        open={isCreateBreakOpen || isEditBreakOpen}
        onClose={handleCancel}
        onSave={handleSave}
      />
    </>
  );
};

export default withBreaksController(BreakPreferencesContainer);
