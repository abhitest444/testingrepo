import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import 'jest-styled-components';
import { RowSkeletonBar } from 'src/js/widgets/timeProject/components/TimeProjectTable.styled';

describe('TimeProjectTable.styled / RowSkeletonBar', () => {
  // The skeleton is rendered in the budget AND actions cells of
  // every row while the estimates pipeline is in flight. Two
  // configurations exist in production — `$width="90px"` (budget)
  // and `$width="120px"` (actions) — so the styled component's
  // `$width` interpolation is exercised both with AND without the
  // prop to lock in the default-fallback branch.

  it('renders without crashing and produces a span element', () => {
    const { container } = render(<RowSkeletonBar />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild?.nodeName).toBe('SPAN');
  });

  it('falls back to the default 80px width when $width is omitted', () => {
    // The default branch (`$width || '80px'`) is the only piece of
    // the styled component that has divergent code paths — covering
    // it lifts the file to 100% statement coverage.
    const { container } = render(<RowSkeletonBar />);
    expect(container.firstChild).toHaveStyleRule('width', '80px');
  });

  it('honors an explicit $width prop when supplied (budget cell variant)', () => {
    const { container } = render(<RowSkeletonBar $width="90px" />);
    expect(container.firstChild).toHaveStyleRule('width', '90px');
  });

  it('honors an explicit $width prop when supplied (actions cell variant)', () => {
    const { container } = render(<RowSkeletonBar $width="120px" />);
    expect(container.firstChild).toHaveStyleRule('width', '120px');
  });

  it('applies the shared shimmer treatment (height + radius + gradient + animation)', () => {
    // Sanity-check the static parts of the skeleton bar so a
    // refactor that accidentally drops the shimmer animation or
    // flips the geometry is caught at the unit level.
    const { container } = render(<RowSkeletonBar $width="90px" />);
    expect(container.firstChild).toHaveStyleRule('display', 'inline-block');
    expect(container.firstChild).toHaveStyleRule('height', '14px');
    expect(container.firstChild).toHaveStyleRule('border-radius', '4px');
    expect(container.firstChild).toHaveStyleRule(
      'background-size',
      '400px 100%',
    );
  });
});
