import styled from 'styled-components';

/**
 * Shared empty state layout for Assignments (e.g. No groups yet, No workers yet).
 * Used by AssignmentsEmptyState component.
 */

export const EmptyStateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 24px;
  min-height: 200px;
  width: 100%;
  text-align: center;
`;

export const EmptyStateImage = styled.img`
  display: block;
  padding-bottom: 36px;
`;

export const EmptyStateTitle = styled.div`
  font-weight: 600;
  font-size: 20px;
  line-height: 28px;
`;

export const EmptyStateDescription = styled.div`
  font-size: 14px;
  line-height: 20px;
  padding-bottom: 36px;
`;
