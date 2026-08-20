import styled from 'styled-components';

export const SummaryContainer = styled.div`
  padding: 0;
`;

export const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: 12px;
  color: #393a3d;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

export const SummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
`;

export const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

export const MetaCustomerName = styled.span`
  color: #6b6b6b;
`;

// Clickable variant of `MetaCustomerName`. Rendered as a real
// `<button>` (not an `<a>`) because navigation goes through the host's
// `sandbox.navigation.navigate` API rather than a static URL, so an
// `<a href>` would open the wrong route on middle-click / right-click
// "open in new tab".
//
// Styled to read as a blue IDS link without an underline. The
// `:hover` / `:active` / `:focus` rules explicitly clear the default
// button background, because some host themes (and IDS's global
// button reset) paint a light-green hover fill on bare `<button>`
// elements that bleeds through the default styled-component cascade.
export const MetaCustomerNameLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: #0077c5;
  cursor: pointer;
  text-decoration: none;

  &:hover,
  &:active,
  &:focus {
    background: none;
    text-decoration: none;
    color: #0077c5;
    border: none !important;
    outline: none !important;
  }
`;

export const MetaDivider = styled.span`
  width: 1px;
  height: 16px;
  background-color: #c0c1c2;
`;

export const SummaryTabContainer = styled.div`
  margin-bottom: 24px;

  [role='tabpanel'] {
    padding-top: 10px !important;
  }
`;

export const SectionHeader = styled.div`
  margin-bottom: 16px;
`;

export const SummaryBoxesRow = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
`;

export const SummaryBox = styled.div<{ $fullWidth?: boolean }>`
  flex: ${({ $fullWidth }) => ($fullWidth ? '1 1 100%' : '1')};
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px 24px;
`;

export const SummaryBoxTitle = styled.div`
  margin-bottom: 16px;
`;

export const SummaryBoxValue = styled.div`
  margin-bottom: 4px;
`;

export const SummaryBoxSubtext = styled.div<{
  $isOverdue?: boolean;
  // When `true`, the element keeps its line-height + margin so the
  // surrounding card layout doesn't shift, but the text content is
  // visually hidden. Used by the hours card when the
  // remaining/overdue line shouldn't surface (unestimated project,
  // or `estimate = 0` with `worked = 0`) AND by the date card which
  // intentionally never shows its remaining/overdue copy — both still
  // need the slot occupied so the two cards stay vertically aligned
  // next to each other.
  $invisible?: boolean;
}>`
  color: ${({ $isOverdue }) => ($isOverdue ? '#E56C1D' : '#2CA01C')};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  ${({ $invisible }) => $invisible && 'visibility: hidden;'}
`;

export const SummaryBoxRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const MeterBarWrapper = styled.div`
  margin-top: 8px;

  [data-testid='meter-bar-chart'] {
    width: 100%;
  }

  [data-testid='meter-bar-chart'] > div:first-child {
    width: 100%;
  }

  [data-testid*='meter-bar-segment-'] {
    height: 10px;
  }

  [data-testid*='meter-bar-segment-']:last-child {
    margin-right: 0;
  }
`;

export const EditLink = styled.button`
  display: inline-block;
  margin-top: 12px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #0077c5;

  &:hover {
    text-decoration: underline;
  }
`;

export const DateProgressRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
`;

export const ToggleContainer = styled.div`
  margin: 8px 0 24px;
`;

export const AlignRight = styled.div`
  text-align: right;
`;

export const AssignmentChipsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  /* Pill-style chrome around the workers IconControl so it reads as
   * a tappable count chip in the summary meta row rather than a bare
   * icon button. Scoped by data-testid so we don't restyle any other
   * IconControl that ends up inside this row. */
  [data-testid='assignment-chip-workers'] {
    background: rgba(107, 108, 114, 0.1);
    padding: 5px 7px;
    border-radius: 20px;
  }
`;

export const PlaceholderTable = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 48px 24px;
  text-align: center;
  color: #6b6c72;
`;

export const ZeroStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
`;

export const ZeroStateTitle = styled.div`
  margin-bottom: 8px;
`;

export const ZeroStateDescription = styled.div`
  color: #6b6c72;
  margin-bottom: 24px;
  max-width: 480px;
`;
