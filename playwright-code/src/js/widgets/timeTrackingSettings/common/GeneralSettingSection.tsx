import React, { ReactChild, ReactElement, useState } from 'react';
// external modules
import '@payroll-shared-components/payroll-settings-section/dist/main.css';
import SettingsSection, {
  useSettings,
} from '@payroll-shared-components/payroll-settings-section';
import { useIntl } from '@payroll/quicksand';
import styled from 'styled-components';

import { ERROR_STATES_TYPE } from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import { findConfigByName } from 'src/js/widgets/timeTrackingSettings/utils';
import { useRenderTitleWithBadge } from 'src/js/hooks/useRenderTitleWithBadge';

export const StyledSettingsSection = styled.div<{ componentId: string }>`
  div[data-testid='${({ componentId }) => `${componentId}-edit`}']
    > div:first-child {
    align-items: flex-start;
  }
`;

interface IGeneralSettingSectionProps {
  ViewContent: ReactChild;
  EditContent: ReactChild;
  Title: string;
  onFormUpdate: (formType: string) => void;
  onFormCancel: (formType: string) => void;
  isFormEdit: boolean;
  onSaveTimeTrackingSettings: () => void;
  id: string;
  isFormEditable: boolean;
  isDataUpdating: boolean;
  formEditType: string;
  isNewVisibleTill?: string;
  editButtonText?: ReactElement | string;
}

export const GeneralSettingSection = ({
  ViewContent,
  EditContent,
  Title,
  onFormUpdate,
  onFormCancel,
  isFormEdit,
  onSaveTimeTrackingSettings,
  id,
  isFormEditable,
  isDataUpdating,
  formEditType,
  isNewVisibleTill = '',
  editButtonText,
}: IGeneralSettingSectionProps) => {
  const intl = useIntl();
  const configElement = findConfigByName(Title);

  const [errorType] = useState<ERROR_STATES_TYPE>();

  const settingsMethods = useSettings();

  const handleEdit = () => {
    // reset error state so it's not persist when user goes back to edit
    onFormUpdate(formEditType);
  };

  const handleCancel = () => {
    // reset error state so it's not persist when user goes back to view
    onFormCancel(formEditType);
  };

  const handleSave = () => {
    // reset error state so it's not persist when user goes back to view
    onSaveTimeTrackingSettings();
  };

  return (
    <StyledSettingsSection componentId={id} id={id}>
      <SettingsSection
        {...settingsMethods}
        mode={isFormEdit ? 'EDIT' : 'VIEW'}
        readonly={!isFormEditable}
        cancelButtonText={intl.formatMessage({ id: 'cancel' })}
        editIconAriaLabel={intl.formatMessage({ id: 'edit' })}
        id={id}
        saveButtonText={intl.formatMessage({ id: 'save' })}
        title={useRenderTitleWithBadge(
          Title,
          configElement?.isNew,
          isNewVisibleTill,
        )}
        viewContent={ViewContent}
        errorMessage=""
        errorType={errorType}
        editContent={EditContent}
        onSave={handleSave}
        onEdit={handleEdit}
        onCancel={handleCancel}
        saving={isDataUpdating}
        editButtonText={editButtonText as string}
      />
    </StyledSettingsSection>
  );
};
