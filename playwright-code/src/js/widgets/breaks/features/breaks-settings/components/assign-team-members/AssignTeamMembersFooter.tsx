import React from 'react';
import styled from 'styled-components';
import { Button } from '@ids-ts/button';

interface AssignTeamMembersFooterProps {
  onCancel: () => void;
  onSave: () => void;
}

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 32px;
  border-top: 1px solid var(--color-container-border-tertiary); /* SemanticContextMatchOnly */
  background: var(--color-container-background-primary);
`;

const AssignTeamMembersFooter: React.FC<AssignTeamMembersFooterProps> = ({
  onCancel,
  onSave,
}) => (
  <Footer>
    <Button priority="secondary" onClick={onCancel} style={{ minWidth: 100 }}>
      Cancel
    </Button>
    <Button priority="primary" onClick={onSave} style={{ minWidth: 100 }}>
      Save
    </Button>
  </Footer>
);

export default AssignTeamMembersFooter;
