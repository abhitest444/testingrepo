import { getLocalizationInfo } from 'src/js/service/utils/sandboxUtils';
import type { Identity_EntitlementGrant } from 'src/__generated__/oigql/graphql';
import { getQualtricsSurveyActiveEmployer } from 'src/js/widgets/common/feedbackSurvey/qualtricsContextUtils';

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  getLocalizationInfo: jest.fn(),
}));

describe('qualtricsContextUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns active employer details with region product mapping', () => {
    (getLocalizationInfo as jest.Mock).mockReturnValue({ region: 'CA' });
    const sandbox = {
      appContext: {
        getRealmInfo: jest.fn().mockReturnValue({ realmId: 'realm-123' }),
      },
    } as any;
    const entitlementGrants = [{} as Identity_EntitlementGrant];

    const result = getQualtricsSurveyActiveEmployer(sandbox, entitlementGrants);

    expect(result).toEqual({
      employerId: 'realm-123',
      product: 'CA-Online',
      companyName: '',
      employerName: '',
      entitlementGrants,
    });
  });

  it('defaults product to US when region is missing or unsupported', () => {
    const sandbox = {
      appContext: {
        getRealmInfo: jest.fn().mockReturnValue({ realmId: 'realm-123' }),
      },
    } as any;

    (getLocalizationInfo as jest.Mock).mockReturnValue(undefined);
    expect(getQualtricsSurveyActiveEmployer(sandbox).product).toBe('US-Online');

    (getLocalizationInfo as jest.Mock).mockReturnValue({ region: 'AU' });
    expect(getQualtricsSurveyActiveEmployer(sandbox).product).toBe('US-Online');
  });

  it('returns empty entitlement grants when none are provided', () => {
    (getLocalizationInfo as jest.Mock).mockReturnValue({ region: 'GB' });
    const sandbox = {
      appContext: {
        getRealmInfo: jest.fn().mockReturnValue({ realmId: 'realm-123' }),
      },
    } as any;

    const result = getQualtricsSurveyActiveEmployer(sandbox);

    expect(result).toEqual({
      employerId: 'realm-123',
      product: 'GB-Online',
      companyName: '',
      employerName: '',
      entitlementGrants: [],
    });
  });

  it('uses provided metadata for company name and roles', () => {
    (getLocalizationInfo as jest.Mock).mockReturnValue({ region: 'US' });
    const sandbox = {
      appContext: {
        getRealmInfo: jest.fn().mockReturnValue({ realmId: 'realm-123' }),
      },
    } as any;

    const result = getQualtricsSurveyActiveEmployer(sandbox, [], {
      companyName: 'Acme Corp',
      userRoles: [
        {
          roleId: 'Intuit.ems.peoplemanager',
          roleType: 'manager',
          name: 'Manager',
        },
      ],
    });

    expect(result).toEqual({
      employerId: 'realm-123',
      product: 'US-Online',
      companyName: 'Acme Corp',
      employerName: 'Acme Corp',
      userRoles: [
        {
          roleId: 'Intuit.ems.peoplemanager',
          roleType: 'manager',
          name: 'Manager',
        },
      ],
      entitlementGrants: [],
    });
  });
});
