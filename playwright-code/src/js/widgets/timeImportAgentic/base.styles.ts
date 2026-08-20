import styled, { createGlobalStyle } from 'styled-components';

// Global styles for checkbox override
export const TimeImportAgenticGlobalStyles = createGlobalStyle`
  /* Trowser section – remove padding from inner div */
  section[data-automation-id="trowser_section"] > div {
    padding: 0 !important;
  }

  /* Checkbox styling - override to dark green using actual rendered classes */
  
  /* Target the checked container - change colors and add border-radius */
  [data-component="timeImportAgentic"] span[class*="RcCheckbox-containerChecked"],
  div[data-component="timeImportAgentic"] span[class*="RcCheckbox-containerChecked"] {
    background-color: rgb(0, 62, 49) !important;
    border-color: rgb(0, 62, 49) !important;
    border-radius: 5px !important;
  }

  /* Target the inner checkbox wrapper when checked - change colors and add border-radius */
  [data-component="timeImportAgentic"] span[class*="RcCheckbox-innerCheckboxChecked"],
  div[data-component="timeImportAgentic"] span[class*="RcCheckbox-innerCheckboxChecked"] {
    background-color: rgb(0, 62, 49) !important;
    border-color: rgb(0, 62, 49) !important;
    border-radius: 5px !important;
  }

  /* Target the indeterminate state (group checkbox) - change colors and add border-radius */
  [data-component="timeImportAgentic"] span[class*="RcCheckbox-innerCheckboxIndeterminate"],
  div[data-component="timeImportAgentic"] span[class*="RcCheckbox-innerCheckboxIndeterminate"] {
    background-color: rgb(0, 62, 49) !important;
    border-color: rgb(0, 62, 49) !important;
    border-radius: 5px !important;
  }

  /* Target the label wrapper for margin and padding */
  [data-component="timeImportAgentic"] label[class*="Checkbox-labelWrapper"],
  div[data-component="timeImportAgentic"] label[class*="Checkbox-labelWrapper"] {
    margin: 0 !important;
    padding: 5px 0 !important;
  }

  /* Make sure checkmark is white */
  [data-component="timeImportAgentic"] span[class*="RcCheckbox-containerChecked"] svg,
  div[data-component="timeImportAgentic"] span[class*="RcCheckbox-containerChecked"] svg,
  [data-component="timeImportAgentic"] span[class*="RcCheckbox-innerCheckboxChecked"] svg,
  div[data-component="timeImportAgentic"] span[class*="RcCheckbox-innerCheckboxChecked"] svg,
  [data-component="timeImportAgentic"] span[class*="RcCheckbox-innerCheckboxIndeterminate"] svg,
  div[data-component="timeImportAgentic"] span[class*="RcCheckbox-innerCheckboxIndeterminate"] svg {
    color: white !important;
    fill: white !important;
  }

  /* Also target via parent label - change colors and add border-radius */
  [data-component="timeImportAgentic"] label[class*="Checkbox-labelWrapper"] span[class*="Checked"],
  div[data-component="timeImportAgentic"] label[class*="Checkbox-labelWrapper"] span[class*="Checked"] {
    background-color: rgb(0, 62, 49) !important;
    border-color: rgb(0, 62, 49) !important;
    border-radius: 5px !important;
  }
`;

// Common Layout Components
export const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const StepHeader = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
`;

export const CardContainer = styled.div`
  flex: 1;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 0;
  background-color: white;
`;

export const InnerCardContainer = styled.div`
  padding: 20px;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

export const IconCircle = styled.div<{ backgroundColor?: string }>`
  width: 32px;
  height: 32px;
  background-color: ${(props) => props.backgroundColor || '#4A90E2'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Upload Components
export const UploadRow = styled.div`
  display: flex;
  gap: 16px;
`;

export const UploadCard = styled.div<{ selected?: boolean }>`
  flex: 1;
  border: ${(props) =>
    props.selected ? '2px solid #4A90E2' : '2px dashed #e1e5e9'};
  border-radius: 8px;
  padding: 40px 20px;
  background-color: ${(props) => (props.selected ? '#f8f9ff' : 'white')};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  position: relative;
  height: 50vh;
`;

export const UploadIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
`;

export const UploadStatusContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 24px;
`;

export const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background-color: #f8f9ff;
  border-radius: 8px;
  border: 1px solid #e1e5e9;
`;

export const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #4a90e2;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
`;

// Keyframes
export const spin = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
