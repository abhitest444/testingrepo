import styled from 'styled-components';
import PageMessage from '@ids-ts/page-message';

export const SectionLabel = styled.div`
  font-size: var(--font-size-component-x-small);
  font-weight: var(--font-weight-component-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

export const PolicyName = styled.div`
  font-size: var(--font-size-component-medium);
  font-weight: var(--font-weight-component-semibold);
  color: var(--color-text-primary);
  margin-bottom: 16px;
`;

// Card section wrapper — margin between sections
export const Section = styled.div`
  margin-top: 16px;
`;

// Separator line between radio group and rule config
export const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--color-border-secondary, #e4e5e7);
  margin: 16px 0;
`;

// Footer row: Cancel + Save buttons, right-aligned, with top border
export const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-secondary, #e4e5e7);
`;

// Inline link inside radio label (matches LocationCard CompanySettingsLink)
export const CompanySettingsLink = styled.a`
  color: var(--color-link-text);
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

// PageMessage for info banner and save error — same as LocationCardEdit StyledPageMessage
export const StyledPageMessage = styled(PageMessage)`
  &&& {
    margin-top: 1em;
    margin-bottom: 1em;
  }
`;

// Wrapper for the dropdown — limits width
export const DropdownWrapper = styled.div`
  width: 100%;
  max-width: 400px;
  margin-top: 8px;
`;

export const SkeletonRow = styled.div`
  margin-bottom: 8px;
`;
