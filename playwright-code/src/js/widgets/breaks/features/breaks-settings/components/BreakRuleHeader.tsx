import React from 'react';
import { useIntl } from '@payroll/quicksand';
import { Typography } from '@ids-ts/typography';
import { Info } from '@design-systems/icons';
import {
  HeaderRow,
  AssignmentRow,
  Divider,
  EditLink,
  StyledLabel,
} from '../styles/Breaks.styled';

interface BreakRuleHeaderProps {
  onEdit?: () => void;
}

const BreakRuleHeader: React.FC<BreakRuleHeaderProps> = ({ onEdit }) => {
  const intl = useIntl();
  return (
    <>
      <HeaderRow>
        <Typography variant="headline-5">
          {intl.formatMessage({ id: 'breaks.create.details.title' })}
        </Typography>
        <AssignmentRow>
          <Info color="#0077c5" size="medium" aria-label="Info" />
          <Typography as="span" variant="body-2">
            {intl.formatMessage({ id: 'breaks.create.assignment.label' })}
          </Typography>
          <EditLink role="button" tabIndex={0} onClick={onEdit}>
            {intl.formatMessage({ id: 'breaks.create.assignment.edit' })}
          </EditLink>
        </AssignmentRow>
      </HeaderRow>
      <Divider />
    </>
  );
};

export default BreakRuleHeader;
