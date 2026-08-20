import styled from 'styled-components';
import { Table } from '@ids-ts/table';
import PageMessage from '@ids-ts/page-message';

export const Container = styled.div`
  padding: 110px;
  padding-top: 20px;
  padding-bottom: 20px;
`;

export const HeaderContainer = styled.div`
  margin-bottom: 14px;
  h2 {
    font-weight: 600;
  }
`;

export const DescriptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
`;

export const LinkContainer = styled.div`
  display: flex;
  align-items: center;
  color: var(--color-link-text);
  gap: 8px;
  cursor: pointer;
  font-weight: var(--font-weight-component-semibold);
  text-decoration: none;

  a {
    text-decoration: none !important;
  }
`;

export const Description = styled.p`
  margin-bottom: 8px;
`;

export const ButtonContainer = styled.div`
  margin-bottom: 24px;
  display: flex;
  justify-content: flex-end;
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

export const RequiredContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const EditLink = styled.a`
  color: var(--color-link-text);
  text-decoration: none;
  cursor: pointer;
  font-weight: var(--font-weight-component-semibold);
  text-decoration: none !important;
`;

export const StyledEditLink = styled(EditLink)<{ isActive: boolean }>`
  color: ${({ isActive }) =>
    isActive ? 'var(--color-link-text)' : 'var(--color-text-secondary)'};
  cursor: ${({ isActive }) => (isActive ? 'pointer' : 'not-allowed')};
`;

export const StyledTable = styled(Table)`
  margin-top: 20px;
  thead th,
  [role='columnheader'] {
    text-transform: none !important;
    font-size: var(--font-size-component-small);
  }
`;

export const PaginationContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
`;

export const StyledPageMessage = styled(PageMessage)`
  &&& {
    align-items: flex-start;
    margin: 0 107px 1em 107px;
    flex: 0 1 auto;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  h2,
  h3,
  h4 {
    font-size: var(--font-size-component-large) !important;
    font-weight: 600;
  }
  svg {
    position: relative;
    top: 5px;
  }
`;

export const CenteredErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 200px;
`;

export const OptionRow = styled(Table.Row)``;

export const IndentedCell = styled(Table.Cell)`
  padding-left: 38px !important;
`;

export const AssignmentLink = styled.span<{ $isActive?: boolean }>`
  color: ${({ $isActive }) => ($isActive ? '#0077c4' : '#6b7280')};
  cursor: ${({ $isActive }) => ($isActive ? 'pointer' : 'default')};
  font-size: 14px;
`;

export const ErrorMessageContainer = styled.div`
  margin-bottom: 16px;
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const ActionsHeaderCell = styled(Table.Cell)`
  text-align: right;
`;
