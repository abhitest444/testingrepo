import React, { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import Switch from '@ids-ts/switch';
import { Table } from '@ids-ts/table';
import { Activity } from '@ids-ts/loader';
import { useIntl, useTracking } from '@payroll/quicksand';
import { ChevronDown, ChevronUp } from '@design-systems/icons';
import Widget from 'web-shell-core/widgets/HOCWidget';

import {
  ITimeEntrySettingsFormState,
  ITimeSheetFieldOption,
} from 'src/js/widgets/timeTrackingSettings/types';
import { TIME_SETTINGS_WIDGET_SOURCE } from 'src/js/widgets/timeTrackingSettings/constants';
import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';
import {
  CheckBoxWithToolTip,
  DimensionsActionLink,
  DisplayCell,
  FieldLabelContainer,
  RequiredFieldContainer,
  SectionGroupCell,
  SectionGroupHeaderRow,
  SectionGroupTitle,
  StatusSwitchContainer,
  StyledChevron,
} from '../../styles';

export interface DimensionsSectionProps {
  previewFields: ITimeSheetFieldOption[];
  loading?: boolean;
  colSpan?: number;
  /**
   * Invoked when "Set defaults" is clicked. Returns `true` when it handled the
   * click (closes the timesheet settings trowser when launched from payroll
   * defaults); `false` to fall back to opening the custom defaults widget.
   */
  onSetDefaults?: () => boolean;
}

export const DimensionsSection: React.FC<DimensionsSectionProps> = ({
  previewFields,
  loading = false,
  colSpan = 5,
  onSetDefaults,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const { control, setValue } = useFormContext<ITimeEntrySettingsFormState>();
  const dimensionToggles = useWatch({
    control,
    name: 'dimensions',
  });

  const [collapsed, setCollapsed] = useState(false);
  const [customMappingOpen, setCustomMappingOpen] = useState(false);

  const isEmpty = !loading && previewFields.length === 0;

  return (
    <>
      <Table.Row
        data-testid="dimensions-section-header"
        onClick={() => {
          const nextCollapsed = !collapsed;
          setCollapsed(nextCollapsed);
          track(
            nextCollapsed
              ? TIME_ENTRY_SETTINGS_TRACKING_POINTS.DIMENSIONS_COLLAPSE
              : TIME_ENTRY_SETTINGS_TRACKING_POINTS.DIMENSIONS_EXPAND,
          );
        }}
      >
        <SectionGroupCell colSpan={colSpan}>
          <SectionGroupHeaderRow>
            <SectionGroupTitle>
              {intl.formatMessage(
                {
                  id: 'time-entries.section.title.dimensions-with-count',
                  defaultMessage: 'Dimensions ({count})',
                },
                { count: previewFields.length },
              )}
              <StyledChevron>
                {collapsed ? (
                  <ChevronDown size="small" />
                ) : (
                  <ChevronUp size="small" />
                )}
              </StyledChevron>
            </SectionGroupTitle>
            <DimensionsActionLink
              data-testid="dimensions-set-defaults-link"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                track(
                  TIME_ENTRY_SETTINGS_TRACKING_POINTS.DIMENSIONS_SET_DEFAULTS,
                );
                // When launched from payroll defaults, close the timesheet
                // trowser instead of opening the custom defaults widget.
                if (!onSetDefaults?.()) {
                  setCustomMappingOpen(true);
                }
              }}
            >
              {intl.formatMessage({
                id: 'time-entries.section.dimensions.set-defaults-link',
                defaultMessage: 'Set defaults',
              })}
            </DimensionsActionLink>
          </SectionGroupHeaderRow>
        </SectionGroupCell>
      </Table.Row>

      {!collapsed && loading && (
        <Table.Row data-testid="dimensions-loading-row">
          <Table.Cell colSpan={colSpan}>
            <Activity shape="dots" size="small" />
          </Table.Cell>
        </Table.Row>
      )}

      {!collapsed && isEmpty && (
        <Table.Row data-testid="dimensions-empty-row">
          <Table.Cell colSpan={colSpan}>
            {intl.formatMessage({
              id: 'time-entries.section.dimensions.empty-state',
              defaultMessage: 'No dimensions',
            })}
          </Table.Cell>
        </Table.Row>
      )}

      {!collapsed &&
        !loading &&
        !isEmpty &&
        previewFields.map((previewField) => {
          const enabledOnTimesheet =
            dimensionToggles?.[previewField.id]?.enabled ??
            !!previewField.value;

          return (
            <Table.Row
              key={`dimension-${previewField.id}`}
              data-testid={`dimension-row-${previewField.id}`}
            >
              <DisplayCell data-testid={`dimension-label-${previewField.id}`}>
                <CheckBoxWithToolTip isSubField={false}>
                  <FieldLabelContainer>
                    <span>{previewField.title}</span>
                  </FieldLabelContainer>
                </CheckBoxWithToolTip>
              </DisplayCell>

              <Table.Cell
                data-testid={`dimension-customers-${previewField.id}`}
              >
                <span>
                  {intl.formatMessage({
                    id: 'time-entries.section.dimensions.all-customers',
                  })}
                </span>
              </Table.Cell>

              <Table.Cell data-testid={`dimension-status-${previewField.id}`}>
                <Controller
                  name={`dimensions.${previewField.id}.enabled` as const}
                  control={control}
                  defaultValue={!!previewField.value}
                  render={({ field: { onChange, value } }) => (
                    <StatusSwitchContainer>
                      <span>
                        {value
                          ? intl.formatMessage({
                              id: 'time-entries.switch.label.active',
                            })
                          : intl.formatMessage({
                              id: 'time-entries.switch.label.inactive',
                            })}
                      </span>
                      <Switch
                        checked={!!value}
                        onChange={() => {
                          const newValue = !value;
                          onChange(newValue);
                          track({
                            ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.DIMENSION_SHOW_ON_TIMESHEET,
                            ui_action: newValue ? 'enabled' : 'disabled',
                          });
                          if (!newValue) {
                            setValue(
                              `dimensions.${previewField.id}.required` as const,
                              false,
                              { shouldDirty: true },
                            );
                          }
                        }}
                        aria-label={previewField.id}
                      />
                    </StatusSwitchContainer>
                  )}
                />
              </Table.Cell>

              <Table.Cell data-testid={`dimension-required-${previewField.id}`}>
                <Controller
                  name={`dimensions.${previewField.id}.required` as const}
                  control={control}
                  defaultValue={!!previewField.requiredField?.value}
                  render={({ field: { onChange, value } }) => (
                    <RequiredFieldContainer>
                      <span>
                        {value
                          ? intl.formatMessage({
                              id: 'time-entries.switch.label.yes',
                            })
                          : intl.formatMessage({
                              id: 'time-entries.switch.label.no',
                            })}
                      </span>
                      <Switch
                        checked={!!value}
                        onChange={() => {
                          const newValue = !value;
                          onChange(newValue);
                          track({
                            ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.DIMENSION_REQUIRED,
                            ui_action: newValue ? 'enabled' : 'disabled',
                          });
                        }}
                        disabled={!enabledOnTimesheet}
                        aria-label={`${previewField.id}-required`}
                      />
                    </RequiredFieldContainer>
                  )}
                />
              </Table.Cell>

              <Table.Cell data-testid={`dimension-action-${previewField.id}`}>
                <span />
              </Table.Cell>
            </Table.Row>
          );
        })}

      {customMappingOpen && (
        <Widget
          key="custom-defaults-ui/custom-defaults"
          widgetId="custom-defaults-ui/customdefaults"
          data-testid="custom-defaults-widget"
          onClose={() => setCustomMappingOpen(false)}
          widgetSource={TIME_SETTINGS_WIDGET_SOURCE}
        />
      )}
    </>
  );
};
