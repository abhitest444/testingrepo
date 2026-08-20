import React from 'react';
import { useIntl } from '@payroll/quicksand';
import { ReactComponent as UtilityChecklistIcon } from 'src/assets/images/utility-checklist.svg';
import {
  EmptyContainer,
  IconWrapper,
  Title,
  Subtext,
} from '../styles/EmptyBreakRules.styled';

const EmptyBreakRules: React.FC = () => {
  const intl = useIntl();
  const text = (id: string) => intl.formatMessage({ id });
  return (
    <EmptyContainer>
      <IconWrapper>
        <UtilityChecklistIcon />
      </IconWrapper>
      <Title>{text('breaks.emptyBreakRules.title')}</Title>
      <Subtext>
        {text('breaks.emptyBreakRules.subtext.1')}{' '}
        <b>{text('breaks.preferences.add.button')}</b>{' '}
        {text('breaks.emptyBreakRules.subtext.2')}
      </Subtext>
    </EmptyContainer>
  );
};

export default EmptyBreakRules;
