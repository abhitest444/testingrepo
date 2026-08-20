import React from 'react';
import Button from '@ids-ts/button';
import { IconControl } from '@ids-ts/icon-control';
import { B3 } from '@ids-ts/typography';
import { PersonThree } from '@design-systems/icons';
import {
  SectionContainer,
  SectionTitle,
  SectionDescription,
  WorkerAssignmentRow,
} from '../../styles/Groups/GroupDrawer.styled';

export interface AssignmentSectionProps {
  title: string;
  description?: string;
  countLabel: string;
  buttonLabel: string;
  onButtonClick: () => void;
  disabled?: boolean;
  buttonTestId?: string;
  countTestId?: string;
}

export const AssignmentSection: React.FC<AssignmentSectionProps> = ({
  title,
  description,
  countLabel,
  buttonLabel,
  onButtonClick,
  disabled = false,
  buttonTestId,
  countTestId,
}) => (
  <SectionContainer>
    <SectionTitle>{title}</SectionTitle>
    {description && (
      <SectionDescription>
        <B3>{description}</B3>
      </SectionDescription>
    )}
    <WorkerAssignmentRow>
      <IconControl
        label={countLabel}
        labelAlignment="right"
        size="medium"
        shape="circle"
        data-testid={countTestId}
      >
        <PersonThree />
      </IconControl>
      <Button
        size="small"
        priority="secondary"
        onClick={onButtonClick}
        disabled={disabled}
        data-testid={buttonTestId}
      >
        {buttonLabel}
      </Button>
    </WorkerAssignmentRow>
  </SectionContainer>
);

export default AssignmentSection;
