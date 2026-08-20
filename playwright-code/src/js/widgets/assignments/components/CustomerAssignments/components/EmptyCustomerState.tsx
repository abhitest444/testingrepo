import React from 'react';
import styled from 'styled-components';
import { useIntl } from '@payroll/quicksand';
import { ReactComponent as UtilityChecklistIcon } from 'src/assets/images/utility-checklist.svg';

const EmptyContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
`;

const IconWrapper = styled.div`
  margin-bottom: 24px;
`;

const EmptyCustomerState: React.FC = () => {
  const intl = useIntl();
  const text = (id: string) => intl.formatMessage({ id });

  return (
    <EmptyContent>
      <IconWrapper>
        <UtilityChecklistIcon />
      </IconWrapper>
      <h2>{text('assignments.empty.customers.title')}</h2>
      <p>{text('assignments.empty.customers.description')}</p>
    </EmptyContent>
  );
};

export default EmptyCustomerState;
