import { Environment } from '@appfabric/sandbox-spec';
import useIxpDynamicOptOut from 'src/js/service/hooks/ixp/useIxpDynamicOptOut';

describe('useIxpDynamicOptOut', () => {
  test.each([
    {
      appContext: {
        getEnvironment: jest.fn().mockReturnValue(Environment.PROD),
        getRealmInfo: jest.fn().mockReturnValue({ realmId: '12345' }),
      },
      extensions: {
        qbo: {
          context: {
            getCompanyInfo: jest.fn().mockReturnValue({ id: '12345' }),
          },
        },
      },
      experiments: {
        optInUserToTreatmentsIL: jest
          .fn()
          .mockResolvedValue({ status: 'success' }),
      },
      logger: {
        info: jest.fn(),
      },
    },
    {
      appContext: {
        getEnvironment: jest.fn().mockReturnValue(Environment.QA),
        getRealmInfo: jest.fn().mockReturnValue({ realmId: '12345' }),
      },
      extensions: {
        qbo: {
          context: {
            getCompanyInfo: jest.fn().mockReturnValue({ id: '12345' }),
          },
        },
      },
      experiments: {
        optInUserToTreatmentsIL: jest
          .fn()
          .mockResolvedValue({ status: 'success' }),
      },
      logger: {
        info: jest.fn(),
      },
    },
  ])(
    'should update the URL and trigger a full page reload when optOutOfR1 is called',
    async (mockSandbox) => {
      mockSandbox.appContext.getEnvironment.mockReturnValue(Environment.PROD);
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: {
          assign: jest.fn(),
          href: 'https://example.com/app/fake-url?t=s',
        },
        writable: true,
      });

      const optOutFunction = useIxpDynamicOptOut(mockSandbox);
      await optOutFunction();

      expect(
        mockSandbox.experiments.optInUserToTreatmentsIL,
      ).toHaveBeenCalled();
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Opt out requested, status: success',
      );
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/legacy'),
      );

      window.location = originalLocation as any;
    },
  );
});
