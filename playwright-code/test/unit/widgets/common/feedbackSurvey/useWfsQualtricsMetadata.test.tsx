import { PROFILE_COMPANY_AND_ROLES_QUERY } from 'src/js/service/queries/profileQueries';
import { useProfileCompanyAndRolesMetadata } from 'src/js/widgets/common/feedbackSurvey/useProfileCompanyAndRolesMetadata';
import {
  getDefaultSandbox,
  renderHookWithApolloProvider,
} from 'test/unit/testUtils';

describe('useProfileCompanyAndRolesMetadata', () => {
  const authId = 'auth-123';
  const realmId = 'realm-123';

  const getSandbox = () => {
    const sandbox = getDefaultSandbox();
    sandbox.appContext.getRealmInfo = jest.fn().mockReturnValue({ realmId });
    sandbox.appContext.getUserAuthInfo = jest.fn().mockReturnValue({ authId });
    return sandbox;
  };

  it('returns company name and canonical roles for the active realm', async () => {
    const sandbox = getSandbox();
    const mocks = [
      {
        request: {
          query: PROFILE_COMPANY_AND_ROLES_QUERY,
          variables: {
            filterBy: {
              claimedByFilter: {
                claimedBy: {
                  eq: authId,
                },
              },
            },
          },
        },
        result: {
          data: {
            profileSearch: {
              edges: [
                {
                  node: {
                    accountId: realmId,
                    account: {
                      accountProfile: {
                        businessInfo: {
                          displayName: 'Acme Corp',
                        },
                      },
                    },
                    roles: [
                      {
                        canonicalName: 'Intuit.ems.peoplemanager',
                        roleType: 'manager',
                        name: 'Manager',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useProfileCompanyAndRolesMetadata({ sandbox, enabled: true }),
      mocks,
      sandbox,
    );

    await waitForNextUpdate();

    expect(result.current).toEqual({
      companyName: 'Acme Corp',
      userRoles: [
        {
          roleId: 'Intuit.ems.peoplemanager',
          roleType: 'manager',
          name: 'Manager',
        },
      ],
    });
  });

  it('returns empty metadata when no profile matches active realm', async () => {
    const sandbox = getSandbox();
    const mocks = [
      {
        request: {
          query: PROFILE_COMPANY_AND_ROLES_QUERY,
          variables: {
            filterBy: {
              claimedByFilter: {
                claimedBy: {
                  eq: authId,
                },
              },
            },
          },
        },
        result: {
          data: {
            profileSearch: {
              edges: [
                {
                  node: {
                    accountId: 'different-realm',
                    account: {
                      accountProfile: {
                        businessInfo: {
                          displayName: 'Other Corp',
                        },
                      },
                    },
                    roles: [
                      {
                        canonicalName: 'Intuit.ems.peoplemanager',
                        roleType: 'manager',
                        name: 'Manager',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useProfileCompanyAndRolesMetadata({ sandbox, enabled: true }),
      mocks,
      sandbox,
    );

    await waitForNextUpdate();

    expect(result.current).toEqual({
      companyName: '',
    });
  });

  it('returns empty metadata when identity query errors', async () => {
    const sandbox = getSandbox();
    const mocks = [
      {
        request: {
          query: PROFILE_COMPANY_AND_ROLES_QUERY,
          variables: {
            filterBy: {
              claimedByFilter: {
                claimedBy: {
                  eq: authId,
                },
              },
            },
          },
        },
        error: new Error('identity failed'),
      },
    ];

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useProfileCompanyAndRolesMetadata({ sandbox, enabled: true }),
      mocks,
      sandbox,
    );

    await waitForNextUpdate();

    expect(result.current).toEqual({
      companyName: '',
    });
  });
});
