import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import Trowser from '@ids-ts/trowser';
import Button from '@ids-ts/button';
import { Activity } from '@ids-ts/loader';
import PageMessage from '@ids-ts/page-message';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { useFormContext } from 'react-hook-form';

import PanelContextual, {
  PanelContent,
  Placement,
} from '@ids-ts/panel-contextual';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { TimeEntriesFormType } from 'src/js/widgets/timeTrackingSettings/constants';
import { ITimeSheetFieldOption } from 'src/js/widgets/timeTrackingSettings/types';
import { FieldsPreview } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/FieldsPreview';
import { MobilePreview } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/MobilePreview';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';

const TrowserContent = styled.section`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 50px 50px;
  height: calc(100vh - 165px);
  position: relative;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-container-overlay);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
`;

const ErrorMessagePage = styled(PageMessage)`
  position: relative;
  margin-bottom: 24px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 32px;
  margin: 0 auto;
  width: 100%;
`;

const FieldSettingsWrapper = styled.div`
  width: 100% !important;
  display: flex;
  flex-direction: column;
`;

const FieldSettingsSection = styled.section`
  width: 100% !important;
  display: flex;
  flex-direction: inherit;
  width: fit-content;
`;
const CancelButtonContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 10;
`;

const StyledTrowser = styled(Trowser)<{ isPanelOpen?: boolean }>`
  & div[data-testid='panel'] {
    width: ${({ isPanelOpen }) => (isPanelOpen ? '372px' : '0px')} !important;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    background: var(--Primitives-Gray-gray-800, #f4f5f8);
    flex-shrink: 0;
    opacity: ${({ isPanelOpen }) => (isPanelOpen ? '1' : '0')};
  }
`;

interface IEditTimeSheetField {
  isTimeSheetEditing: boolean;
  onFormCancel: (formType: string) => void;
  onSaveTimeEntrySettings: () => void;
  isDataUpdating: boolean;
  editTimeSheetFields: ITimeSheetFieldOption[];
  updateSelectedCustomTimeSheetField: (
    selectedCustomTimeSheetField: string,
  ) => void;
  selectedCustomTimeSheetFields: string[];
  isIXPFlagLoading: boolean;
  featureFlagForRequiredTimeSheetFields: boolean;
  onDimensionsSetDefaults?: () => boolean;
}

export const EditTimeSheetField: React.FC<IEditTimeSheetField> = ({
  isTimeSheetEditing,
  onFormCancel,
  onSaveTimeEntrySettings,
  isDataUpdating,
  editTimeSheetFields,
  updateSelectedCustomTimeSheetField,
  selectedCustomTimeSheetFields,
  isIXPFlagLoading,
  featureFlagForRequiredTimeSheetFields,
  onDimensionsSetDefaults,
}) => {
  const { errorMessage } = useTimeTrackingSettingsContext(false);
  const intl = useIntl();
  const { formState } = useFormContext();
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isTimesheetPreviewOpen, setIsTimesheetPreviewOpen] = useState(true);
  const [isFieldAssignmentDetailView, setIsFieldAssignmentDetailView] =
    useState(false);
  const sandbox = useSandbox();
  const handleFieldAssignmentDetailViewChange = useCallback(
    (isOpen: boolean) => {
      setIsFieldAssignmentDetailView(isOpen);
    },
    [],
  );
  useEffect(() => {
    if (!isTimeSheetEditing) {
      setIsFieldAssignmentDetailView(false);
    }
  }, [isTimeSheetEditing]);
  useEffect(() => {
    if (featureFlagForRequiredTimeSheetFields) {
      sandbox.logger.info(
        `Component= Time Entry TimeSheet Settings with Required fields: Update`,
      );
    }
  }, [featureFlagForRequiredTimeSheetFields, sandbox.logger]);

  const handleFormClose = () => {
    if (
      formState.dirtyFields &&
      Object.keys(formState.dirtyFields).length > 0
    ) {
      setIsConfirmationModalOpen(true);
    } else {
      onFormCancel(TimeEntriesFormType.TIMESHEET);
    }
  };

  const handleYesClick = () => {
    onFormCancel(TimeEntriesFormType.TIMESHEET);
    setIsConfirmationModalOpen(false);
  };

  const handleNoClick = () => {
    setIsConfirmationModalOpen(false);
  };

  const handleClosePreview = () => {
    setIsTimesheetPreviewOpen(false);
  };

  return (
    <StyledTrowser
      dismissible
      title={intl.formatMessage({
        id: 'time-entries.section.title.time-sheet-settings',
      })}
      isPanelOpen={isTimesheetPreviewOpen}
      open={isTimeSheetEditing}
      onClose={handleFormClose}
      automationId="timesheet-Settings-trowser"
      data-testid="timesheet-settings-trowser"
      stepFlow={isFieldAssignmentDetailView}
      footerButton={[
        <Button
          loadingComponent={<Activity shape="dots" size="small" />}
          onClick={onSaveTimeEntrySettings}
          isLoading={isDataUpdating}
        >
          {intl.formatMessage({ id: 'save' })}
        </Button>,
        <CancelButtonContainer>
          <Button
            loadingComponent={<Activity shape="dots" size="small" />}
            onClick={() => onFormCancel(TimeEntriesFormType.TIMESHEET)}
            isLoading={isDataUpdating}
            priority="tertiary"
            purpose="standard"
            secondaryLabel=""
            size="medium"
          >
            {intl.formatMessage({ id: 'cancel' })}
          </Button>
        </CancelButtonContainer>,
      ]}
      panelContent={
        !isIXPFlagLoading ? (
          <PanelContextual
            open={isTimesheetPreviewOpen}
            showPanel={isTimesheetPreviewOpen}
            placement={Placement.Right}
            data-testid="panel"
          >
            <PanelContent>
              <MobilePreview
                editTimeSheetFields={editTimeSheetFields}
                selectedCustomTimeSheetFields={selectedCustomTimeSheetFields}
                onClose={handleClosePreview}
              />
            </PanelContent>
          </PanelContextual>
        ) : undefined
      }
    >
      <TrowserContent>
        {errorMessage && (
          <ErrorMessagePage
            open
            type="error"
            dismissible={false}
            title={errorMessage}
            automationId="TimeEntrySettingsErrorPageMessage"
          />
        )}
        {isDataUpdating && (
          <LoadingOverlay>
            <Activity shape="dots" size="large" />
          </LoadingOverlay>
        )}
        {!isIXPFlagLoading && (
          <ContentContainer>
            <FieldSettingsWrapper>
              <FieldSettingsSection>
                <FieldsPreview
                  editTimeSheetFields={editTimeSheetFields}
                  updateSelectedCustomTimeSheetField={
                    updateSelectedCustomTimeSheetField
                  }
                  featureFlagForRequiredTimeSheetFields={
                    featureFlagForRequiredTimeSheetFields
                  }
                  setIsTimesheetPreviewOpen={(value) =>
                    setIsTimesheetPreviewOpen(
                      typeof value === 'boolean' ? value : (prev) => !prev,
                    )
                  }
                  onFieldAssignmentDetailViewChange={
                    handleFieldAssignmentDetailViewChange
                  }
                  onDimensionsSetDefaults={onDimensionsSetDefaults}
                />
              </FieldSettingsSection>
            </FieldSettingsWrapper>
          </ContentContainer>
        )}
      </TrowserContent>
      <ConfirmationModal
        open={isConfirmationModalOpen}
        size="small"
        setOpen={setIsConfirmationModalOpen}
        onYesClick={handleYesClick}
        onNoClick={handleNoClick}
        showSectionDivider={false}
        actionAlignment="center"
        contentAlignment="center"
        headerAlignment="center"
      >
        <>
          {intl.formatMessage({
            id: 'unsaved.changes.time-sheet.confirmation.modal.content',
          })}
        </>
      </ConfirmationModal>
    </StyledTrowser>
  );
};
