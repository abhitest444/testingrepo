import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';

import {
  SuccessToast,
  SuccessToastProps,
} from 'src/js/widgets/common/SuccessToast';

jest.useFakeTimers();

describe('SuccessToast', () => {
  let props: SuccessToastProps;

  beforeEach(() => {
    props = {
      message: 'toast.save.success',
      open: true,
      onClose: jest.fn(),
    };
    jest.runOnlyPendingTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    {
      open: true,
      description: 'renders toast message when open is true',
      expectInDocument: true,
    },
    {
      open: false,
      description: 'does not render toast message when open is false',
      expectInDocument: false,
    },
  ])('$description', ({ open, expectInDocument }) => {
    renderWithQuicksandProvider(<SuccessToast {...{ ...props, open }} />);

    if (expectInDocument) {
      expect(screen.getByText(/toast.save.success/)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(/toast.save.success/)).not.toBeInTheDocument();
    }
  });
});
