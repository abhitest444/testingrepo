import styled from 'styled-components';
import Button from '@ids-ts/button';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  padding: 48px 24px;
  text-align: center;
  background-color: #ffffff;
`;

export const Title = styled.h1`
  margin-bottom: 24px;
  color: #21262a;
  font-size: var(--font-size-heading-5);
  font-weight: var(--font-weight-heading);
  margin-top: 0;
`;

export const Description = styled.p`
  max-width: 450px;
  margin-bottom: 8px;
  color: #000000;
  font-size: var(--font-size-component-medium);
  margin-top: 0;
`;

export const LinkWrapper = styled.div`
  margin-top: 24px;
`;

export const StyledButton = styled(Button)`
  color: #0077c5 !important;

  &:hover {
    color: #0077c5 !important;
  }
`;
