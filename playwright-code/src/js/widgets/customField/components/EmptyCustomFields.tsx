import React from 'react';
import { useIntl } from '@payroll/quicksand';
import { ReactComponent as UtilityChecklistIcon } from 'src/assets/images/utility-checklist.svg';
import {
  EmptyContainer,
  IconWrapper,
  Title,
  Subtext,
} from './EmptyCustomFields.styled';

const EmptyCustomFields: React.FC = () => {
  const intl = useIntl();
  const text = (id: string) => intl.formatMessage({ id });
  return (
    <EmptyContainer>
      <IconWrapper>
        <UtilityChecklistIcon />
      </IconWrapper>
      <Title>{text('customFields.emptyCustomFields.title')}</Title>
      <Subtext>
        {text('customFields.emptyCustomFields.subtext.1')}{' '}
        <b>{text('customFields.add.button')}</b>{' '}
        {text('customFields.emptyCustomFields.subtext.2')}
      </Subtext>
    </EmptyContainer>
  );
};

export default EmptyCustomFields;
