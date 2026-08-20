import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  ToggleBreak,
  ToggleBreakProps,
} from 'src/js/widgets/common/addTimeFormComponents/ToggleBreak';
import { SINGLE_TIME_TRACKING_POINTS } from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

describe('ToggleBreak', () => {
  let props: ToggleBreakProps;

  beforeEach(() => {
    props = {
      name: 'togglebreak',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.TOGGLE_BREAK,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders add break button initially', () => {
    renderWithFormProvider(<ToggleBreak {...props} />);

    expect(
      screen.getByRole('button', { name: /addbreak/ }),
    ).toBeInTheDocument();
  });

  test('toggles to delete icon when add break button is clicked', () => {
    renderWithFormProvider(<ToggleBreak {...props} />);

    const addButton = screen.getByRole('button', { name: /addbreak/ });
    fireEvent.click(addButton);

    expect(screen.getByLabelText(/deletebreak/)).toBeInTheDocument();
  });

  test('toggles back to add break button when delete icon is clicked', () => {
    renderWithFormProvider(<ToggleBreak {...props} />);

    const addButton = screen.getByRole('button', {
      name: /addbreak/,
    });
    fireEvent.click(addButton);

    const deleteIcon = screen.getByLabelText(/deletebreak/);
    fireEvent.click(deleteIcon);

    expect(
      screen.getByRole('button', { name: /addbreak/ }),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /addbreak/ })).toHaveFocus();
  });
});
