import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { renderWithQuicksandProvider } from 'test/unit/testUtils';
import MaintenancePage from 'src/js/common/components/MaintenancePage/MaintenancePage';

describe('MaintenancePage', () => {
  const queryRoot = (container: HTMLElement) =>
    container.querySelector('[data-automation-id="maintenance-full-page"]');

  it('renders the full-page maintenance container', () => {
    const { container } = renderWithQuicksandProvider(<MaintenancePage />);

    const root = queryRoot(container);
    expect(root).toBeTruthy();
  });

  it('renders the title, body, and thanks message IDs', () => {
    const { container } = renderWithQuicksandProvider(<MaintenancePage />);

    const root = queryRoot(container);
    // The mock intl returns the message ID, so we check for those
    expect(root?.textContent).toContain('maintenance_full_page_title');
    expect(root?.textContent).toContain('maintenance_full_page_body');
    expect(root?.textContent).toContain('maintenance_full_page_thanks');
  });

  it('renders the maintenance illustration as a decorative image', () => {
    const { container } = renderWithQuicksandProvider(<MaintenancePage />);

    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBeTruthy();
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('aria-hidden')).toBe('true');
  });

  it('exposes the appropriate aria attributes for assistive tech', () => {
    const { container } = renderWithQuicksandProvider(<MaintenancePage />);

    const root = queryRoot(container);
    expect(root?.getAttribute('role')).toBe('alert');
    expect(root?.getAttribute('aria-live')).toBe('polite');
  });

  it('matches snapshot', () => {
    const { container } = renderWithQuicksandProvider(<MaintenancePage />);
    expect(container).toMatchSnapshot();
  });
});
