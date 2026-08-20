// @ts-nocheck
import React from 'react';
import { render } from '@testing-library/react';
import 'jest-styled-components';

import { ViewContent } from '../viewContent';

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({
      id,
      defaultMessage,
    }: {
      id: string;
      defaultMessage?: string;
    }) => id || defaultMessage || '',
  }),
  useSandbox: () => ({ logger: { info: jest.fn(), error: jest.fn() } }),
}));

jest.mock('@ids-ts/badge', () => {
  const Badge = ({ children }: any) => (
    <span data-testid="badge">{children}</span>
  );
  return {
    __esModule: true,
    default: Badge,
    WarningBadgeIcon: () => <svg data-testid="warning-icon" />,
  };
});

jest.mock('@ids-ts/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock('@design-systems/icons', () => ({
  Plus: () => <svg data-testid="plus-icon" />,
}));

jest.mock('src/assets/images/Link.svg', () => ({
  ReactComponent: () => <svg data-testid="link-icon" />,
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  canEditPreference: () => true,
}));

jest.mock('src/js/hooks/useRenderTitleWithBadge', () => ({
  renderTitleWithBadge: ({ title }: { title: string }) => title,
}));

const makeHeader = (key: string, title: string) => ({
  id: `${key}-id`,
  key,
  title,
  ariaLabel: title,
  tooltipText: '',
  disabled: false,
  detail: { title: '', subtitle: '', ariaLabel: '' },
  value: '',
  isEditable: false,
  isVisible: true,
  automationId: `${key}-header`,
});

const makeRow = (key: string, title: string, value: string) => ({
  id: `${key}-id`,
  key,
  title,
  ariaLabel: title,
  tooltipText: '',
  disabled: false,
  detail: { title: '', subtitle: '', ariaLabel: '' },
  value,
  isVisible: true,
  automationId: `${key}-row`,
});

const getGeneratedCss = (container: HTMLElement): string => {
  const styleTags = document.head.querySelectorAll('style');
  return Array.from(styleTags)
    .map((s) => s.textContent || '')
    .join('\n');
};

describe('ViewContent — first-row top padding', () => {
  test('FlexColumnContainer emits a first-child rule that zeroes padding-top for the first row', () => {
    const formFields = {
      sectionA: [
        makeHeader('sectionA-header', 'Section A'),
        makeRow('row1', 'Label 1', 'Value 1'),
      ],
      sectionB: [
        makeHeader('sectionB-header', 'Section B'),
        makeRow('row2', 'Label 2', 'Value 2'),
      ],
    };

    const { container } = render(<ViewContent formFields={formFields} />);
    const css = getGeneratedCss(container);

    expect(css).toMatch(
      /:first-child[^{]*:first-child[^{]*\{[^}]*padding-top:\s*0/,
    );
  });

  test('StyledRow base rule still declares padding: 8px 0', () => {
    const formFields = {
      sectionA: [makeRow('row1', 'Label 1', 'Value 1')],
    };

    render(<ViewContent formFields={formFields} />);
    const css = Array.from(document.head.querySelectorAll('style'))
      .map((s) => s.textContent || '')
      .join('\n');

    expect(css).toMatch(/padding:\s*8px\s+0/);
  });

  test('renders multiple sections without crashing when first row is a non-header row', () => {
    const formFields = {
      sectionA: [makeRow('row1', 'Label 1', 'Value 1')],
      sectionB: [makeRow('row2', 'Label 2', 'Value 2')],
    };

    const { container } = render(<ViewContent formFields={formFields} />);
    expect(container.firstChild).toBeTruthy();
  });
});
