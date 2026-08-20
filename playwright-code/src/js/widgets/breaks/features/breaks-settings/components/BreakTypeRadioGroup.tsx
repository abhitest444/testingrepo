import React, { useCallback } from 'react';
import { useIntl } from '@payroll/quicksand';
import { Typography } from '@ids-ts/typography';
import { RadioGroup } from '@ids-ts/radio';
import { Payroll_Break } from 'src/__generated__/oigql/graphql';
import { useAppDispatch } from 'src/js/widgets/breaks/store/hooks';
import { updateBreakType } from 'src/js/widgets/breaks/store/breakPolicyFormSlice';
import { FormSection } from '../styles/Breaks.styled';

interface BreakTypeRadioGroupProps {
  breakType: Payroll_Break;
}

const BreakTypeRadioGroup: React.FC<BreakTypeRadioGroupProps> = ({
  breakType,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const handleBreakTypeChange = useCallback(
    (e: any) => {
      dispatch(updateBreakType(e.target.value as Payroll_Break));
    },
    [dispatch],
  );

  return (
    <FormSection>
      <RadioGroup
        label={
          <Typography variant="body-2">
            {intl.formatMessage({ id: 'breaks.create.type.label' })}
          </Typography>
        }
        options={[
          {
            label: intl.formatMessage({ id: 'breaks.create.type.paid' }),
            value: Payroll_Break.Paid,
          },
          {
            label: intl.formatMessage({ id: 'breaks.create.type.unpaid' }),
            value: Payroll_Break.Unpaid,
          },
        ]}
        value={breakType || Payroll_Break.Paid}
        onChange={handleBreakTypeChange}
        name="break-type"
        size="medium"
        aria-label={intl.formatMessage({ id: 'breaks.create.type.label' })}
      />
    </FormSection>
  );
};

export default BreakTypeRadioGroup;
