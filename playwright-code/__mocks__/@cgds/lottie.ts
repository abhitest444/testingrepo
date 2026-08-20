import React from 'react';

const MockLottie = React.forwardRef<HTMLDivElement, any>((props, ref) =>
  React.createElement('div', {
    ref,
    'data-testid': 'lottie-animation',
    ...props,
  }),
);

MockLottie.displayName = 'MockLottie';

export const Lottie = MockLottie;
