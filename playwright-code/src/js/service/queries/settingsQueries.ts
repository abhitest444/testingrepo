import gql from 'graphql-tag';

// -------------------------------------------------------------------------------------------------- QUERY
export const TimeTrackingSettingsQuery = `
query CompanySettings {
  qbAppFoundationQbSettings {
    identity {
      company {
        localization {
          localizationSettings {
            timezone
          }
        }
      }
    }
    finance {
      accounting {
        accountingCore {
          accountingCoreSettings {
            entityVersion
            closeBookDateEnabled
            closeBookDate
            closeBookPasswordEnabled
          }
        }
      }
    }
    work {
      timeTracking {
        timeTrackingSettings {
          billingForTimeEnabled
          timeTrackingEnabled
          startWorkWeek
        }
      }
    }
    qbCompositeApp {
      qbAppFoundations {
        customFieldsAndDimensions {
          customFieldSettings {
            classesEnabled
            locationEnabled
          }
        }
      }
    }
    commerce {
      indirectTax {
        indirectTaxSettings {
          taxSettings {
            taxEnabled
          }
        }
      }
    }
  }
}
`;

interface CustomFieldSettings {
  classesEnabled: boolean;
  locationEnabled: boolean;
}

interface CustomFieldsAndDimensions {
  customFieldSettings: CustomFieldSettings;
}

interface QbAppFoundations {
  customFieldsAndDimensions: CustomFieldsAndDimensions;
}

interface QbCompositeApp {
  qbAppFoundations: QbAppFoundations;
}

export interface AccountingCoreSettings {
  entityVersion: string;
  closeBookDateEnabled: boolean;
  closeBookDate: string;
  closeBookPasswordEnabled: boolean;
}

export interface AccountingCore {
  accountingCoreSettings: AccountingCoreSettings;
}

export interface Accounting {
  accountingCore: AccountingCore;
}

export interface Finance {
  accounting: Accounting;
}

interface TaxSettings {
  taxEnabled: boolean;
}

interface IndirectTaxSettings {
  taxSettings: TaxSettings[];
}

interface IndirectTax {
  indirectTaxSettings: IndirectTaxSettings;
}

interface Commerce {
  indirectTax: IndirectTax;
}

interface TimeTrackingSettings {
  billingForTimeEnabled: boolean;
  timeTrackingEnabled: boolean;
  startWorkWeek: number;
}

interface TimeTracking {
  timeTrackingSettings: TimeTrackingSettings;
}

interface Work {
  timeTracking: TimeTracking;
}

interface LocalizationSettings {
  timezone: string;
}

interface IdentityCompanyLocalizationSettings {
  localizationSettings: LocalizationSettings;
}

interface IdentityCompany {
  localization: IdentityCompanyLocalizationSettings;
}

interface Identity {
  company: IdentityCompany;
}

interface QbAppFoundationQbSettings {
  qbCompositeApp: QbCompositeApp;
  finance: Finance;
  work: Work;
  commerce: Commerce;
  identity: Identity;
}

export interface CompanySettings {
  qbAppFoundationQbSettings: QbAppFoundationQbSettings;
}

// -------------------------------------------------------------------------------------------------- MUTATION

export const UpdateCompanySettingsMutation = gql`
  mutation updateCompanySettings($input: UpdateCompany_SettingsInput!) {
    updateCompany_Settings(input: $input) {
      clientMutationId
      __typename
    }
  }
`;

export interface UpdateCompanySettingsPayload {
  __typename: 'UpdateCompany_SettingsPayload';
  clientMutationId: string;
}

export interface UpdateCompanySettingsResponse {
  data: {
    updateCompany_Settings: UpdateCompanySettingsPayload;
  };
}
