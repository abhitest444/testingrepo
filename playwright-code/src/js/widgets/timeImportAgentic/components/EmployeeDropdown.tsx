import React, { useState } from 'react';
import Widget from 'web-shell-core/widgets/HOCWidget';

export interface EmployeeDropdownProps {
  value?: string;
  employeeValue?: string;
  onChange?: (value: string, item?: any) => void;
  onReady?: (data?: any) => void;
  onError?: (error: Error | string) => void;
  label?: string;
  placeholder?: string;
  errorText?: string;
  onLoad?: (data?: any) => void;
  disabled?: boolean;
  addNew?: boolean;
  addNewItemProps?: {
    onClick: () => void;
  };
  width?: string;
  onEmployeeCreate?: () => void; // Callback when a new employee is created
}

const EmployeeDropdown: React.FC<EmployeeDropdownProps> = ({
  value,
  employeeValue,
  onChange,
  onReady,
  onError,
  label,
  placeholder,
  errorText,
  onLoad,
  disabled = false,
  addNew = false,
  addNewItemProps,
  width,
  onEmployeeCreate,
}) => {
  const [isEmployeeFieldReady, setIsEmployeeFieldReady] = useState(false);
  const [previousEmployeeCount, setPreviousEmployeeCount] = useState(0);

  const handleEmployeeChange = (e: {
    selectedItem?: {
      contact?: {
        id: string;
        displayName?: string;
        fullName?: string;
        type?: string;
      };
    };
  }) => {
    if (onChange && e?.selectedItem?.contact) {
      onChange(e.selectedItem.contact.id, {
        id: e.selectedItem.contact.id,
        name:
          e.selectedItem.contact.displayName ||
          e.selectedItem.contact.fullName ||
          '',
        type: e.selectedItem.contact.type || 'EMPLOYEE',
      });
    } else if (onChange) {
      onChange('', undefined);
    }
  };

  // Detect when a new employee is created by watching onLoad
  const handleLoad = (data?: any) => {
    if (data && Array.isArray(data)) {
      // If the list grew, a new employee was likely created
      if (previousEmployeeCount > 0 && data.length > previousEmployeeCount) {
        onEmployeeCreate?.();
      }
      setPreviousEmployeeCount(data.length);
    }
    onLoad?.(data);
  };

  return (
    <div>
      <Widget
        widgetId="qbo-quickfills-ui/quickfills"
        type="contact"
        addNew={addNew}
        subTypes={['employee', 'vendor']}
        disabled={disabled}
        shouldShowSubLabel
        value={value || ''}
        inputValue={employeeValue || ''}
        displayValueKey="fullName"
        onChange={handleEmployeeChange}
        onReady={() => {
          setIsEmployeeFieldReady(true);
          onReady?.([]);
        }}
        onLoad={handleLoad}
        placeholder={placeholder || 'Select an employee'}
        label={label}
        errorText={errorText}
        width={width}
        excludePayrollInactiveEmployees
      />
    </div>
  );
};

export default EmployeeDropdown;
