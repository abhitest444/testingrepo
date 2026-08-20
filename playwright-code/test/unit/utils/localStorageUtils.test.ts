import {
  LocalStorageUtils,
  createStorageMethods,
} from 'src/js/utils/localStorageUtils';

describe('LocalStorageUtils', () => {
  let mockLogger: any;
  let localStorageUtils: LocalStorageUtils;
  let sessionStorageUtils: LocalStorageUtils;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      error: jest.fn(),
    };

    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();

    // Create instances
    localStorageUtils = new LocalStorageUtils(mockLogger, 'local');
    sessionStorageUtils = new LocalStorageUtils(mockLogger, 'session');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('constructor', () => {
    it('should create instance with localStorage by default', () => {
      const utils = new LocalStorageUtils(mockLogger);
      utils.setItem('test-key', 'test-value');

      expect(localStorage.getItem('test-key')).toBe('"test-value"');
      expect(sessionStorage.getItem('test-key')).toBeNull();
    });

    it('should create instance with sessionStorage when specified', () => {
      const utils = new LocalStorageUtils(mockLogger, 'session');
      utils.setItem('test-key', 'test-value');

      expect(sessionStorage.getItem('test-key')).toBe('"test-value"');
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('setItem', () => {
    it('should set item successfully', () => {
      localStorageUtils.setItem('my-key', 'my-value');

      expect(localStorage.getItem('my-key')).toBe('"my-value"');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should serialize value as JSON when setting', () => {
      const stringValue = 'test-string';
      localStorageUtils.setItem('string-key', stringValue);

      const stored = localStorage.getItem('string-key');
      expect(JSON.parse(stored!)).toEqual(stringValue);
    });

    it('should serialize null value', () => {
      localStorageUtils.setItem('null-key', null);

      expect(localStorage.getItem('null-key')).toBe('null');
    });

    it('should serialize boolean values', () => {
      localStorageUtils.setItem('bool-key', true);

      expect(localStorage.getItem('bool-key')).toBe('true');
    });

    it('should serialize number values', () => {
      localStorageUtils.setItem('number-key', 42);

      expect(localStorage.getItem('number-key')).toBe('42');
    });

    it('should log error and throw when setItem fails', () => {
      const error = new Error('Storage quota exceeded');
      const setItemSpy = jest
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw error;
        });

      expect(() => {
        localStorageUtils.setItem('fail-key', 'value');
      }).toThrow('Storage quota exceeded');

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[LocalStorage Utils] Error setting storage item for key fail-key',
        {
          error,
          key: 'fail-key',
        },
      );

      setItemSpy.mockRestore();
    });
  });

  describe('getItem', () => {
    it('should get item successfully', () => {
      localStorage.setItem('my-key', '"my-value"');

      const result = localStorageUtils.getItem('my-key');

      expect(result).toBe('my-value');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should deserialize JSON when getting', () => {
      const stringValue = 'test-value';
      localStorage.setItem('string-key', JSON.stringify(stringValue));

      const result = localStorageUtils.getItem('string-key');

      expect(result).toEqual(stringValue);
    });

    it('should return null when item does not exist', () => {
      const result = localStorageUtils.getItem('non-existent-key');

      expect(result).toBeNull();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return null for explicitly stored null', () => {
      localStorage.setItem('null-key', 'null');

      const result = localStorageUtils.getItem('null-key');

      expect(result).toBeNull();
    });

    it('should log error and return null when getItem fails', () => {
      const error = new Error('Storage access denied');
      const getItemSpy = jest
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw error;
        });

      const result = localStorageUtils.getItem('fail-key');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[LocalStorage Utils] Error getting storage item for key fail-key',
        {
          error,
          key: 'fail-key',
        },
      );

      getItemSpy.mockRestore();
    });

    it('should log error and return null when JSON parse fails', () => {
      localStorage.setItem('invalid-json', '{invalid json}');

      const result = localStorageUtils.getItem('invalid-json');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('should remove item successfully', () => {
      localStorage.setItem('my-key', '"my-value"');

      localStorageUtils.removeItem('my-key');

      expect(localStorage.getItem('my-key')).toBeNull();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should not throw when removing non-existent key', () => {
      expect(() => {
        localStorageUtils.removeItem('non-existent-key');
      }).not.toThrow();
    });

    it('should log error and throw when removeItem fails', () => {
      const error = new Error('Storage access denied');
      const removeItemSpy = jest
        .spyOn(Storage.prototype, 'removeItem')
        .mockImplementation(() => {
          throw error;
        });

      expect(() => {
        localStorageUtils.removeItem('fail-key');
      }).toThrow('Storage access denied');

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[LocalStorage Utils] Error removing storage item for key fail-key',
        {
          error,
          key: 'fail-key',
        },
      );

      removeItemSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear all items from localStorage', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      localStorage.setItem('key3', 'value3');

      localStorageUtils.clear();

      expect(localStorage.length).toBe(0);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should clear all items from sessionStorage', () => {
      sessionStorage.setItem('key1', 'value1');
      sessionStorage.setItem('key2', 'value2');

      sessionStorageUtils.clear();

      expect(sessionStorage.length).toBe(0);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log error and throw when clear fails', () => {
      // Create a new instance to avoid affecting other tests
      const testLogger = { error: jest.fn() };
      const testUtils = new LocalStorageUtils(testLogger, 'local');

      const error = new Error('Storage access denied');
      const clearSpy = jest
        .spyOn(Storage.prototype, 'clear')
        .mockImplementationOnce(() => {
          throw error;
        });

      expect(() => {
        testUtils.clear();
      }).toThrow('Storage access denied');

      expect(testLogger.error).toHaveBeenCalledWith(
        '[LocalStorage Utils] Error clearing storage',
        {
          error,
        },
      );

      clearSpy.mockRestore();
    });
  });

  describe('getAllKeys', () => {
    it('should get all keys from storage', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      localStorage.setItem('key3', 'value3');

      const keys = localStorageUtils.getAllKeys();

      expect(keys).toEqual(['key1', 'key2', 'key3']);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should return empty array when storage is empty', () => {
      const keys = localStorageUtils.getAllKeys();

      expect(keys).toEqual([]);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log error and return empty array when getAllKeys fails', () => {
      // Create a fresh instance to avoid any mock pollution
      const testLogger = { error: jest.fn() };
      const testUtils = new LocalStorageUtils(testLogger, 'local');

      const error = new Error('Storage access denied');
      const keysSpy = jest.spyOn(Object, 'keys').mockImplementationOnce(() => {
        throw error;
      });

      const keys = testUtils.getAllKeys();

      expect(keys).toEqual([]);
      expect(testLogger.error).toHaveBeenCalledWith(
        '[LocalStorage Utils] Error getting all keys',
        {
          error,
        },
      );

      keysSpy.mockRestore();
    });
  });

  describe('sessionStorage vs localStorage', () => {
    it('should use sessionStorage when specified', () => {
      sessionStorageUtils.setItem('session-key', 'session-value');

      expect(sessionStorage.getItem('session-key')).toBe('"session-value"');
      expect(localStorage.getItem('session-key')).toBeNull();
    });

    it('should use localStorage by default', () => {
      localStorageUtils.setItem('local-key', 'local-value');

      expect(localStorage.getItem('local-key')).toBe('"local-value"');
      expect(sessionStorage.getItem('local-key')).toBeNull();
    });
  });
});

describe('createStorageMethods', () => {
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
    };

    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('factory function', () => {
    it('should create methods with localStorage by default', () => {
      const methods = createStorageMethods(mockLogger);

      methods.setItem('test-key', 'test-value');

      expect(localStorage.getItem('test-key')).toBe('"test-value"');
      expect(sessionStorage.getItem('test-key')).toBeNull();
    });

    it('should create methods with sessionStorage when specified', () => {
      const methods = createStorageMethods(mockLogger, 'session');

      methods.setItem('test-key', 'test-value');

      expect(sessionStorage.getItem('test-key')).toBe('"test-value"');
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('method exposure', () => {
    it('should expose setItem method', () => {
      const methods = createStorageMethods(mockLogger);

      expect(typeof methods.setItem).toBe('function');
    });

    it('should expose getItem method', () => {
      const methods = createStorageMethods(mockLogger);

      expect(typeof methods.getItem).toBe('function');
    });

    it('should expose removeItem method', () => {
      const methods = createStorageMethods(mockLogger);

      expect(typeof methods.removeItem).toBe('function');
    });
  });

  describe('method functionality', () => {
    it('should call underlying LocalStorageUtils methods correctly', () => {
      const methods = createStorageMethods(mockLogger);

      // Test setItem
      methods.setItem('key1', 'value1');
      expect(localStorage.getItem('key1')).toBe('"value1"');

      // Test getItem
      const retrieved = methods.getItem('key1');
      expect(retrieved).toEqual('value1');

      // Test removeItem
      methods.removeItem('key1');
      expect(localStorage.getItem('key1')).toBeNull();
    });

    it('should handle errors through logger', () => {
      const methods = createStorageMethods(mockLogger);
      const error = new Error('Storage quota exceeded');

      const setItemSpy = jest
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw error;
        });

      expect(() => {
        methods.setItem('fail-key', 'value');
      }).toThrow('Storage quota exceeded');

      expect(mockLogger.error).toHaveBeenCalled();

      setItemSpy.mockRestore();
    });

    it('should support all allowed data types', () => {
      const methods = createStorageMethods(mockLogger);

      // Test string
      methods.setItem('string-key', 'text');
      expect(methods.getItem('string-key')).toBe('text');

      // Test number
      methods.setItem('number-key', 123);
      expect(methods.getItem('number-key')).toBe(123);

      // Test boolean
      methods.setItem('boolean-key', true);
      expect(methods.getItem('boolean-key')).toBe(true);

      // Test null
      methods.setItem('null-key', null);
      expect(methods.getItem('null-key')).toBeNull();
    });
  });
});
