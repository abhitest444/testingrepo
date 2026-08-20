import { renderHook } from '@testing-library/react-hooks';
import { act } from '@testing-library/react';

import * as ScreenSizeUtils from 'src/js/common/screenSizeUtils';
import { useIsMobileDevice } from 'src/js/common/screenSizeUtils';

describe('isMobileDevice', () => {
  let getGlobalMock: jest.SpyInstance;

  beforeEach(() => {
    getGlobalMock = jest.spyOn(ScreenSizeUtils, 'getGlobal');
  });

  afterEach(() => {
    getGlobalMock.mockRestore();
  });

  it('should return true for screen width less than or equal to breakPoints.xs', () => {
    getGlobalMock.mockReturnValue({
      window: { innerWidth: ScreenSizeUtils.breakPoints.xs },
      navigator: { userAgent: '' },
    });

    expect(ScreenSizeUtils.isMobileDevice()).toBe(true);
  });

  it('should return false for screen width greater than breakPoints.sm', () => {
    getGlobalMock.mockReturnValue({
      window: { innerWidth: ScreenSizeUtils.breakPoints.md },
      navigator: { userAgent: '' },
    });

    expect(ScreenSizeUtils.isMobileDevice()).toBe(false);
  });

  it('should return true for mobile user agent string', () => {
    getGlobalMock.mockReturnValue({
      window: { innerWidth: ScreenSizeUtils.breakPoints.md + 1 },
      navigator: { userAgent: 'iPhone' },
    });

    expect(ScreenSizeUtils.isMobileDevice()).toBe(true);
  });

  it('should return false for non-mobile user agent string', () => {
    getGlobalMock.mockReturnValue({
      window: { innerWidth: ScreenSizeUtils.breakPoints.md + 1 },
      navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });

    expect(ScreenSizeUtils.isMobileDevice()).toBe(false);
  });

  it('should return true for mobile user agent string even if screen width is greater than breakPoints.sm', () => {
    getGlobalMock.mockReturnValue({
      window: { innerWidth: ScreenSizeUtils.breakPoints.md },
      navigator: { userAgent: 'Android' },
    });

    expect(ScreenSizeUtils.isMobileDevice()).toBe(true);
  });

  it('should return false if neither screen width nor user agent indicates a mobile device', () => {
    getGlobalMock.mockReturnValue({
      window: { innerWidth: ScreenSizeUtils.breakPoints.md },
      navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });

    expect(ScreenSizeUtils.isMobileDevice()).toBe(false);
  });
});

describe('useIsMobileDevice', () => {
  let getGlobalMock: jest.SpyInstance;

  beforeEach(() => {
    getGlobalMock = jest.spyOn(ScreenSizeUtils, 'getGlobal');
  });

  afterEach(() => {
    getGlobalMock.mockRestore();
  });

  it('should return true if the device is initially mobile', () => {
    getGlobalMock.mockReturnValue({
      window: { innerWidth: ScreenSizeUtils.breakPoints.xs },
      navigator: { userAgent: '' },
    });

    const { result } = renderHook(() => useIsMobileDevice());
    expect(result.current).toBe(true);
  });

  it('should return false if the device is initially not mobile', () => {
    getGlobalMock.mockReturnValue({
      window: { innerWidth: ScreenSizeUtils.breakPoints.md + 1 },
      navigator: { userAgent: '' },
    });

    const { result } = renderHook(() => useIsMobileDevice());
    expect(result.current).toBe(false);
  });

  it('should update to true when resized to a mobile width', () => {
    getGlobalMock.mockReturnValue({
      window: { innerWidth: ScreenSizeUtils.breakPoints.md + 1 },
      navigator: { userAgent: '' },
    });

    const { result } = renderHook(() => useIsMobileDevice());

    act(() => {
      getGlobalMock.mockReturnValue({
        window: { innerWidth: ScreenSizeUtils.breakPoints.xs },
        navigator: { userAgent: '' },
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(true);
  });

  it('should update to false when resized to a non-mobile width', () => {
    getGlobalMock.mockReturnValue({
      window: { innerWidth: ScreenSizeUtils.breakPoints.xs },
      navigator: { userAgent: '' },
    });

    const { result } = renderHook(() => useIsMobileDevice());

    act(() => {
      getGlobalMock.mockReturnValue({
        window: { innerWidth: ScreenSizeUtils.breakPoints.md + 1 },
        navigator: { userAgent: '' },
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(false);
  });

  it('should return true for mobile user agent string regardless of width', () => {
    getGlobalMock.mockReturnValue({
      window: { innerWidth: ScreenSizeUtils.breakPoints.md + 1 },
      navigator: { userAgent: 'iPhone' },
    });

    const { result } = renderHook(() => useIsMobileDevice());
    expect(result.current).toBe(true);
  });
});
