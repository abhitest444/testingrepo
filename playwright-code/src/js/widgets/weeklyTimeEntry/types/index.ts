// to be updated once integrated with API
export interface CustomerProject {
  defaultValue: {
    value: string;
    label: string;
  };
}

export interface HeaderData {
  label: string;
  value: string;
  width?: number;
  height?: number;
  paddingLeft?: string;
  hasError?: boolean;
}

export interface CellData {
  id: string;
  value: string | number;
}

export interface WeeklyTimeEntryTrowserProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  // Optional data props for when data is passed from parent
  settingsData?: any;
  currentWeek?: any;
  isLoading?: boolean;
  error?: any;
  refetch?: () => void;
}

export enum TimeForType {
  EMPLOYEE = 'EMPLOYEE',
  VENDOR = 'VENDOR',
  LEGACY_QBO_USER = 'LEGACY_QBO_USER',
}

// Widget event types
export interface WidgetChangeEvent {
  selectedItem?: {
    contact?: {
      id: string;
      displayName?: string;
      fullName?: string;
      type: string;
    };
    label?: string;
  };
}

export interface ClassWidgetChangeEvent {
  selectedItem?: {
    id: string;
    displayName: string;
  };
}

export interface ServiceWidgetChangeEvent {
  selectedItem?: {
    localId: string;
    fullName: string;
  };
}

export interface LocationWidgetChangeEvent {
  selectedItem?: {
    localId: string;
    fullName: string;
  };
}

export interface CopyModalState {
  open: boolean;
  type: 'current-user' | 'customers-and-breaks';
}
