import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';

import {
  MobileBlock,
  MobileBlockProps,
} from 'src/js/widgets/common/MobileBlock';

describe('MobileBlock Component', () => {
  let props: MobileBlockProps;

  beforeEach(() => {
    props = {
      onClose: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the component with correct text', () => {
    renderWithQuicksandProvider(<MobileBlock {...props} />);

    expect(screen.getByText(/screen.to.small.title/)).toBeInTheDocument();
    expect(screen.getByText(/screen.to.small.content/)).toBeInTheDocument();
    expect(screen.getByText(/got.it.message/)).toBeInTheDocument();
  });

  test('calls onClose when the button is clicked', () => {
    renderWithQuicksandProvider(<MobileBlock {...props} />);

    const button = screen.getByText(/got.it.message/);
    fireEvent.click(button);

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  test('button is not disabled', () => {
    renderWithQuicksandProvider(<MobileBlock {...props} />);

    const button = screen.getByText(/got.it.message/);
    expect(button).not.toBeDisabled();
  });
});
