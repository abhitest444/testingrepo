import React, { useEffect, useRef } from 'react';
import { useIntl, useTracking, useSandbox } from '@payroll/quicksand';
import styled from 'styled-components';
import Typography from '@ids-ts/typography';
import '@payroll-shared-components/payroll-settings-section/dist/main.css';
import SettingsSection from '@payroll-shared-components/payroll-settings-section';

import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/breaks/store/hooks';
import {
  setPreferencesOpen,
  resetUiState,
} from 'src/js/widgets/breaks/store/uiSlice';
import {
  selectBreakRules,
  selectBreakRulesLoading,
} from 'src/js/widgets/breaks/store/breakRulesSlice';
import BreakSettingsTrowserContainer from 'src/js/widgets/breaks/features/breaks-settings/components/BreakPreferenceTrowserContainer';
import { useRenderTitleWithBadge } from 'src/js/hooks/useRenderTitleWithBadge';
import {
  DEEP_LINK_NAVIGATION_EVENTS,
  SECTION_READY_EVENT,
  SECTION_READY_KEYS,
} from 'src/js/common/constants';
import { BREAK_SETTINGS_TRACKING_POINTS } from '../../../constants';
import { BreaksInitialViewOptions } from '../../../types';

interface IBreakSettingsHandle {
  newBadgeVisibleTillDate?: string;
  isEditable?: boolean;
  /** Initial view for deep-linking navigation */
  initialView?: BreaksInitialViewOptions | null;
}

const StyledSettingsSection = styled.div<{ componentId: string }>`
  div[data-testid='${({ componentId }) => `${componentId}-edit`}']
    > div:first-child {
    align-items: flex-start;
  }
`;

const BreakSettingsHandle: React.FC<IBreakSettingsHandle> = ({
  newBadgeVisibleTillDate,
  isEditable,
  initialView,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const dispatch = useAppDispatch();
  const sandbox = useSandbox();
  const rules = useAppSelector(selectBreakRules);
  const rulesLoading = useAppSelector(selectBreakRulesLoading);
  const trowserOpenedRef = useRef(false);
  const sectionReadyPublishedRef = useRef(false);

  // Publish section ready event when breaks data is loaded
  useEffect(() => {
    if (!rulesLoading && rules && !sectionReadyPublishedRef.current) {
      sectionReadyPublishedRef.current = true;
      sandbox.logger.info(
        'Component=BreakSettingsHandle Event=SECTION_READY section=BREAKS',
      );
      sandbox.pubsub.publish(SECTION_READY_EVENT, {
        section: SECTION_READY_KEYS.BREAKS,
      });
    }
  }, [rulesLoading, rules, sandbox]);

  const title = useRenderTitleWithBadge(
    intl.formatMessage({ id: 'breaks.settings.title' }),
    true,
    newBadgeVisibleTillDate,
  );

  const handleEdit = () => {
    dispatch(setPreferencesOpen(true));
    track(BREAK_SETTINGS_TRACKING_POINTS.EDIT_BREAKS_IN_SETTINGS);
  };

  // Handle initial view for deep-linking - open trowser
  useEffect(() => {
    if (!initialView || trowserOpenedRef.current) return;

    trowserOpenedRef.current = true;

    sandbox.logger.info(
      `Component=BreakSettingsHandle Event=DEEP_LINK_NAVIGATION view=${
        initialView.view
      } breakId=${initialView.breakId || 'none'}`,
    );

    // Open the trowser
    dispatch(setPreferencesOpen(true));

    // Notify parent that deep-link navigation is complete
    sandbox.pubsub.publish(DEEP_LINK_NAVIGATION_EVENTS.COMPLETE, {});
  }, [initialView, dispatch, sandbox]);

  // Reset UI state on unmount to ensure clean state on navigation
  useEffect(
    () => () => {
      dispatch(resetUiState());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // cleanup-only effect, dispatch is stable
  );

  return (
    <>
      <StyledSettingsSection componentId="break-settings">
        <SettingsSection
          mode="VIEW"
          readonly={!isEditable}
          saveButtonText=""
          cancelButtonText=""
          editIconAriaLabel={intl.formatMessage({ id: 'edit' })}
          id="break-settings-handle"
          title={title}
          viewContent={
            <Typography variant="body-3">
              {intl.formatMessage({ id: 'breaks.settings.manage' })}
            </Typography>
          }
          onEdit={handleEdit}
        />
      </StyledSettingsSection>
      <BreakSettingsTrowserContainer
        onClose={() => dispatch(setPreferencesOpen(false))}
      />
    </>
  );
};

export default BreakSettingsHandle;
