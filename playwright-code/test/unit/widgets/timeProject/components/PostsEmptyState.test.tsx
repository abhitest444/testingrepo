import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PostsEmptyState from 'src/js/widgets/timeProject/components/PostsEmptyState';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nlsMessages: Record<string, string> = require('src/nls/timeProject.json');

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => nlsMessages[id] || id,
  }),
}));

jest.mock('@ids-ts/typography', () => ({
  H5: ({ children }: any) => <h5>{children}</h5>,
  B3: ({ children }: any) => <span>{children}</span>,
}));

jest.mock(
  '@ids-ts/button',
  () =>
    ({ onClick, 'data-testid': testId, children }: any) =>
      (
        <button type="button" onClick={onClick} data-testid={testId}>
          {children}
        </button>
      ),
);

jest.mock(
  'src/js/widgets/timeProject/components/ProjectSummary.styled',
  () => ({
    ZeroStateContainer: ({ children, 'data-testid': testId }: any) => (
      <div data-testid={testId}>{children}</div>
    ),
    ZeroStateTitle: ({ children }: any) => <div>{children}</div>,
    ZeroStateDescription: ({ children }: any) => <div>{children}</div>,
  }),
);

describe('PostsEmptyState', () => {
  it('renders the zero state container', () => {
    render(<PostsEmptyState />);
    expect(screen.getByTestId('project-posts-zero-state')).toBeInTheDocument();
  });

  it('renders the title and description', () => {
    render(<PostsEmptyState />);
    expect(
      screen.getByText('Update your team about your project'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Create a post to notify them of key updates'),
    ).toBeInTheDocument();
  });

  it('renders the Create post button', () => {
    render(<PostsEmptyState />);
    const btn = screen.getByTestId('project-posts-create-post-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Create post');
  });

  it('does nothing (and does not crash) when Create post is clicked with no handler', () => {
    render(<PostsEmptyState />);
    expect(() =>
      fireEvent.click(screen.getByTestId('project-posts-create-post-btn')),
    ).not.toThrow();
  });

  it('calls onCreatePost when provided and the button is clicked', () => {
    const onCreatePost = jest.fn();
    render(<PostsEmptyState onCreatePost={onCreatePost} />);
    fireEvent.click(screen.getByTestId('project-posts-create-post-btn'));
    expect(onCreatePost).toHaveBeenCalledTimes(1);
  });
});
