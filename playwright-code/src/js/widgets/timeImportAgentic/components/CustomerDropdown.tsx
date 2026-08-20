import React, { useState } from 'react';
import Widget from 'web-shell-core/widgets/HOCWidget';

export interface CustomerDropdownProps {
  value?: string;
  customerValue?: string;
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
  onCustomerCreate?: () => void; // Callback when a new customer is created
}

const CustomerDropdown: React.FC<CustomerDropdownProps> = ({
  value,
  customerValue,
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
  onCustomerCreate,
}) => {
  const [isCustomerFieldReady, setIsCustomerFieldReady] = useState(false);
  const [previousCustomerCount, setPreviousCustomerCount] = useState(0);

  const handleCustomerChange = (e: {
    selectedItem?: {
      localId: string;
      displayName: string;
    };
  }) => {
    if (onChange && e?.selectedItem) {
      onChange(e.selectedItem.localId, {
        id: e.selectedItem.localId,
        name: e.selectedItem.displayName,
      });
    } else if (onChange) {
      onChange('', undefined);
    }
  };

  // Detect when a new customer is created by watching onLoad
  const handleLoad = (data?: any) => {
    if (data && Array.isArray(data)) {
      // If the list grew, a new customer was likely created
      if (previousCustomerCount > 0 && data.length > previousCustomerCount) {
        onCustomerCreate?.();
      }
      setPreviousCustomerCount(data.length);
    }
    onLoad?.(data);
  };

  return (
    <div>
      <Widget
        widgetId="qbo-quickfills-ui/quickfills"
        type="contact"
        addNew={addNew}
        subTypes="customer"
        disabled={disabled}
        shouldShowSubLabel
        shouldShowIndentation
        value={value || ''}
        inputValue={customerValue || ''}
        displayValueKey="fullName"
        onChange={handleCustomerChange}
        onReady={() => {
          setIsCustomerFieldReady(true);
          onReady?.([]);
        }}
        onLoad={handleLoad}
        placeholder={placeholder || 'Select a customer'}
        label={label}
        errorText={errorText}
        width={width}
      />
    </div>
  );
};

export default CustomerDropdown;
