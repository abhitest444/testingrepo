import styled from 'styled-components';
import { Card } from '@ids-ts/cards';

export const Wrapper = styled.div`
  max-width: 600px;
  margin: 32px 0 0 32px;
`;

export const CardWrapper = styled.div`
  margin-top: 32px;
`;

export const StyledCard = styled(Card)`
  background: var(--color-container-background-accent) !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
`;

export const CardContent = styled.div`
  padding: 32px 32px 24px 32px;
  background: var(--color-container-background-accent);
`;

export const StyledDivider = styled.hr`
  border: none;
  border-top: 2px solid var(--color-divider-tertiary);
  margin: 0;
`;

export const LowerSection = styled.div`
  padding: 24px 32px;
  display: flex;
  justify-content: flex-start;
`;

export const HoursHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const Hours = styled.div`
  display: flex;
  gap: 48px;
`;

export const HourBlock = styled.div`
  text-align: left;
`;

export const HourValue = styled.div`
  font-size: 2.5rem;
  font-weight: var(--font-weight-heading);
`;

export const AddTimeCard = styled.div`
  display: flex;
  align-items: center;
  min-width: 340px;
  max-width: 420px;
  width: 100%;
  cursor: pointer;
  padding: 24px 0;
`;

export const AddTimeIcon = styled.span`
  margin-right: 16px;
  svg {
    width: 48px;
    height: 48px;
    color: var(--color-ui-positive); /* (SemanticContextMatchOnly) */
  }
`;

export const AddTimeText = styled.span`
  display: flex;
  flex-direction: column;
`;
