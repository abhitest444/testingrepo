import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { MockQuicksandProvider, buildSandbox } from '@payroll/quicksand';
import {
  useStorage,
  StorageScope,
  STORAGE_EVENT_NAME,
} from 'src/js/hooks/useStorage';
import { Sandbox } from 'src/js/common/sandbox';

import { createStorageMethods } from 'src/js/utils/localStorageUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

// Mock the localStorageUtils
jest.mock('src/js/utils/localStorageUtils', () => ({
  createStorageMethods: jest.fn((logger, storageType) => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  })),
}));

// Mock the sandboxUtils
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

const mockCreateStorageMethods = createStorageMethods as jest.MockedFunction<
  typeof createStorageMethods
>;

const mockIsWorkforceEnvironment =
  isWorkforceEnvironment as jest.MockedFunction<typeof isWorkforceEnvironment>;

describe('useStorage', () => {
  let sandbox: Sandbox;
  let mockLogger: any;
  let mockWebStorage: any;
  let mockFallbackStorage: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock logger
    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      fatal: jest.fn(),
      logException: jest.fn(),
      isLevelDebug: jest.fn().mockReturnValue(false),
      isLevelInfo: jest.fn().mockReturnValue(false),
      isLevelWarn: jest.fn().mockReturnValue(false),
      isLevelError: jest.fn().mockReturnValue(false),
      isLevelFatal: jest.fn().mockReturnValue(false),
      isLevelLog: jest.fn().mockReturnValue(false),
      on: jest.fn(),
      off: jest.fn(),
    };

    // Setup mock fallback storage
    mockFallbackStorage = {
      setItem: jest.fn(),
      getItem: jest.fn().mockReturnValue(null),
      removeItem: jest.fn(),
    };

    mockCreateStorageMethods.mockReturnValue(mockFallbackStorage);

    // Setup mock webStorage
    mockWebStorage = {
      setItemByCompanyId: jest.fn(),
      getItemByCompanyId: jest.fn().mockReturnValue(null),
      removeItemByCompanyId: jest.fn(),
    };

    // Default: not in Workforce environment (use webStorage)
    mockIsWorkforceEnvironment.mockReturnValue(false);

    // Create sandbox with QBO extensions
    sandbox = {
      ...buildSandbox(),
      logger: mockLogger,
      extensions: {
        qbo: {
          webStorage: {
            local: jest.fn().mockReturnValue(mockWebStorage),
            session: jest.fn().mockReturnValue(mockWebStorage),
            persistent: jest.fn().mockReturnValue(mockWebStorage),
          },
        },
      },
    } as any;
  });

  const wrapper = ({ children }: any) => (
    <MockQuicksandProvider sandbox={sandbox}>{children}</MockQuicksandProvider>
  );

  describe('Basic Functionality', () => {
    it('should initialize with stored value from webStorage', () => {
      mockWebStorage.getItemByCompanyId.mockReturnValue('stored-value');

      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      expect(result.current[0]).toBe('stored-value');
      expect(mockWebStorage.getItemByCompanyId).toHaveBeenCalledWith(
        'test-key',
      );
    });

    it('should initialize with stored value from fallback localStorage', () => {
      // Set Workforce environment to trigger fallback
      mockIsWorkforceEnvironment.mockReturnValue(true);
      mockFallbackStorage.getItem.mockReturnValue('fallback-value');

      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      expect(result.current[0]).toBe('fallback-value');
      expect(mockFallbackStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should initialize with null when key does not exist', () => {
      mockWebStorage.getItemByCompanyId.mockReturnValue(null);

      const { result } = renderHook(
        () => useStorage('non-existent-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      expect(result.current[0]).toBeNull();
    });

    it('should set item successfully via webStorage', () => {
      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1]('new-value');
      });

      expect(mockWebStorage.setItemByCompanyId).toHaveBeenCalledWith(
        'test-key',
        'new-value',
      );
      expect(result.current[0]).toBe('new-value');
    });

    it('should set item successfully via fallback localStorage', () => {
      mockIsWorkforceEnvironment.mockReturnValue(true);

      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1]('fallback-value');
      });

      expect(mockFallbackStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        'fallback-value',
      );
      expect(result.current[0]).toBe('fallback-value');
    });

    it('should remove item when value is null', () => {
      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1](null);
      });

      expect(mockWebStorage.removeItemByCompanyId).toHaveBeenCalledWith(
        'test-key',
      );
      expect(result.current[0]).toBeNull();
    });

    it('should update state when setStorageItem is called', () => {
      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1]('first-value');
      });
      expect(result.current[0]).toBe('first-value');

      act(() => {
        result.current[1]('second-value');
      });
      expect(result.current[0]).toBe('second-value');
    });

    it('should dispatch storage event when value changes', () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1]('new-value');
      });

      expect(dispatchEventSpy).toHaveBeenCalled();
      const event = dispatchEventSpy.mock.calls[0][0] as StorageEvent;
      expect(event.type).toBe(STORAGE_EVENT_NAME);
      expect(event.key).toBe('test-key');
      expect(event.newValue).toBe('"new-value"');

      dispatchEventSpy.mockRestore();
    });
  });

  describe('Storage Scope', () => {
    it('should use local storage when scope is LOCAL', () => {
      renderHook(() => useStorage('test-key', { scope: StorageScope.LOCAL }), {
        wrapper,
      });

      expect(sandbox.extensions?.qbo?.webStorage?.local).toHaveBeenCalled();
    });

    it('should use session storage when scope is SESSION', () => {
      renderHook(
        () => useStorage('test-key', { scope: StorageScope.SESSION }),
        { wrapper },
      );

      expect(sandbox.extensions?.qbo?.webStorage?.session).toHaveBeenCalled();
    });

    it('should use persistent storage when scope is PERSISTENT', () => {
      renderHook(
        () => useStorage('test-key', { scope: StorageScope.PERSISTENT }),
        { wrapper },
      );

      expect(
        sandbox.extensions?.qbo?.webStorage?.persistent,
      ).toHaveBeenCalled();
    });
  });

  describe('Fallback Mechanism', () => {
    it('should use webStorage extension when not in Workforce environment', () => {
      mockIsWorkforceEnvironment.mockReturnValue(false);

      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1]('value');
      });

      expect(mockWebStorage.setItemByCompanyId).toHaveBeenCalled();
      expect(mockFallbackStorage.setItem).not.toHaveBeenCalled();
    });

    it('should fallback to localStorage when in Workforce environment', () => {
      mockIsWorkforceEnvironment.mockReturnValue(true);

      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1]('value');
      });

      expect(mockFallbackStorage.setItem).toHaveBeenCalled();
      expect(mockWebStorage.setItemByCompanyId).not.toHaveBeenCalled();
    });

    it('should fallback to sessionStorage when in Workforce environment and scope is SESSION', () => {
      mockIsWorkforceEnvironment.mockReturnValue(true);

      renderHook(
        () => useStorage('test-key', { scope: StorageScope.SESSION }),
        { wrapper },
      );

      expect(mockCreateStorageMethods).toHaveBeenCalledWith(
        mockLogger,
        'session',
      );
    });

    it('should use webStorage in non-Workforce environment even if extensions exist', () => {
      mockIsWorkforceEnvironment.mockReturnValue(false);

      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1]('value');
      });

      expect(mockWebStorage.setItemByCompanyId).toHaveBeenCalledWith(
        'test-key',
        'value',
      );
      expect(mockFallbackStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Cross-tab Synchronization', () => {
    it('should sync state when storage event is fired from another tab', () => {
      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      expect(result.current[0]).toBeNull();

      act(() => {
        const event = new StorageEvent(STORAGE_EVENT_NAME, {
          key: 'test-key',
          newValue: '"synced-value"',
          oldValue: null,
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe('synced-value');
    });

    it('should parse JSON value from storage event', () => {
      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      const numberValue = 123;

      act(() => {
        const event = new StorageEvent(STORAGE_EVENT_NAME, {
          key: 'test-key',
          newValue: JSON.stringify(numberValue),
          oldValue: null,
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toEqual(numberValue);
    });

    it('should set null when storage event newValue is null', () => {
      mockWebStorage.getItemByCompanyId.mockReturnValue('initial-value');

      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      expect(result.current[0]).toBe('initial-value');

      act(() => {
        const event = new StorageEvent(STORAGE_EVENT_NAME, {
          key: 'test-key',
          newValue: null,
          oldValue: '"initial-value"',
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBeNull();
    });

    it('should handle JSON parse errors in storage event', () => {
      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        const event = new StorageEvent(STORAGE_EVENT_NAME, {
          key: 'test-key',
          newValue: '{invalid json}',
          oldValue: null,
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error syncing local storage item for key'),
      );
    });
  });

  describe('Error Handling', () => {
    it('should log error when getItemByCompanyId fails', () => {
      mockWebStorage.getItemByCompanyId.mockImplementation(() => {
        throw new Error('Storage read failed');
      });

      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      expect(result.current[0]).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error getting local storage item for key test-key',
        ),
      );
    });

    it('should log error when setItemByCompanyId fails', () => {
      mockWebStorage.setItemByCompanyId.mockImplementation(() => {
        throw new Error('Storage write failed');
      });

      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1]('value');
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error setting local storage item for key test-key',
        ),
      );
    });

    it('should return null when getItemByCompanyId throws', () => {
      mockWebStorage.getItemByCompanyId.mockImplementation(() => {
        throw new Error('Access denied');
      });

      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      expect(result.current[0]).toBeNull();
    });

    it('should handle removeItemByCompanyId errors', () => {
      mockWebStorage.removeItemByCompanyId.mockImplementation(() => {
        throw new Error('Remove failed');
      });

      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1](null);
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error setting local storage item for key test-key',
        ),
      );
    });

    it('should handle malformed storage event data', () => {
      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        const event = new StorageEvent(STORAGE_EVENT_NAME, {
          key: 'test-key',
          newValue: 'not-valid-json-{',
          oldValue: null,
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should remove storage event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        STORAGE_EVENT_NAME,
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should not update state for storage events with different keys', () => {
      const { result } = renderHook(
        () => useStorage('my-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      expect(result.current[0]).toBeNull();

      act(() => {
        const event = new StorageEvent(STORAGE_EVENT_NAME, {
          key: 'different-key',
          newValue: '"should-not-update"',
          oldValue: null,
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBeNull();
    });

    it('should handle multiple rapid updates', () => {
      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1]('value1');
        result.current[1]('value2');
        result.current[1]('value3');
      });

      expect(result.current[0]).toBe('value3');
      expect(mockWebStorage.setItemByCompanyId).toHaveBeenCalledTimes(3);
    });

    it('should use default scope when options not provided', () => {
      const { result } = renderHook(() => useStorage('test-key'), { wrapper });

      act(() => {
        result.current[1]('value');
      });

      expect(sandbox.extensions?.qbo?.webStorage?.local).toHaveBeenCalled();
    });

    it('should handle boolean values', () => {
      const { result } = renderHook(
        () => useStorage('bool-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);
      expect(mockWebStorage.setItemByCompanyId).toHaveBeenCalledWith(
        'bool-key',
        true,
      );
    });

    it('should handle number values', () => {
      const { result } = renderHook(
        () => useStorage('number-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      act(() => {
        result.current[1](42);
      });

      expect(result.current[0]).toBe(42);
      expect(mockWebStorage.setItemByCompanyId).toHaveBeenCalledWith(
        'number-key',
        42,
      );
    });

    it('should handle all allowed value types', () => {
      const { result } = renderHook(
        () => useStorage('test-key', { scope: StorageScope.LOCAL }),
        { wrapper },
      );

      // Test string
      act(() => {
        result.current[1]('text');
      });
      expect(result.current[0]).toBe('text');

      // Test number
      act(() => {
        result.current[1](123);
      });
      expect(result.current[0]).toBe(123);

      // Test boolean
      act(() => {
        result.current[1](true);
      });
      expect(result.current[0]).toBe(true);

      // Test null
      act(() => {
        result.current[1](null);
      });
      expect(result.current[0]).toBeNull();
    });
  });
});
