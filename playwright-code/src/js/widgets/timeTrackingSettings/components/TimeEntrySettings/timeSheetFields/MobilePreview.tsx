import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useWatch } from 'react-hook-form';
import { ChevronRight, Close } from '@design-systems/icons';
import { useIntl } from '@payroll/quicksand';
import { IconControl } from '@ids-ts/icon-control';

import { useDimensionVisibility } from 'src/js/common/useDimensionVisibility';
import mobileBg from 'src/js/widgets/images/mobile-bg.svg';
import {
  ITimeSheetFieldOption,
  ITimeEntrySettingsFormState,
} from 'src/js/widgets/timeTrackingSettings/types';
import { mapDimensionDefinitionsToPreviewFields } from 'src/js/widgets/timeTrackingSettings/utils';
import { TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS } from 'src/js/widgets/timeTrackingSettings/constants';

interface IMobilePreview {
  editTimeSheetFields: ITimeSheetFieldOption[];
  selectedCustomTimeSheetFields: string[];
  onClose?: () => void;
}

const MobilePreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const Title = styled.header`
  text-align: center;
  font-size: var(--font-size-component-small);
  font-style: normal;
  font-weight: 600;
  padding-top: 20px;
  margin-bottom: 5px;
`;

const Subtitle = styled.div`
  text-align: center;
  font-size: var(--font-size-component-small);
  font-style: normal;
  font-weight: var(--font-weight-component);
  line-height: 20px;

  @media (max-width: 576px) {
    padding: 4px 8px 20px 8px;
  }
`;

const CloseButtonContainer = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    position: absolute;
    top: 10px;
    right: 5px;
    z-index: 10;
  }
`;

const PreviewWindow = styled.div`
  margin: 0 auto;
  aspect-ratio: 345 / 663;
  height: 85%;
  max-width: 354px;
  width: 100%;

  @media (max-width: 576px) {
    padding: 0 8px 0 8px;
  }
`;

const MobileUI = styled.div`
  height: 100%;
  width: 100%;
  background-image: url(${mobileBg});
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center center;
  padding: 50% 9% 0 8%;
  line-height: 20px;
  font-size: var(--font-size-component-x-small);

  @media (max-width: 576px) {
    padding: 50% 7% 0 6%;
  }
`;

const ScrollableFields = styled.div`
  height: 72%;
  overflow-y: scroll;
  background-color: #f4f5f8;
`;

const PreviewField = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: var(--color-input-background-readonly);
  border-bottom: 1px solid var(--color-divider-tertiary);
  padding: 4px 12px;
`;

const PreviewFieldTitle = styled.div`
  font-weight: var(--font-weight-component-semibold);
  color: var(--color-text-secondary);
`;

const PreviewFieldSubtitle = styled.div`
  color: var(--color-ui-positive);
`;

const GreyBgNotes = styled.div`
  margin: -8px 2px 12px 6px;
  padding: 1px 0 0 0;
  background-color: var(
    --color-container-background-secondary
  ); /* (SemanticContextMatchOnly) */
`;

const GreyFooterBg = styled.div`
  height: 32px;
  margin: -8px 2px 12px 6px;
`;

const FieldToDisplayInMobile = styled.div`
  margin: -8px 2px 12px 6px;
`;

const Notes = styled.div`
  border: solid 1px var(--color-input-border-readonly);
  border-radius: var(--radius-content-control);
  margin: 8px 8px;
  padding: 2px 6px;
  background-color: var(--color-input-background-readonly);
  color: var(--color-text-secondary);
`;

const NotesPlaceholder = styled.div`
  color: var(--color-input-placeholder); /* (SemanticContextMatchOnly) */
  font-size: var(--font-size-input-text-x-small);
  padding: 0 0 48px 6px;
`;

const MobilePreviewSection = ({ field }: { field: ITimeSheetFieldOption }) => {
  const intl = useIntl();

  const isDimensionField = field.key.startsWith('dimensions.');
  const isLocationOrCustomerField =
    field.key ===
      TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED ||
    field.key ===
      TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED;
  // Customer and location lables can be changed from settings->advanced. Same label should be displayed for both fields.
  const fieldTitle = isDimensionField
    ? field.title
    : intl.formatMessage({ id: field.title });
  const defaultTitle = isDimensionField
    ? field.detail.title
    : intl.formatMessage({ id: field.detail.title });
  const displayTitle =
    isLocationOrCustomerField && fieldTitle !== defaultTitle
      ? fieldTitle
      : defaultTitle;

  let displaySubTitle: string;
  if (isDimensionField) {
    displaySubTitle = intl.formatMessage({ id: field.detail.subtitle });
  } else if (isLocationOrCustomerField && fieldTitle !== defaultTitle) {
    displaySubTitle = intl.formatMessage(
      {
        id: 'time-entries.section.title.time-sheet.mobile-preview.item.other.subtitle',
      },
      { field: field.title },
    );
  } else {
    displaySubTitle = intl.formatMessage({ id: field.detail.subtitle });
  }

  return (
    <PreviewField key={field.id} data-testid={`${field.id}-preview`}>
      <div>
        <PreviewFieldTitle>{displayTitle}</PreviewFieldTitle>
        <PreviewFieldSubtitle>{displaySubTitle}</PreviewFieldSubtitle>
      </div>
      <ChevronRight size="xsmall" color="var(--color-input-placeholder)" />{' '}
      {/* (SemanticContextMatchOnly) */}
    </PreviewField>
  );
};

export const MobilePreview: React.FC<IMobilePreview> = ({
  editTimeSheetFields,
  selectedCustomTimeSheetFields,
  onClose,
}) => {
  const intl = useIntl();
  const { isVisible: isDimensionsSectionVisible } = useDimensionVisibility();
  const customDimensions = useWatch({
    name: 'customDimensions',
  }) as ITimeEntrySettingsFormState['customDimensions'];
  const dimensionDefinitions = useWatch({
    name: 'dimensionDefinitions',
  }) as ITimeEntrySettingsFormState['dimensionDefinitions'];

  const timesheetDimensionPreviewFields = useMemo(
    () =>
      isDimensionsSectionVisible &&
      customDimensions !== undefined &&
      dimensionDefinitions !== undefined
        ? mapDimensionDefinitionsToPreviewFields(
            dimensionDefinitions,
            customDimensions,
          )
        : [],
    [isDimensionsSectionVisible, customDimensions, dimensionDefinitions],
  );
  const notesField =
    editTimeSheetFields &&
    editTimeSheetFields.length > 0 &&
    editTimeSheetFields.find(
      (field) => field.key === 'timeSheetEntryNotesEnabled',
    );

  // Read live dimension toggle state from the form. `undefined` when the
  // dimensions section never mounted (non-IES / flag off) — section then
  // contributes nothing to the mobile preview.
  const dimensionsState = useWatch({ name: 'dimensions' }) as Record<
    string,
    { enabled?: boolean; required?: boolean }
  >;
  const enabledDimensions = timesheetDimensionPreviewFields.filter(
    (previewField) => dimensionsState?.[previewField.id]?.enabled,
  );

  return (
    <MobilePreviewContainer
      key="mobile-preview"
      data-testid="field-setting-preview"
    >
      {onClose && (
        <CloseButtonContainer>
          <IconControl
            aria-label={intl.formatMessage({ id: 'trowser.cancel' })}
            size="medium"
            onClick={onClose}
            data-testid="mobile-preview-close-button"
          >
            <Close />
          </IconControl>
        </CloseButtonContainer>
      )}
      <div>
        <Title>
          {intl.formatMessage({
            id: 'time-entries.section.title.time-sheet.mobile-preview.title',
          })}
        </Title>
        <Subtitle>
          {intl.formatMessage({
            id: 'time-entries.section.title.time-sheet.mobile-preview.sub-title',
          })}
        </Subtitle>
        <PreviewWindow>
          <MobileUI>
            <ScrollableFields>
              {editTimeSheetFields &&
                editTimeSheetFields.length > 0 &&
                editTimeSheetFields.map(
                  (field) =>
                    (selectedCustomTimeSheetFields.indexOf(field.key) !== -1 ||
                      selectedCustomTimeSheetFields.indexOf(
                        'useItemForTime',
                      ) !== -1) &&
                    field.key !== 'timeSheetEntryNotesEnabled' && (
                      <FieldToDisplayInMobile key={field.id}>
                        <MobilePreviewSection field={field} />
                      </FieldToDisplayInMobile>
                    ),
                )}

              {enabledDimensions.map((dimension) => (
                <FieldToDisplayInMobile key={`dimension-${dimension.id}`}>
                  <MobilePreviewSection field={dimension} />
                </FieldToDisplayInMobile>
              ))}

              <GreyBgNotes>
                {editTimeSheetFields &&
                editTimeSheetFields.length > 0 &&
                notesField &&
                selectedCustomTimeSheetFields.indexOf(notesField.key) !== -1 ? (
                  <Notes data-testid="notes-preview">
                    {intl.formatMessage({ id: notesField.detail.title })}
                    <NotesPlaceholder>
                      {intl.formatMessage({ id: notesField.detail.subtitle })}
                    </NotesPlaceholder>
                  </Notes>
                ) : (
                  <GreyFooterBg />
                )}
              </GreyBgNotes>
            </ScrollableFields>
          </MobileUI>
        </PreviewWindow>
      </div>
    </MobilePreviewContainer>
  );
};
