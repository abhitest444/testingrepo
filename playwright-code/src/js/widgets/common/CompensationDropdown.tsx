import Dropdown, { MenuItem } from '@ids-ts/dropdown';
import { useIntl, useSandbox } from '@payroll/quicksand';
import React, {
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { TimeOffMethod } from 'src/__generated__/gas/graphql';
import { getRegion } from 'src/js/service/ApolloClientBuilderUtils';

import { useGetPayTypes } from 'src/js/service/hooks/paytypes/useGetPayTypes';
import { EntityRef } from 'src/js/widgets/common/types';
import { SingleTimeFormState } from 'src/js/widgets/singleTimeTrowser/hooks/useSingleTimeForm';

export interface CompensationDropdownProps {
  value: string;
  onChange: (value: EntityRef) => void;
  errorText?: string;
  width?: number | string;
  updateLabel?: (field: string, value: string) => void;
  timeOffMethod?: TimeOffMethod | null;
}

export const CompensationDropdown = ({
  value,
  onChange,
  errorText,
  width,
  updateLabel,
  timeOffMethod,
}: CompensationDropdownProps) => {
  const intl = useIntl();
  const { control } = useFormContext<SingleTimeFormState>();

  // Watch isApproved from form context
  const isLocked = useWatch({
    control,
    name: 'isLocked',
    defaultValue: false,
  });

  // need to be careful coupling component and form state together
  // ideally, this would be passed in as a prop ?
  const teamMemberId = useWatch({
    control,
    name: 'timeFor.id',
  });

  const sandbox = useSandbox();
  const region = getRegion(sandbox);

  const eligiblePayItems = useMemo(() => {
    const items = [
      'HOURLY_PAY',
      'SICK_PAY',
      'HOLIDAY_PAY',
      'OVERTIME',
      'DOUBLE_OVERTIME',
      'BEREAVEMENT_PAY',
      'SALARY',
      'UNPAID_TIME_OFF',
    ];
    if (!region || region !== 'CA') {
      items.push(
        'VACATION_PAY',
        'PAID_TIME_OFF',
        'EMPLOYEE_NATL_PAID_SICK_LEAVE',
        'FAMILY_NATL_PAID_SICK_LEAVE',
      );
    }
    if (region === 'CA' && timeOffMethod === TimeOffMethod.AccrualTime) {
      items.push('VACATION_PAY');
    }
    return items;
  }, [region, timeOffMethod]);

  const { data, loading, error } = useGetPayTypes({
    employeeId: teamMemberId,
  });

  const noCompensationsAvailable =
    (!loading && data && data.length === 0) || !!error || false;

  const handleOnChange = useCallback(
    (e: KeyboardEvent | MouseEvent) => {
      // @ts-ignore - Assuming e.target.value is the ID string from the Dropdown
      const selectedId = e.target.value as string;

      const selectedCompensation = data?.find(
        (compensation) => compensation.id === selectedId,
      );

      onChange({
        id: selectedId,
        name: selectedCompensation?.employerCompensation.name || '',
      });

      if (updateLabel) {
        updateLabel(
          'payType',
          selectedCompensation?.employerCompensation.name || '',
        );
      }
    },
    [data, onChange, updateLabel],
  );

  useEffect(() => {
    if (loading || !updateLabel || !data) {
      return;
    }

    if (data.length > 0 && value) {
      const selected = data.find((compensation) => compensation.id === value);
      updateLabel('payType', selected?.employerCompensation.name || '');
    } else {
      updateLabel('payType', '');
    }
  }, [data, value, loading, updateLabel]);

  const compensationMenuItems = useMemo(() => {
    if (!data) return [];
    return data
      .filter(
        (item) =>
          eligiblePayItems.includes(item.employerCompensation.type.value) &&
          item.active,
      )
      .map(({ id, employerCompensation }) => (
        <MenuItem key={id} value={id}>
          {employerCompensation.name}
        </MenuItem>
      ));
  }, [data, eligiblePayItems]);

  return (
    <Dropdown
      value={value}
      disabled={noCompensationsAvailable || isLocked}
      placeholder={intl.formatMessage({
        id: noCompensationsAvailable ? 'pay.type.none' : 'pay.type.placeholder',
      })}
      label={intl.formatMessage({ id: 'pay.type' })}
      onChange={handleOnChange}
      errorText={errorText}
      width={width}
      tabIndex={noCompensationsAvailable || isLocked ? -1 : 0}
    >
      {compensationMenuItems}
    </Dropdown>
  );
};
