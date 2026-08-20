/**
 * Types for LocationCard component
 * Structured to be easily convertible to Redux actions/state
 */

export enum LocationCardMode {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

// Location settings type - company vs custom rules
export enum LocationSettingsType {
  COMPANY = 'company',
  CUSTOM = 'custom',
}

// Location tracking options
export enum LocationTrackingOption {
  REQUIRED = 'required',
  OPTIONAL = 'optional',
  OFF = 'off',
}
