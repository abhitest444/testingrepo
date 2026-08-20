import styled from 'styled-components';

export const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const DescriptionText = styled.p`
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: var(--color-text-primary, #393a3d);
  margin: 0;
`;

export const DatePickerSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 256px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const SummaryText = styled.p`
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  color: var(--color-text-primary, #393a3d);
  margin: 0;

  strong {
    font-weight: 500;
  }
`;

export const DataGridContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 16px;
  border-top: 1px solid var(--color-border-divider, #d4d7dc);
`;

export const WeekRowButton = styled.button<{ $submitted?: boolean }>`
  -webkit-appearance: none;
  appearance: none;
  display: block;
  width: 100%;
  padding: 16px;
  background: ${(props) =>
    props.$submitted
      ? 'transparent'
      : 'var(--color-container-background-secondary, #f4f5f8)'};
  border: none;
  border-top: 1px solid var(--color-border-divider, #d4d7dc);
  cursor: pointer;
  text-align: left;
  border-radius: 0;
  box-shadow: none;
  -webkit-box-shadow: none;

  &:focus {
    outline: none;
    box-shadow: none;
    -webkit-box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid var(--color-focus, #0077c5);
    outline-offset: -2px;
  }
`;

export const WeekRowContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 160px;
  column-gap: 12px;
  align-items: start;
  width: 100%;
`;

export const WeekLabelContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

export const WeekRowLabel = styled.span<{ $submitted?: boolean }>`
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: ${(props) =>
    props.$submitted
      ? 'var(--color-text-secondary, #8d9096)'
      : 'var(--color-text-primary, #393a3d)'};
`;

export const WeekRowHours = styled.span<{ $submitted?: boolean }>`
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  justify-self: start;
  text-align: left;
  color: ${(props) =>
    props.$submitted
      ? 'var(--color-text-secondary, #8d9096)'
      : 'var(--color-text-primary, #393a3d)'};
`;

export const DayRow = styled.div<{ $submitted?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 160px;
  column-gap: 12px;
  align-items: flex-start;
  padding: 20px 16px;
  color: ${(props) =>
    props.$submitted
      ? 'var(--color-text-secondary, #8d9096)'
      : 'var(--color-text-primary, #393a3d)'};
`;

export const TableHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 160px;
  column-gap: 12px;
  align-items: center;
  padding: 32px 16px 12px;
`;

export const DayLabelGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const DayLabel = styled.span`
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
`;

export const DaySubLabel = styled.span`
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: var(--color-text-secondary, #8d9096);
`;

export const DayHoursGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`;

export const DayHours = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
`;

export const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  gap: 16px;
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
`;

export const FooterActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: space-between;
  width: 100%;
`;
