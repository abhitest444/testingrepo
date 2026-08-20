import React, { type CSSProperties } from 'react';
import styled from 'styled-components';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import Switch from '@ids-ts/switch';
import Checkbox from '@ids-ts/checkbox';
import Tooltip from '@ids-ts/tooltip';
import { CircleQuestion } from '@design-systems/icons';
import { useIntl, useTracking } from '@payroll/quicksand';
import { ITimeTrackingSettingsFormState } from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import { TIME_ACTIVITY_SETTINGS_TRACKING_POINTS } from 'src/js/common/useClickTracking';

export const FlexColumnContainer = styled.div`
  display: flex;
  flex-flow: column;
  gap: 32px;
`;

export const SectionContainer = styled.div`
  display: flex;
  flex-flow: column;
  gap: 16px;
`;

export const EditFormRow = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

export const BillRateField = styled.div`
  display: flex;
  align-items: center;
`;

export const FieldUpdateLabel = styled.label`
  min-width: 380px;
  font-weight: var(--font-weight-input-label);
  color: var(--color-text-primary);
`;

export const FieldUpdateValue = styled.span`
  min-width: 250px;
  font-weight: var(--font-weight-component-bold);
  color: var(--color-text-primary);
`;

export const BillRateCheckBox = styled.div`
  margin-left: 30px;
  align-items: center;
  display: inline-block;
  vertical-align: top;
  cursor: pointer;
  background-color: transparent;
  border: none;
  margin-right: 5px;
  margin-bottom: -14px;
`;

const HELP_QUESTION_ICON_STYLE: CSSProperties = {
  marginLeft: '4px',
  alignItems: 'center',
  display: 'inline-block',
  verticalAlign: 'middle',
  cursor: 'default',
  backgroundColor: 'transparent',
  border: 'none',
};

const LabelHelpTooltip = ({
  messageId,
  iconId,
}: {
  messageId: string;
  iconId: string;
}) => {
  const intl = useIntl();

  return (
    <Tooltip
      position="right"
      tooltipOffsetSkidding={-2}
      message={intl.formatMessage({ id: messageId })}
    >
      <CircleQuestion
        id={iconId}
        size="small"
        color="#6B6C72"
        style={HELP_QUESTION_ICON_STYLE}
      />
    </Tooltip>
  );
};

export const EditTimeSheetTimeTrackingSettings = () => {
  const { setValue } = useFormContext();
  const intl = useIntl();
  const track = useTracking();

  const { control } = useFormContext<ITimeTrackingSettingsFormState>();

  const isBillingFieldEnabled = useWatch({
    control,
    name: 'isBillingFieldEnabled',
  });

  return (
    <>
      <FlexColumnContainer>
        <SectionContainer>
          <EditFormRow>
            {/* Service Field */}
            <FieldUpdateLabel>
              {intl.formatMessage({
                id: 'location-settings.fields.timesheet-settings-service',
              })}
              <LabelHelpTooltip
                messageId="time-settings.service.popover"
                iconId="service_icon"
              />
            </FieldUpdateLabel>
            <FieldUpdateValue>
              <Controller
                render={({ field: { onChange, value } }) => (
                  <Switch
                    checked={value}
                    onChange={() => {
                      setValue('isServiceFieldEnabled', !value, {
                        shouldDirty: true,
                      });
                      onChange(!value);
                      track({
                        ...TIME_ACTIVITY_SETTINGS_TRACKING_POINTS.TIMESHEET_SERVICE_ITEM,
                        ui_action: !value ? 'enabled' : 'disabled',
                      });
                    }}
                    aria-label="serviceFieldEnableSwitch"
                  />
                )}
                name="isServiceFieldEnabled"
              />
            </FieldUpdateValue>
          </EditFormRow>

          <EditFormRow>
            {/* Billable Field */}
            <FieldUpdateLabel>
              {intl.formatMessage({
                id: 'location-settings.fields.timesheet-settings-billable',
              })}
              <LabelHelpTooltip
                messageId="time-settings.billable.popover"
                iconId="billable_icon"
              />
            </FieldUpdateLabel>
            <FieldUpdateValue>
              <Controller
                render={({ field: { onChange, value } }) => (
                  <Switch
                    checked={value}
                    onChange={() => {
                      setValue('isBillingFieldEnabled', !value, {
                        shouldDirty: true,
                      });
                      onChange(!value);
                      track({
                        ...TIME_ACTIVITY_SETTINGS_TRACKING_POINTS.TIMESHEET_BILLABLE,
                        ui_action: !value ? 'enabled' : 'disabled',
                      });
                    }}
                    aria-label="billableFieldEnableSwitch"
                  />
                )}
                name="isBillingFieldEnabled"
              />
            </FieldUpdateValue>
          </EditFormRow>

          {/* Bill Rate Field */}
          {isBillingFieldEnabled && (
            <BillRateField>
              <BillRateCheckBox>
                <Controller
                  render={({ field: { onChange, value } }) => (
                    <Checkbox
                      onChange={() => {
                        setValue('billingRateForTimeEnabled', !value, {
                          shouldDirty: true,
                        });
                        onChange(!value);
                        track({
                          ...TIME_ACTIVITY_SETTINGS_TRACKING_POINTS.TIMESHEET_BILL_RATE_PER_HOUR,
                          ui_action: !value ? 'enabled' : 'disabled',
                        });
                      }}
                      checked={value}
                    />
                  )}
                  name="billingRateForTimeEnabled"
                />
              </BillRateCheckBox>
              <FieldUpdateLabel>
                {intl.formatMessage({
                  id: 'location-settings.fields.timesheet-settings-show-bill-rate-to-user-entering-time',
                })}
                <LabelHelpTooltip
                  messageId="time-settings.billRate.popover"
                  iconId="billable_rate_icon"
                />
              </FieldUpdateLabel>
            </BillRateField>
          )}
        </SectionContainer>
      </FlexColumnContainer>
    </>
  );
};
