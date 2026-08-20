import { useCallback } from 'react';
import { useSelector, useStore } from 'react-redux';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { useUpdateGroup } from 'src/js/service/hooks/groups/useUpdateGroup';
import {
  createCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { ErrorSource } from '../../../types/Groups/GroupDrawer.types';
import { groupsSelectors } from '../../../store/workersGroupViewSlice';
import type { RootState } from '../../../store';

export interface UseGroupNameUpdateArgs {
  groupId: string;
  initialGroupName: string;
  onSuccess: (message: string) => void;
  onError: (error: string, errorCode?: string, source?: ErrorSource) => void;
  onClose: () => void;
}

export const useGroupNameUpdate = ({
  groupId,
  initialGroupName,
  onSuccess,
  onError,
  onClose,
}: UseGroupNameUpdateArgs) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const store = useStore<RootState>();

  const [updateGroup, { loading: updatingGroup }] = useUpdateGroup({
    onSuccess: (group) => {
      sandbox.logger.info(
        'Component="useGroupNameUpdate" Event="Group name updated successfully"',
        {
          groupId: group.id,
          groupName: group.name,
          newVersion: group.meta.version,
        },
      );

      onSuccess(
        intl.formatMessage(
          {
            id: 'groups.drawer.success.updated',
            defaultMessage: 'Group "{groupName}" updated successfully',
          },
          { groupName: group.name },
        ),
      );
      onClose();
    },
    onError: (error, errorCode) => {
      onError(error, errorCode, ErrorSource.UpdateGroup);
    },
  });

  const handleSaveGroupName = useCallback(
    async (groupName: string) => {
      if (groupName.trim() === initialGroupName.trim()) {
        sandbox.logger.info(
          'Component="useGroupNameUpdate" Event="No group name change detected"',
          { groupName },
        );
        onClose();
        return;
      }

      if (!groupName || groupName.trim().length === 0) {
        onError(
          intl.formatMessage({
            id: 'groups.drawer.error.nameRequired',
            defaultMessage: 'Group name is required',
          }),
          undefined,
          ErrorSource.UpdateGroup,
        );
        return;
      }

      // Get the latest version from Redux state at the moment of save
      const state = store.getState();
      const currentGroup = groupsSelectors.selectById(
        state.workersGroupView.groups,
        groupId,
      );
      const currentVersion = currentGroup?.meta?.version ?? 1;

      sandbox.logger.info(
        'Component="useGroupNameUpdate" Event="Updating group name"',
        {
          groupId,
          oldName: initialGroupName,
          newName: groupName,
          version: currentVersion,
        },
      );

      try {
        createCustomerInteraction(
          sandbox,
          TimeCustomerInteraction.GROUP_UPDATE,
        );
        await updateGroup({
          variables: {
            input: {
              id: groupId,
              name: groupName.trim(),
              version: currentVersion,
            },
          },
          context: {
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              TimeCustomerInteraction.GROUP_UPDATE,
            ),
          },
        });
      } catch (error) {
        sandbox.logger.error(
          'Component="useGroupNameUpdate" Event="Failed to update group name"',
          { error },
        );
      }
    },
    [
      initialGroupName,
      groupId,
      store,
      updateGroup,
      onClose,
      onError,
      intl,
      sandbox,
    ],
  );

  return {
    updatingGroup,
    handleSaveGroupName,
  };
};
