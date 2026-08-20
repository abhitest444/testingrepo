import React from 'react';
import styled from 'styled-components';
import { IconContainer } from '@ids-ts/icon-container';
import { Typography } from '@ids-ts/typography';
import { Close, ArrowLeft } from '@design-systems/icons';

interface AssignTeamMembersHeaderProps {
  onBack: () => void;
  onClose: () => void;
}

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 24px 32px 0 32px;
  border-bottom: 1px solid var(--color-divider-tertiary);
`;

const Title = styled(Typography)`
  flex: 1;
  text-align: center;
`;

const AssignTeamMembersHeader: React.FC<AssignTeamMembersHeaderProps> = ({
  onBack,
  onClose,
}) => (
  <Header>
    <IconContainer onClick={onBack} aria-label="Back">
      <ArrowLeft />
    </IconContainer>
    <Title variant="headline-5">Assign team members</Title>
    <IconContainer onClick={onClose} aria-label="Close">
      <Close />
    </IconContainer>
  </Header>
);

export default AssignTeamMembersHeader;
