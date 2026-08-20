import React from 'react';
import { render, screen } from '@testing-library/react';
import TimeProjectZeroState from 'src/js/widgets/timeProject/components/TimeProjectZeroState';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nlsMessages: Record<string, string> = require('src/nls/timeProject.json');

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => nlsMessages[id] || id,
  }),
}));

describe('TimeProjectZeroState', () => {
  it('should render without crashing', () => {
    const { container } = render(<TimeProjectZeroState />);
    expect(container).toBeTruthy();
  });

  it('should render the zero state container with test id', () => {
    render(<TimeProjectZeroState />);
    expect(screen.getByTestId('time-project-zero-state')).toBeInTheDocument();
  });

  it('should render the headline text', () => {
    render(<TimeProjectZeroState />);
    expect(screen.getByText('No projects')).toBeInTheDocument();
  });

  it('should render the description text', () => {
    render(<TimeProjectZeroState />);
    expect(
      screen.getByText(
        'Add projects to start creating tracking actual time versus estimated time',
      ),
    ).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(<TimeProjectZeroState />);
    expect(container).toMatchSnapshot();
  });
});
