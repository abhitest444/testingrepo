import React, {
  useCallback,
  RefObject,
  useEffect,
  useState,
  useMemo,
  useRef,
} from 'react';
import { useIntl } from '@payroll/quicksand';
import Button from '@ids-ts/button';
import { Typography } from '@ids-ts/typography';
import { BreakRule, TeamMember } from 'src/js/widgets/breaks/types';
import {
  Payroll_Break,
  Payroll_DurationUnit,
  Payroll_EmployerBreakInput,
  Payroll_AutoBreakRuleInput,
  Payroll_ManualBreakRuleInput,
  Payroll_BreakPosition,
  Common_DayOfWeek,
} from 'src/__generated__/oigql/graphql';
import {
  useAppSelector,
  useAppDispatch,
} from 'src/js/widgets/breaks/store/hooks';
import { selectTeamMembers } from 'src/js/widgets/breaks/store/workerSlice';

import {
  selectFormData,
  resetFormData,
  initializeFormData,
  selectValidationErrors,
  selectHasValidationErrors,
  setValidationErrors,
  clearValidationErrors,
  selectTempAssignments,
} from 'src/js/widgets/breaks/store/breakPolicyFormSlice';
import { HorizontalRule } from 'src/js/widgets/common/HorizontalRule';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  selectIsCreateBreakOpen,
  selectIsEditBreakOpen,
} from 'src/js/widgets/breaks/store/uiSlice';
import {
  BREAK_DAYS_TO_COMMON_DAYS_MAP,
  BreakDaysOfWeek,
  BREAK_LOCATIONS,
  BREAK_LOGGING_CONSTANTS,
} from '../../../constants';
import BreakNameField from './BreakNameField';
import BreakDurationSection from './BreakDurationSection';
import BreakTeamMembersSection from './BreakTeamMembersSection';
import BreakTypeRadioGroup from './BreakTypeRadioGroup';
import BreakAutoSection from './BreakAutoSection';
import BreakManualSection from './BreakManualSection';
import { FormValidationError } from './FormValidationError';

interface BreakPolicyFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    data: Payroll_EmployerBreakInput,
    assignments?: TeamMember[],
  ) => void;
  nameInputRef?: RefObject<HTMLInputElement>;
  onEditTeamMembers: () => void;
  setSubmitForm?: (submitFn: () => void) => void;
}

// Validation utility functions
const validateBreakPolicyForm = (
  formData: any,
  intl: any,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Validate break name is required
  if (!formData.breakName?.trim()) {
    errors.breakName = intl.formatMessage({
      id: 'breaks.validation.name.required',
    });
  }

  // Validate duration is required when noSetDuration is false
  if (
    !formData.noSetDuration &&
    (!formData.breakDuration || formData.breakDuration <= 0)
  ) {
    errors.breakDuration = intl.formatMessage({
      id: 'breaks.api.error.BREAK_DURATION_NULL_FOR_SET_DURATION',
    });
  }

  // Validate that either Auto or Manual break type is selected
  if (!formData.allowAuto && !formData.allowManual) {
    errors.breakType = intl.formatMessage({
      id: 'breaks.validation.break.type.required',
    });
  }

  // Validate frequency format and threshold limit
  if (formData.allowAuto && formData.frequency) {
    const frequencyRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!frequencyRegex.test(formData.frequency)) {
      errors.frequency = intl.formatMessage({
        id: 'breaks.validation.frequency.invalid',
      });
    } else {
      // Validate threshold limit is not less than break duration
      const [hours, minutes] = formData.frequency.split(':').map(Number);
      const thresholdMinutes = (hours || 0) * 60 + (minutes || 0);
      const breakDurationMinutes =
        formData.durationUnit === Payroll_DurationUnit.Hours
          ? (formData.breakDuration || 0) * 60
          : formData.breakDuration || 0;

      if (thresholdMinutes < breakDurationMinutes) {
        errors.thresholdLimit = intl.formatMessage({
          id: 'breaks.validation.threshold.less.than.duration',
        });
      }
    }
  }

  // Validate days of week is required when auto breaks are enabled
  if (
    formData.allowAuto &&
    (!formData.daysOfWeek || formData.daysOfWeek.length === 0)
  ) {
    errors.daysOfWeek = intl.formatMessage({
      id: 'breaks.validation.days.of.week.required',
    });
  }

  // Validate notify duration (always in minutes)
  if (formData.allowManual && formData.notify) {
    if (!formData.notifyDuration || formData.notifyDuration <= 0) {
      errors.notifyDuration = intl.formatMessage({
        id: 'breaks.validation.notify.duration.required',
      });
    } else {
      // Convert break duration to minutes for comparison
      const breakDurationMinutes =
        formData.durationUnit === Payroll_DurationUnit.Hours
          ? (formData.breakDuration || 0) * 60
          : formData.breakDuration || 0;

      if (formData.notifyDuration >= breakDurationMinutes) {
        errors.notifyDuration = intl.formatMessage({
          id: 'breaks.validation.notify.duration.invalid',
        });
      }
    }
  }

  return errors;
};

const BreakPolicyForm: React.FC<BreakPolicyFormProps> = ({
  open, // not used, but kept for interface compatibility
  onClose,
  onSave,
  nameInputRef,
  onEditTeamMembers,
  setSubmitForm,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const logger = useLoggingConfig();

  const isCreateBreakOpen = useAppSelector(selectIsCreateBreakOpen);
  const isEditBreakOpen = useAppSelector(selectIsEditBreakOpen);

  // Redux state
  const formData = useAppSelector(selectFormData);
  const validationErrors = useAppSelector(selectValidationErrors);
  const hasValidationErrors = useAppSelector(selectHasValidationErrors);
  const teamMembers = useAppSelector(selectTeamMembers);
  const tempAssignments = useAppSelector(selectTempAssignments);

  const handleSubmit = useCallback(() => {
    logger.info(BREAK_LOGGING_CONSTANTS.FORM_STATE.FORM_SUBMISSION_STARTED);

    // Clear any existing validation errors
    dispatch(clearValidationErrors());

    // Validate form
    const errors = validateBreakPolicyForm(formData, intl);

    if (Object.keys(errors).length > 0) {
      logger.info(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.FORM_VALIDATION_FAILED,
        {
          errors: Object.keys(errors),
        },
      );
      dispatch(setValidationErrors(errors));
      return;
    }

    if (!formData.breakName?.trim()) return;

    logger.info(BREAK_LOGGING_CONSTANTS.FORM_STATE.FORM_VALIDATION_PASSED);

    // Parse frequency from hh:mm format and convert based on duration unit
    const parseFrequencyToThreshold = (
      frequency: string,
      durationUnit: Payroll_DurationUnit,
    ): number => {
      if (!frequency || !frequency.includes(':')) {
        return durationUnit === Payroll_DurationUnit.Hours ? 4 : 240; // Default 4 hours or 240 minutes
      }
      const [hours, minutes] = frequency.split(':').map(Number);
      const totalMinutes = (hours || 0) * 60 + (minutes || 0);

      // If duration unit is Hours, return the hours value, otherwise return total minutes
      return durationUnit === Payroll_DurationUnit.Hours
        ? hours || 0 // Return just the hours when unit is Hours
        : totalMinutes; // Return total minutes when unit is Minutes
    };

    // Calculate shiftThresholdLimit based on frequency input and duration unit
    const shiftThresholdLimit = parseFrequencyToThreshold(
      formData.frequency || '04:00',
      formData.durationUnit || Payroll_DurationUnit.Minutes,
    );

    // Construct autoRule from form data
    const autoRule: Payroll_AutoBreakRuleInput | undefined = formData.allowAuto
      ? {
          breakPosition: (() => {
            if (formData.breakLocation === BREAK_LOCATIONS.START)
              return Payroll_BreakPosition.Start;
            if (formData.breakLocation === BREAK_LOCATIONS.END)
              return Payroll_BreakPosition.End;
            if (formData.breakLocation === BREAK_LOCATIONS.SPECIFIC)
              return Payroll_BreakPosition.Specific;
            return Payroll_BreakPosition.Middle;
          })() as Payroll_BreakPosition,
          durationUnit: formData.noSetDuration
            ? undefined
            : formData.durationUnit,
          repeatBreak: formData.repeatEvery,
          shiftThresholdLimit,
          specificTime:
            formData.breakLocation === BREAK_LOCATIONS.SPECIFIC
              ? formData.specificTime
              : undefined,
          workDays: formData.daysOfWeek || [],
        }
      : undefined;

    // Construct manualRule from form data
    const manualRule: Payroll_ManualBreakRuleInput | undefined =
      formData.allowManual
        ? {
            allowEarlyEndBreak: !formData.cantEndEarly,
            autoEndBreak: formData.autoEndBreak,
            breakEndingReminder: formData.notify,
            breakEndingReminderTime: formData.notify
              ? formData.notifyDuration
              : undefined,
            minRequiredBreakMinutes: formData.noSetDuration
              ? undefined
              : formData.breakDuration,
          }
        : undefined;

    // Convert form data to Payroll_EmployerBreakInput format
    const saveData: Payroll_EmployerBreakInput = {
      breakName: formData.breakName,
      breakDuration: formData.noSetDuration
        ? undefined
        : formData.breakDuration,
      durationUnit: formData.noSetDuration ? undefined : formData.durationUnit,
      breakType: formData.breakType,
      allowAuto: formData.allowAuto,
      allowManual: formData.allowManual,
      noSetDuration: formData.noSetDuration,
      isActive: formData.isActive,
      isDefaultPolicy: formData.isDefaultPolicy,
      autoRule,
      manualRule,
    };

    onSave(saveData, tempAssignments);

    logger.info(BREAK_LOGGING_CONSTANTS.FORM_STATE.FORM_SUBMISSION_COMPLETED);

    // Clear the form state after successful save
  }, [formData, onSave, intl, dispatch, logger]);

  // Expose submit function to parent component
  useEffect(() => {
    if (setSubmitForm) {
      setSubmitForm(handleSubmit);
    }
  }, [handleSubmit, setSubmitForm]);

  return (
    <section data-testid="create-break-form-root">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* Break name */}
        <BreakNameField
          breakName={formData.breakName || ''}
          nameInputRef={nameInputRef}
          error={validationErrors.breakName}
        />

        {/* Duration */}
        <BreakDurationSection
          breakDuration={formData.breakDuration}
          durationUnit={formData.durationUnit || Payroll_DurationUnit.Minutes}
          noSetDuration={formData.noSetDuration || false}
          error={validationErrors.breakDuration}
        />

        <HorizontalRule />

        {/* Assign team members pill/button */}
        <BreakTeamMembersSection onEditTeamMembers={onEditTeamMembers} />

        <HorizontalRule />

        {/* Break type */}
        <BreakTypeRadioGroup
          breakType={formData.breakType || Payroll_Break.Paid}
        />

        <HorizontalRule />

        {/* Auto section */}
        <BreakAutoSection
          allowAuto={formData.allowAuto || false}
          frequency={formData.frequency || '04:00'}
          repeatEvery={formData.repeatEvery || false}
          daysOfWeek={formData.daysOfWeek || ''}
          breakLocation={formData.breakLocation || 'middle'}
          specificTime={formData.specificTime || '12:00'}
          noSetDuration={formData.noSetDuration || false}
          error={validationErrors.frequency || validationErrors.thresholdLimit}
        />

        {/* Manual section */}
        <BreakManualSection
          allowManual={formData.allowManual || false}
          autoEndBreak={formData.autoEndBreak || false}
          cantEndEarly={formData.cantEndEarly || false}
          notify={formData.notify || false}
          notifyDuration={formData.notifyDuration || 5}
          breakDuration={formData.breakDuration || 15}
          error={validationErrors.notifyDuration}
        />

        {/* Break type validation error */}
        {validationErrors.breakType && (
          <FormValidationError
            message={validationErrors.breakType}
            testId="break-type-validation-error"
          />
        )}

        <Button
          type="submit"
          aria-label="Save Break Rule"
          data-testid="break-save-button"
          style={{ display: 'none' }}
        />
      </form>
    </section>
  );
};

export default BreakPolicyForm;
