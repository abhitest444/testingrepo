import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';

import {
  WeeklyCopyLastWeekModal,
  WeeklyCopyLastWeekModalProps,
} from 'src/js/widgets/common/WeeklyCopyLastWeekModal';

describe('WeeklyCopyLastWeekModal', () => {
  let props: WeeklyCopyLastWeekModalProps;

  beforeEach(() => {
    props = {
      open: false,
      onCancel: jest.fn(),
      onOverwrite: jest.fn(),
      onAdd: jest.fn(),
      onClose: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    {
      open: true,
      description: 'renders modal content when open',
      expectedLength: 2,
    },
    {
      open: false,
      description: 'does not render modal content when closed',
      expectedLength: 0,
    },
  ])('should $description', ({ open, expectedLength }) => {
    renderWithQuicksandProvider(
      <WeeklyCopyLastWeekModal {...{ ...props, open }} />,
    );
    expect(
      screen.queryAllByTestId('time-tracking-weekly-copy-last-week-modal'),
    ).toHaveLength(expectedLength);
  });

  it('should call onCancel when the cancel button is clicked', () => {
    renderWithQuicksandProvider(
      <WeeklyCopyLastWeekModal {...{ ...props, open: true }} />,
    );
    fireEvent.click(screen.getByText(/cancel/i));
    expect(props.onCancel).toHaveBeenCalled();
  });

  it('should call onOverwrite when the overwrite button is clicked', () => {
    renderWithQuicksandProvider(
      <WeeklyCopyLastWeekModal {...{ ...props, open: true }} />,
    );
    fireEvent.click(screen.getByText(/overwrite/i));
    expect(props.onOverwrite).toHaveBeenCalled();
  });

  it('should call onAdd when the add button is clicked', () => {
    renderWithQuicksandProvider(
      <WeeklyCopyLastWeekModal {...{ ...props, open: true }} />,
    );
    fireEvent.click(screen.getByText(/add/i));
    expect(props.onAdd).toHaveBeenCalled();
  });

  // it('should call onClose when the modal is closed', () => {
  //   setup(true);
  //   fireEvent.keyDown(
  //     screen.getAllByTestId('time-tracking-weekly-copy-last-week-modal')[0],
  //     { key: 'Escape', code: 'Escape', keyCode: 27, charCode: 27 },
  //   );
  //   expect(onClose).toHaveBeenCalled();
  // });
});
