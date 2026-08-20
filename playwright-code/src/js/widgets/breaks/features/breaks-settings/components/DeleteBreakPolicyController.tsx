import { Delete } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import React from 'react';
import DeleteBreakRuleConfirmationModal from 'src/js/widgets/breaks/features/breaks-settings/components/DeleteBreakRuleConfirmationModal';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/breaks/store/hooks';
import {
  selectDeleteModalOpen,
  setBreakToDelete,
  setDeleteModalOpen,
} from 'src/js/widgets/breaks/store/uiSlice';
import { BreakRule } from 'src/js/widgets/breaks/types';
import { BREAK_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/breaks/constants';
import { DYN_BREAKS_SELECT_DELETE_BREAK_RULE } from '../../../trackingMetadata';

const DeleteBreakPolicyController = ({ item }: { item: BreakRule }) => {
  const intl = useIntl();
  const track = useTracking();
  const dispatch = useAppDispatch();
  const sandbox = useSandbox();
  const handleDelete = () => {
    dispatch(setBreakToDelete(item));
    dispatch(setDeleteModalOpen(true));
    track(BREAK_SETTINGS_TRACKING_POINTS.DELETE_BREAK);
    sandbox.analytics.track({
      dynamic_id: DYN_BREAKS_SELECT_DELETE_BREAK_RULE,
    });
  };

  return (
    <>
      <IconControl
        onClick={handleDelete}
        aria-label={intl.formatMessage({
          id: 'breaks.preferences.delete.aria',
        })}
        size="medium"
        data-dynamic-id={DYN_BREAKS_SELECT_DELETE_BREAK_RULE}
      >
        <Delete />
      </IconControl>
    </>
  );
};

export default DeleteBreakPolicyController;
