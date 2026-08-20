import { buildSandbox } from '@payroll/quicksand';
import { useHasProjects } from 'src/js/service/utils/projectsUtils';
import { Sandbox } from 'src/js/common/sandbox';
import { renderHookWithQuicksandProvider } from 'test/unit/testUtils';

describe('useHasProjects', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = buildSandbox();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return true if projects are activated and a project has been created', () => {
    sandbox.extensions = {
      qbo: {
        // @ts-ignore
        plugins: {
          isPluginActivated: jest.fn().mockReturnValue(true),
        },
        // @ts-ignore
        webStorage: {
          persistent: jest.fn().mockReturnValue({
            getItemByCompanyId: jest.fn().mockReturnValue(true),
          }),
        },
      },
    };

    const { result } = renderHookWithQuicksandProvider(
      () => useHasProjects(),
      sandbox,
    );

    expect(result.current).toBe(true);
  });

  it('should return false if projects are not activated', () => {
    sandbox.extensions = {
      qbo: {
        // @ts-ignore
        plugins: {
          isPluginActivated: jest.fn().mockReturnValue(false),
        },
        // @ts-ignore
        webStorage: {
          persistent: jest.fn().mockReturnValue({
            getItemByCompanyId: jest.fn().mockReturnValue(true),
          }),
        },
      },
    };

    const { result } = renderHookWithQuicksandProvider(
      () => useHasProjects(),
      sandbox,
    );

    expect(result.current).toBe(false);
  });

  it('should return false if no project has been created', () => {
    sandbox.extensions = {
      qbo: {
        // @ts-ignore
        plugins: {
          isPluginActivated: jest.fn().mockReturnValue(true),
        },
        // @ts-ignore
        webStorage: {
          persistent: jest.fn().mockReturnValue({
            getItemByCompanyId: jest.fn().mockReturnValue(false),
          }),
        },
      },
    };

    const { result } = renderHookWithQuicksandProvider(
      () => useHasProjects(),
      sandbox,
    );

    expect(result.current).toBe(false);
  });
});
