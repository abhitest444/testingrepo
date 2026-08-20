import styled from 'styled-components';

export const EstimateTypeSection = styled.div`
  margin-bottom: 24px;
`;

// Full-viewport translucent veil + centered spinner shown while a
// create / edit estimate save is in flight AND while the post-save
// refetch is still settling. Positioned fixed (with a z-index above the
// IDS Drawer) so we don't have to fight the drawer's internal layout to
// place the spinner inside it.
export const SavingOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background-color: rgba(255, 255, 255, 0.6);
  z-index: 1100;
`;

export const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 12px;
`;

export const RadioOption = styled.label`
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: #f7f8f9;
  }

  &:focus {
    outline: none !important;
    border: 2px solid transparent !important;
  }
`;

export const RadioRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

export const RadioInput = styled.input`
  accent-color: #2ca01c;
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;

  /*
   * Per UX, the radio should NEVER show a focus ring - not on click, not on
   * drawer open, not even on keyboard nav. The native filled dot from
   * accent-color is the only signal of selected state. The drawer also opens
   * with autoFocus={false} so initial focus doesn't land on this input.
   *
   * Note: the wrapping <RadioOption> label remains keyboard-reachable via the
   * input's tab order and the input still receives semantic focus for
   * screen readers; we're only suppressing the visual ring.
   */
  &:focus,
  &:focus-visible {
    outline: none !important;
    box-shadow: none;
    border: 2px solid transparent !important;
  }
`;

export const RadioDescription = styled.div`
  padding-left: 26px;
  margin-top: 2px;
`;

export const HoursInputSection = styled.div`
  margin-top: 24px;
`;

export const InputWrapper = styled.div`
  max-width: 280px;
  margin-top: 12px;
`;

export const FooterContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

export const ErrorContainer = styled.div`
  margin-bottom: 16px;
`;

export const ServiceItemSection = styled.div`
  margin-top: 24px;
`;

export const ServiceItemInputRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 12px;
`;

export const DropdownWrapper = styled.div`
  flex: 1;
  min-width: 0;

  /*
   * Constrain the popup menu to the dropdown's own width and let long
   * service item names wrap rather than overflow horizontally. We target
   * common menu containers/items rendered by @ids-ts/dropdown-typeahead.
   */
  [role='listbox'],
  [role='menu'],
  [class*='Dropdown__menu'],
  [class*='Dropdown__list'] {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
  }

  [role='option'],
  [role='menuitem'],
  [class*='MenuItem'],
  li {
    white-space: normal !important;
    overflow-wrap: anywhere;
    word-break: break-word;
    line-height: 1.3;
  }
`;

export const HoursFieldWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ServiceItemTable = styled.table`
  width: 100%;
  margin-top: 16px;
  border-collapse: collapse;
`;

export const TableHeader = styled.th`
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  font-size: 14px;
  color: #393a3d;
  &:last-child {
    text-align: right;
  }
`;

export const TableCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 14px;
  &:last-child {
    text-align: right;
  }
`;

export const TotalRow = styled.tr`
  background-color: #f2f6f2;
`;

export const TotalCell = styled.td`
  padding: 14px 12px;
  font-weight: 600;
  font-size: 14px;
`;

export const ActionWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

export const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b6c72;
  &:hover {
    color: #393a3d;
  }
`;

export const ActionMenu = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 100px;
`;

export const ActionMenuItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background-color: #f5f5f5;
  }
`;

export const InlineEditWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const InlineEditInput = styled.input<{ $hasError?: boolean }>`
  width: 80px;
  padding: 4px 8px;
  font-size: 14px;
  border: 1px solid ${({ $hasError }) => ($hasError ? '#d52b1e' : '#babec5')};
  border-radius: 4px;
  &:focus {
    outline: none;
    border-color: ${({ $hasError }) => ($hasError ? '#d52b1e' : '#0077c5')};
  }
`;

export const InlineEditError = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #d52b1e;
`;

export const InlineEditButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  color: #0077c5;
  &:hover {
    text-decoration: underline;
  }
  &:disabled {
    color: #babec5;
    cursor: default;
    text-decoration: none;
  }
`;
