// Basic types for quickFind widget

import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import { labelPreferenceRef } from 'src/js/widgets/common/types';

export enum ContactType {
  Employee = DataAccess_ContactType.Employee,
  Vendor = DataAccess_ContactType.Vendor,
}

export interface QuickFindProps {
  width?: string;
  dropdownType?: QuickFindDropdownType;
  subTypes?: ContactType[]; // For team-member: ['employee', 'vendor'], for others: specific types
  // Callback props
  onChange?: (value: string, item?: any) => void;
  onReady?: (data?: any) => void;
  onError?: (error: Error | string) => void;
  onLoad?: (data?: any) => void;
  value?: any;
  // Display props
  label?: string;
  placeholder?: string;
  errorText?: string;
  displayName?: string; // Pre-populated display name for the selected value
  filters?: {
    subtypes: {
      [K in ContactType]: {
        [key: string]: any;
      };
    };
  };
  // When set, dropdowns use these options and skip SFO fetch (caller owns the data)
  preloadedServiceOptions?: ServiceItem[] | null;
  preloadedClassOptions?: ClassItem[] | null;
  preloadedLocationOptions?: LocationItem[] | null;
  /** When true and exactly one item is loaded with no current selection, auto-select it */
  autoSelect?: boolean;
  /** WTE only: id of the selected cell (e.g. `${rowId}-${dayIdx}`). When it changes, re-arm single-option auto-select for the newly selected cell. Unset or null for STE. */
  autoSelectKey?: string | null;
}

// Dropdown types
export type QuickFindDropdownType =
  | 'team-member'
  | 'customer'
  | 'service'
  | 'class'
  | 'location';

export interface TeamMember {
  id: string;
  name: string;
  type: ContactType;
}

// Base dropdown props that all dropdowns will share
export interface BaseDropdownProps extends QuickFindProps {
  value?: string;
  disabled?: boolean;
  addNew?: boolean;
}

// Specific props for team member dropdown
export interface TeamMemberDropdownProps extends BaseDropdownProps {}

// Props for service dropdown
export interface ServiceDropdownProps extends BaseDropdownProps {
  timeForEntityId?: string; // Worker ID for service assignment filtering
  customerId?: string; // Customer ID for service assignment filtering
  projectId?: string; // Project ID for service assignment filtering
  assignmentFilters?: {
    assigned?: boolean; // For assignment filtering: true = assigned only, undefined = all
  };
  /** When provided, use these options and skip SFO fetch */
  preloadedOptions?: ServiceItem[] | null;
  /** When provided with preloadedOptions, call SFO again with searchText (debounced); pass null when no text */
  onSearchService?: (searchText: string | null) => void;
  /** When using preloadedOptions, parent provides infinite scroll */
  hasMoreService?: boolean;
  loadMoreService?: () => void;
  /** Pre-populated display name from serviceItemDAS — shown when selected item is not in the loaded page */
  displayName?: string;
  /** When true and exactly one service item is loaded with no current selection, auto-select it */
  autoSelect?: boolean;
  /** WTE only: id of the selected cell (e.g. `${rowId}-${dayIdx}`). When it changes, re-arm single-option auto-select for the newly selected cell. Unset or null for STE. */
  autoSelectKey?: string | null;
}

// Props for class dropdown
export interface ClassDropdownProps extends BaseDropdownProps {
  timeForEntityId?: string; // Worker ID for class assignment filtering
  customerId?: string; // Customer ID for class assignment filtering
  projectId?: string; // Project ID for class assignment filtering
  assignmentFilters?: {
    assigned?: boolean; // For assignment filtering: true = assigned only, undefined = all
  };
  /** When provided, use these options and skip SFO fetch */
  preloadedOptions?: ClassItem[] | null;
  /** When provided with preloadedOptions, call SFO again with searchText (debounced); pass null when no text */
  onSearchClass?: (searchText: string | null) => void;
  hasMoreClass?: boolean;
  loadMoreClass?: () => void;
  /** Pre-populated display name from classDAS — shown when selected item is not in the loaded page */
  displayName?: string;
  /** When true and exactly one class item is loaded with no current selection, auto-select it */
  autoSelect?: boolean;
  /** WTE only: id of the selected cell (e.g. `${rowId}-${dayIdx}`). When it changes, re-arm single-option auto-select for the newly selected cell. Unset or null for STE. */
  autoSelectKey?: string | null;
}

// Class Item type
export interface ClassItem {
  id: string;
  name: string;
  assigned: boolean;
  active: boolean;
}

// Props for customer dropdown
export interface CustomerDropdownProps extends BaseDropdownProps {
  timeForEntityId?: string; // Worker ID for customer/project assignment filtering
  assignmentFilters?: {
    assigned?: boolean; // For assignment filtering: true = assigned only, undefined = all
  };
  displayName?: string; // Pre-populated display name from timeAgainstContactDAS
}

// Customer/Project types
export enum CustomerType {
  Customer = 'CUSTOMER',
  Project = 'PROJECT',
}

export interface Customer {
  id: string;
  displayName: string;
  fullName: string;
  type: CustomerType;
  parentId?: string | null;
  level?: number | null;
  depth?: number; // For hierarchy rendering (calculated client-side)
}

// Service Item type
export interface ServiceItem {
  id: string;
  name: string;
  assigned: boolean;
  active: boolean;
  /** From saleDetails when loaded via SFO */
  price?: number | null;
  description?: string | null;
  taxable?: boolean;
}

// Props for location dropdown
export interface LocationDropdownProps extends BaseDropdownProps {
  timeForEntityId?: string; // Worker ID for location assignment filtering
  customerId?: string; // Customer ID for location assignment filtering
  projectId?: string; // Project ID for location assignment filtering
  assignmentFilters?: {
    assigned?: boolean; // For assignment filtering: true = assigned only, undefined = all
  };
  labelPreference?: labelPreferenceRef; // For custom department terminology
  /** When provided, use these options and skip SFO fetch */
  preloadedOptions?: LocationItem[] | null;
  /** When provided with preloadedOptions, call SFO again with searchText (debounced); pass null when no text */
  onSearchLocation?: (searchText: string | null) => void;
  hasMoreLocation?: boolean;
  loadMoreLocation?: () => void;
  /** Pre-populated display name from departmentDAS — shown when selected item is not in the loaded page */
  displayName?: string;
  /** When true and exactly one location item is loaded with no current selection, auto-select it */
  autoSelect?: boolean;
  /** WTE only: id of the selected cell (e.g. `${rowId}-${dayIdx}`). When it changes, re-arm single-option auto-select for the newly selected cell. Unset or null for STE. */
  autoSelectKey?: string | null;
}

// Location Item type
export interface LocationItem {
  id: string;
  name: string;
  assigned: boolean;
  active: boolean;
}
