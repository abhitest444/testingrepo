import React from 'react';
import styled from 'styled-components';

const StyledHR = styled.hr`
  border: 0;
  border-top: 1px solid var(--color-divider-secondary);
  margin: 32px 0;

  @media (max-width: 768px) {
    margin: 20px 0;
  }
`;

export const HorizontalRule = () => <StyledHR />;
