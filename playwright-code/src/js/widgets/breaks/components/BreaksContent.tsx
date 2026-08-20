import React, { Suspense, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { openBreakEntryForm } from '../store/breakEntriesSlice';
import {
  BREAK_SETTINGS_PREFERENCES_TROWSER_PROPS,
  BreaksWidgetOptions,
  BreakEntry,
} from '../types';
import BreakEntryFormContainer from '../features/break-entries/components/BreakEntryFormContainer';
import BreakEntryEditFormContainer from '../features/break-entries/components/BreakEntryEditFormContainer';
import BreakEntryTrigger from '../features/break-entries/components/BreakEntryTrigger';

const BreakSettingsHandle = React.lazy(
  () => import('../features/breaks-settings/components/BreakSettingsHandle'),
);

const BreakPreferencesContainer = React.lazy(
  () =>
    import('../features/breaks-settings/components/BreakPreferencesContainer'),
);

const BreakSelectorQuickfill = React.lazy(
  () => import('./BreakSelectorQuickfill'),
);

const PrefillContainer = React.lazy(
  () => import('./BreakEntryPrefillContainer'),
);

interface BreaksContentProps {
  options: BreaksWidgetOptions;
  employeeId?: string | null;
}

const BreaksContent: React.FC<BreaksContentProps> = ({
  options,
  employeeId,
}) => {
  const dispatch = useDispatch();

  const handleOpenBreakEntryForm = useCallback(() => {
    dispatch(openBreakEntryForm());
  }, [dispatch]);

  const renderFeature = useCallback(() => {
    if (options.feature === 'breaks-settings') {
      if (options.functionality === 'settings-handle') {
        return (
          <BreakSettingsHandle
            newBadgeVisibleTillDate={options.isNewBadgeVisibleTillDate}
            isEditable={options.isEditable}
            initialView={options.initialView}
          />
        );
      }
      return <div>Unknown functionality type</div>;
    }
    if (options.feature === 'break-entries') {
      if (options.functionality === 'create-break-entry') {
        return (
          <BreakEntryFormContainer
            open={options.props?.open}
            onSave={options.props?.onSave}
            onClose={options.props?.onClose}
            workerId={options.props?.workerId}
            employeeId={employeeId}
          />
        );
      }
      if (options.functionality === 'edit-break-entry') {
        return (
          <PrefillContainer timeEntryId={options.props?.timeEntryId}>
            <BreakEntryEditFormContainer
              open={options.props?.open}
              onSave={options.props?.onSave}
              onClose={options.props?.onClose}
            />
          </PrefillContainer>
        );
      }
      return <div>Unknown break-entries functionality</div>;
    }
    if (options.feature === 'breaks-quickfills') {
      if (options.functionality === 'breaks-selector-quickfill') {
        return <BreakSelectorQuickfill {...options.props} />;
      }
      return <div>Unknown breaks-quickfills functionality</div>;
    }
    return <div>Unknown feature type</div>;
  }, [options, handleOpenBreakEntryForm]);

  return (
    <Suspense fallback={<div>Loading...</div>}>{renderFeature()}</Suspense>
  );
};

export default BreaksContent;
