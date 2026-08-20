import React from 'react';

/** Jest mock for `@cgds/skeleton`; mirrors the lottie mock pattern. */
const MockSkeleton = React.forwardRef<HTMLDivElement, any>((props, ref) =>
  React.createElement('div', {
    ref,
    'data-testid': 'skeleton',
    ...props,
  }),
);

MockSkeleton.displayName = 'MockSkeleton';

export const Skeleton = MockSkeleton;
