import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { HorizontalRule } from 'src/js/widgets/common/HorizontalRule';

describe('HorizontalRule', () => {
  test('renders correctly', () => {
    const { container } = render(<HorizontalRule />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
