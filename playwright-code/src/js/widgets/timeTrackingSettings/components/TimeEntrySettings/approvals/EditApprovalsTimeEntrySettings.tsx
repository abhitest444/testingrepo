import React, { useMemo, useCallback } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import styled from 'styled-components';
import { Checkbox } from '@ids-ts/checkbox';
import { TextArea } from '@ids-ts/textarea';
import { APPROVAL_SETTINGS_TRACKING_FIELDS } from 'src/js/common/useClickTracking';

export const SectionContainer = styled.div`
  display: flex;
  flex-flow: column;
  gap: 16px;
  width: 100%;

  &:has([data-testid='require-approval-for-tracked-time']) {
    margin-bottom: 32px;
  }
`;

export const SectionHeader = styled.label`
  font-weight: var(--font-weight-component-bold);
  color: var(--color-text-primary);
  font-size: var(--font-size-component-medium);
  line-height: normal;
`;

export const EditFormRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

export const CheckboxContent = styled.div`
  display: flex;
  align-items: baseline;
  line-height: normal;
  flex-direction: column;

  & label {
    margin: 0 !important;
  }
`;

export const CheckboxLabel = styled.label`
  font-weight: var(--font-weight-component-semibold);
  color: var(--color-text-primary);
  cursor: pointer;
  line-height: 1.4;
`;

export const CheckboxSubtitle = styled.div`
  font-size: var(--font-size-input-text-small);
  color: var(--color-text-secondary);
  margin-top: 4px;
  margin-left: 0;
`;

export const CheckboxNoMargin = styled(Checkbox)`
  & label {
    margin: 0 !important;
  }
`;

export const TextFieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const TextFieldLabel = styled.label`
  font-weight: var(--font-weight-component-semibold);
  color: var(--color-text-primary);
`;

export const ResetLink = styled.a`
  color: var(--color-action-standard);
  text-decoration: none;
  font-size: var(--font-size-action-small);
  cursor: pointer;
  margin-top: 8px;

  &:hover {
    text-decoration: underline;
  }
`;

interface IEditApprovalsTimeEntrySettings {
  shouldShowTeamMemberSubmissionOption?: boolean;
  shouldShowRequireApprovalForTrackedTime?: boolean;
}

export const EditApprovalsTimeEntrySettings: React.FC<
  IEditApprovalsTimeEntrySettings
> = ({
  shouldShowTeamMemberSubmissionOption = false,
  shouldShowRequireApprovalForTrackedTime = false,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const { control, setValue } = useFormContext();

  // Watch the "requireApprovalForTrackedTime" field to show/hide other options
  const requireApprovalForTrackedTime = useWatch({
    control,
    name: 'requireApprovalForTrackedTime',
  });

  // Memoize the reset handler to prevent recreation on every render
  const handleResetCustomMessage = useCallback(() => {
    track({
      ...APPROVAL_SETTINGS_TRACKING_FIELDS.APPROVAL_RESET_MESSAGE_BUTTON,
    });
    const originalMessage = intl.formatMessage({
      id: 'time-entries.approvals.custom-message.default',
    });
    setValue('customMessage', originalMessage, { shouldDirty: true });
  }, [intl, setValue, track]);

  // Memoize the conditional child options to prevent flikerring
  const childOptions = useMemo(() => {
    if (!requireApprovalForTrackedTime) {
      return null;
    }

    return (
      <>
        <EditFormRow>
          <CheckboxContent
            data-testid="require-submission-for-full-week"
            style={{ marginLeft: '24px' }}
          >
            <Controller
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  onChange={() => {
                    const newValue = !value;
                    track({
                      ...APPROVAL_SETTINGS_TRACKING_FIELDS.APPROVAL_REQUIRE_FULL_WEEK,
                      ui_action: newValue ? 'enabled' : 'disabled',
                    });
                    onChange(newValue);
                  }}
                  checked={value}
                >
                  {intl.formatMessage({
                    id: 'time-entries.section.title.approvals.require-submission-for-full-week',
                  })}
                </Checkbox>
              )}
              name="enablePartialWeekSubmission"
            />
          </CheckboxContent>
        </EditFormRow>

        {shouldShowTeamMemberSubmissionOption && (
          <EditFormRow>
            <CheckboxContent
              data-testid="require-team-members-submit-time"
              style={{ marginLeft: '24px' }}
            >
              <Controller
                render={({ field: { onChange, value } }) => (
                  <Checkbox
                    onChange={() => {
                      const newValue = !value;
                      track({
                        ...APPROVAL_SETTINGS_TRACKING_FIELDS.APPROVAL_MANDATORY_TEAM_MEMBER_SUBMISSION,
                        ui_action: newValue ? 'enabled' : 'disabled',
                      });
                      onChange(newValue);
                    }}
                    checked={value}
                  >
                    {intl.formatMessage({
                      id: 'time-entries.section.title.approvals.require-team-members-submit-time',
                    })}
                  </Checkbox>
                )}
                name="requireTeamMembersSubmitTime"
              />
            </CheckboxContent>
          </EditFormRow>
        )}

        <EditFormRow>
          <TextFieldContainer>
            <TextFieldLabel>
              {intl.formatMessage({
                id: 'time-entries.section.title.approvals.custom-message',
              })}
            </TextFieldLabel>
            <Controller
              name="customMessage"
              control={control}
              rules={{
                validate: (value: string) => {
                  if (!value || value.trim() === '') {
                    return intl.formatMessage({
                      id: 'time.tracking.validation.blank.submit.message',
                    });
                  }
                  if (value?.length > 192) {
                    return intl.formatMessage({
                      id: 'time.tracking.validation.invalid.submit.message.length',
                    });
                  }
                  return undefined;
                },
              }}
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <TextArea
                  value={value || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    onChange(e.target.value);
                    track(
                      APPROVAL_SETTINGS_TRACKING_FIELDS.APPROVAL_CUSTOM_MESSAGE,
                    );
                  }}
                  data-testid="custom-message"
                  style={{ width: '472px', height: '84px' }}
                  errorText={error?.message}
                />
              )}
            />
            <ResetLink onClick={handleResetCustomMessage}>
              {intl.formatMessage({
                id: 'time-entries.section.title.approvals.reset-message',
              })}
            </ResetLink>
          </TextFieldContainer>
        </EditFormRow>
      </>
    );
  }, [
    requireApprovalForTrackedTime,
    intl,
    control,
    handleResetCustomMessage,
    shouldShowTeamMemberSubmissionOption,
    track,
  ]);

  return (
    <SectionContainer>
      <EditFormRow>
        <CheckboxContent data-testid="install-approval">
          <Controller
            render={({ field: { onChange, value } }) => (
              <CheckboxNoMargin
                onChange={() => {
                  const newValue = !value;
                  onChange(newValue);
                }}
                checked
                disabled
              >
                <span>
                  {intl.formatMessage({
                    id: 'time-entries.section.title.approvals.approval-installed',
                  })}
                </span>
              </CheckboxNoMargin>
            )}
            name="approvalsRequired"
          />
          <CheckboxSubtitle>
            {intl.formatMessage({
              id: 'time-entries.section.title.approvals.require-approval-for-tracked-time.subtitle',
            })}
          </CheckboxSubtitle>
        </CheckboxContent>
      </EditFormRow>
      {shouldShowRequireApprovalForTrackedTime && (
        <>
          <EditFormRow>
            <CheckboxContent data-testid="require-approval-for-tracked-time">
              <Controller
                render={({ field: { onChange, value } }) => (
                  <CheckboxNoMargin
                    onChange={() => {
                      const newValue = !value;
                      track({
                        ...APPROVAL_SETTINGS_TRACKING_FIELDS.APPROVAL_TEAM_MEMBER_SUBMIT,
                        ui_action: newValue ? 'enabled' : 'disabled',
                      });
                      onChange(newValue);
                    }}
                    checked={value}
                  >
                    <span>
                      {intl.formatMessage({
                        id: 'time-entries.section.title.approvals.require-approval-for-tracked-time',
                      })}
                    </span>
                  </CheckboxNoMargin>
                )}
                name="requireApprovalForTrackedTime"
              />
            </CheckboxContent>
          </EditFormRow>

          {/* Show all 3 child options only if parent "Require approval for tracked time" is enabled */}
          {childOptions}
        </>
      )}
    </SectionContainer>
  );
};
