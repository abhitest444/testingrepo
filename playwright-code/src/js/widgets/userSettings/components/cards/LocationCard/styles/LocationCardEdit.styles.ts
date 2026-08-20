// @ts-nocheck
import styled from 'styled-components';
import PageMessage from '@ids-ts/page-message';

export const Section = styled.div`
  margin-top: 16px;
`;

export const SectionTitle = styled.div`
  margin-bottom: 8px;
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e4e5e7;
  margin: 16px 0 16px 0;
`;

export const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e4e5e7;
`;

export const RadioGroupContainer = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
`;

export const LocationSettingsGroup = styled.div`
  margin-top: 8px;
  margin-bottom: 8px;
`;

export const RadioOptionWithLabel = styled.div<{ $disabled?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const RadioLabel = styled.span<{ $disabled?: boolean }>`
  color: ${({ $disabled }) => ($disabled ? '#9da3a8' : '#393a3d')};
  font-size: 14px;
  line-height: 20px;
  padding-top: 2px;
`;

export const CompanySettingsLink = styled.a`
  color: var(--color-link-text, #0077c5);
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const StyledPageMessage = styled(PageMessage)`
  &&& {
    margin-top: 1em;
    margin-bottom: 1em;
  }
`;

export const CustomRulesSection = styled.div`
  margin-top: 8px;
`;
