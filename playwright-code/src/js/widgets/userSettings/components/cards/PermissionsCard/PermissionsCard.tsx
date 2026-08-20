import React, { useCallback, useEffect } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/userSettings/store';
import { selectSettingsFor } from 'src/js/widgets/userSettings/store/slices/settingsContextSlice';
import {
  cancelPermissionsEdit,
  commitDraftPermissions,
  selectDraftPermissions,
  selectPermissions,
  selectPermissionsMode,
  selectPermissionsSaving,
  setPermissionsError,
  setPermissionsMode,
  setPermissionsSaving,
} from 'src/js/widgets/userSettings/store/slices/permissionsSlice';
import {
  ManageUserPermissionsResponse,
  useManageUserPermissions,
} from '../../../service/permissions/useManageUserPermissions';
import { useCompanyPermissionsSdkFlags } from '../../../service/permissions/useCompanyPermissionsSdkFlags';
import PermissionsCardEdit from './components/PermissionsCardEdit';
import PermissionsCardView from './components/PermissionsCardView';
import { PermissionsCardMode } from './types/PermissionsCard.types';

interface PermissionsCardProps {
  showActions?: boolean;
}

/** Orchestrator for the Permissions card; reads slice, runs save mutation, switches VIEW/EDIT. */
const PermissionsCard: React.FC<PermissionsCardProps> = ({
  showActions = true,
}) => {
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();

  const mode = useAppSelector(selectPermissionsMode);
  const draft = useAppSelector(selectDraftPermissions);
  const persisted = useAppSelector(selectPermissions);
  const saving = useAppSelector(selectPermissionsSaving);
  const settingsFor = useAppSelector(selectSettingsFor);

  const companyPermissionsSdkFlags = useCompanyPermissionsSdkFlags();

  useEffect(() => {
    sandbox.logger.info(
      'Component=PermissionsCard Event=Permissions card viewed',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSuccess = useCallback(
    (data: ManageUserPermissionsResponse) => {
      dispatch(commitDraftPermissions(data.permissions));
    },
    [dispatch],
  );

  const handleSaveError = useCallback(
    (errorMessage: string) => {
      dispatch(setPermissionsError(errorMessage));
    },
    [dispatch],
  );

  const { saveUserPermissions } = useManageUserPermissions({
    onSuccess: handleSaveSuccess,
    onError: handleSaveError,
  });

  const handleSave = useCallback(async () => {
    if (
      !settingsFor?.id ||
      !settingsFor?.timeForType ||
      saving ||
      !draft ||
      !persisted
    ) {
      return;
    }
    dispatch(setPermissionsSaving(true));
    await saveUserPermissions({
      settingsFor: {
        id: settingsFor.id,
        timeForType: settingsFor.timeForType,
      },
      permissions: draft,
      previousPermissions: persisted,
    });
  }, [dispatch, draft, persisted, saving, saveUserPermissions, settingsFor]);

  const handleEdit = useCallback(() => {
    dispatch(setPermissionsMode(PermissionsCardMode.EDIT));
  }, [dispatch]);

  const handleCancel = useCallback(() => {
    dispatch(cancelPermissionsEdit());
  }, [dispatch]);

  if (mode === PermissionsCardMode.EDIT && draft) {
    return (
      <PermissionsCardEdit
        onSave={handleSave}
        onCancel={handleCancel}
        companyPermissionsSdkFlags={companyPermissionsSdkFlags}
      />
    );
  }

  return (
    <PermissionsCardView
      showActions={showActions}
      onEditClick={handleEdit}
      companyPermissionsSdkFlags={companyPermissionsSdkFlags}
    />
  );
};

export default PermissionsCard;
