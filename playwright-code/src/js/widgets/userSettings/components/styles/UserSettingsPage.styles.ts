import styled from 'styled-components';
import { Card } from '@ids-ts/cards';

// Main page container with full width layout and scrolling
export const Page = styled.div`
  width: 100%;
  max-width: none;
  padding: 24px;
  box-sizing: border-box;
  min-height: 100%;
  overflow-y: auto;
`;

// Top section containing breadcrumbs and user information
export const TopSection = styled.div`
  padding: 16px 24px 24px 24px;
  margin: -24px -24px 0 -24px;
  margin-bottom: 8px;
`;

// Navigation breadcrumb styling with links and separators
export const Breadcrumbs = styled.nav`
  margin-bottom: 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;

  a {
    color: var(--color-link-text);
    text-decoration: none;
    cursor: pointer;
    font-weight: var(--font-weight-component-semibold);

    &:hover {
      text-decoration: underline;
    }
  }

  span {
    color: var(--color-text-secondary);
  }
`;

// Container for user name and subtitle information
export const UserInfo = styled.div`
  margin-bottom: 8px;
  margin-top: 16px;
`;

export const PageSubtitle = styled.div`
  color: var(--color-text-secondary);
  margin-top: 8px;
`;

// Styled breadcrumb link component
export const BreadcrumbLink = styled.a`
  color: var(--color-link-text);
  text-decoration: none;
  cursor: pointer;
  font-weight: var(--font-weight-component-semibold);

  &:hover {
    text-decoration: underline;
  }
`;

// Grid layout for settings cards
export const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

// Styled card component for notifications settings with full width and rounded corners
export const SettingsCard = styled(Card)`
  padding: 0;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  min-height: auto !important;
  border-radius: var(--radius-large) !important;
`;

// Card body with consistent padding
export const CardBody = styled.div`
  padding: 24px;
`;
