import styled from 'styled-components';
import PageMessage from '@ids-ts/page-message';

// Vertical layout for the modal body. Rendered inside the native ModalContent
// so IDS keeps its own padding/width and long copy wraps correctly.
export const ContentColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const FieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const NumberFieldWrapper = styled.div`
  width: 46px;
`;

export const CheckboxWrapper = styled.div`
  & label {
    margin-bottom: 0 !important;
  }
`;

// IDS `PageMessage type="error"` is meant to render a negative (red) border via
// its own class, but the host shell's CSS load order can let the neutral base
// wrapper border win. `&&&` pins the border to the negative token so the error
// banner matches the design deterministically across environments — mirroring
// the styled(PageMessage) pattern used elsewhere in the repo.
export const ErrorPageMessage = styled(PageMessage)`
  &&& {
    border-color: var(--color-ui-negative);
  }
`;
