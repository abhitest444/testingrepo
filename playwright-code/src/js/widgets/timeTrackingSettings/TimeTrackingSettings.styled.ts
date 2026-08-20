import Typography, { B2 } from '@ids-ts/typography';
import PageMessage from '@ids-ts/page-message';
import styled from 'styled-components';

export const ConfirmationModalContent = styled(Typography)`
  display: block;
  line-height: 130%;
  margin-top: 16px;
`;

export const ErrorOrWarningMessage = styled(PageMessage)`
  margin-bottom: 12px;
`;
