import React, { useState } from 'react';
import Widget from 'web-shell-core/widgets/HOCWidget';

export interface ServiceDropdownProps {
  value?: string;
  serviceValue?: string;
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
}

const ServiceDropdown: React.FC<ServiceDropdownProps> = ({
  value,
  serviceValue,
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
}) => {
  const [isServiceFieldReady, setIsServiceFieldReady] = useState(false);

  const handleServiceChange = (e: {
    selectedItem?: {
      localId: string;
      label: string;
      traits?: {
        sale: { billable: boolean; price: number; description: string };
      };
    };
  }) => {
    if (onChange && e?.selectedItem) {
      onChange(e.selectedItem.localId, {
        id: e.selectedItem.localId,
        name: e.selectedItem.label,
      });
    } else if (onChange) {
      onChange('', undefined);
    }
  };

  return (
    <div>
      <Widget
        widgetId="qbo-quickfills-ui/quickfills"
        type="productService"
        subTypes={['SERVICE', 'NONINVENTORY']}
        value={value || ''}
        inputValue={serviceValue || ''}
        disabled={disabled}
        addNew={addNew}
        onChange={handleServiceChange}
        placeholder={placeholder || 'Select a service'}
        label={label}
        width={width}
        onReady={() => {
          setIsServiceFieldReady(true);
          onReady?.([]);
        }}
        errorText={errorText}
      />
    </div>
  );
};

export default ServiceDropdown;
