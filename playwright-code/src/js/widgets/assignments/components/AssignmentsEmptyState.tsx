import React from 'react';
import GroupWorkersImage from 'src/assets/images/GroupWorkers.svg';
import {
  EmptyStateWrapper,
  EmptyStateImage,
  EmptyStateTitle,
  EmptyStateDescription,
} from './styles/AssignmentsEmptyState.styled';

export interface AssignmentsEmptyStateProps {
  /** Primary heading (e.g. "No groups yet") */
  title: React.ReactNode;
  /** Secondary description text */
  description: React.ReactNode;
  /** CTA: button or dropdown (e.g. Create group button or Add worker dropdown) */
  action: React.ReactNode;
}

/**
 * Reusable empty state for Assignments views (groups list, workers list).
 * Renders a centered layout: shared GroupWorkers image, title, description, and an action (button or dropdown).
 */
export const AssignmentsEmptyState: React.FC<AssignmentsEmptyStateProps> = ({
  title,
  description,
  action,
}) => (
  <EmptyStateWrapper>
    <EmptyStateImage src={GroupWorkersImage} alt="" aria-hidden />
    <EmptyStateTitle>{title}</EmptyStateTitle>
    <EmptyStateDescription>{description}</EmptyStateDescription>
    {action}
  </EmptyStateWrapper>
);
