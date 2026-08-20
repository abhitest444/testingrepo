import React, { useState } from 'react';
import Widget from 'web-shell-core/widgets/HOCWidget';

export interface LocationDropdownProps {
  value?: string;
  locationValue?: string;
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

const LocationDropdown: React.FC<LocationDropdownProps> = ({
  value,
  locationValue,
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
  const [isLocationFieldReady, setIsLocationFieldReady] = useState(false);

  const handleLocationChange = (e: {
    selectedItem?: {
      localId: string;
      fullName: string;
    };
  }) => {
    if (onChange && e?.selectedItem) {
      onChange(e.selectedItem.localId, {
        id: e.selectedItem.localId,
        name: e.selectedItem.fullName,
      });
    } else if (onChange) {
      onChange('', undefined);
    }
  };

  return (
    <div>
      <Widget
        widgetId="qbo-quickfills-ui/quickfills"
        type="locationV2"
        value={value || ''}
        inputValue={locationValue || ''}
        disabled={disabled}
        addNew={addNew}
        onChange={handleLocationChange}
        placeholder={placeholder || 'Select a location'}
        label={label}
        width={width}
        onReady={() => {
          setIsLocationFieldReady(true);
          onReady?.([]);
        }}
        errorText={errorText}
      />
    </div>
  );
};

export default LocationDropdown;
