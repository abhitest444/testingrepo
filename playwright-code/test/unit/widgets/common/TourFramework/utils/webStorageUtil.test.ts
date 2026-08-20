import {
  setItemByPersonaId,
  getItemByPersonaId,
  getItemByPersonaIdAsync,
  removeItemByPersonaId,
} from 'src/js/widgets/common/TourFramework/utils/webStorageUtil';
import { Sandbox } from 'src/js/common/sandbox';

describe('webStorageUtil', () => {
  let mockSandbox: Sandbox;
  let mockSetItemByPersonaId: jest.Mock;
  let mockGetItemByPersonaId: jest.Mock;
  let mockGetItemByPersonaIdAsync: jest.Mock;
  let mockRemoveItemByPersonaId: jest.Mock;

  beforeEach(() => {
    mockSetItemByPersonaId = jest.fn();
    mockGetItemByPersonaId = jest.fn();
    mockGetItemByPersonaIdAsync = jest.fn();
    mockRemoveItemByPersonaId = jest.fn();

    mockSandbox = {
      extensions: {
        qbo: {
          webStorage: {
            persistent: jest.fn().mockReturnValue({
              setItemByPersonaId: mockSetItemByPersonaId,
              getItemByPersonaId: mockGetItemByPersonaId,
              getItemByPersonaIdAsync: mockGetItemByPersonaIdAsync,
              removeItemByPersonaId: mockRemoveItemByPersonaId,
            }),
          },
        },
      },
    } as unknown as Sandbox;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setItemByPersonaId', () => {
    it('should set all allowed value types in persistent storage', () => {
      setItemByPersonaId(mockSandbox, 'string-key', 'value');
      setItemByPersonaId(mockSandbox, 'number-key', 42);
      setItemByPersonaId(mockSandbox, 'boolean-key', true);
      setItemByPersonaId(mockSandbox, 'null-key', null);

      expect(
        mockSandbox.extensions.qbo.webStorage.persistent,
      ).toHaveBeenCalled();
      expect(mockSetItemByPersonaId).toHaveBeenCalledTimes(4);
      expect(mockSetItemByPersonaId).toHaveBeenCalledWith(
        'string-key',
        'value',
      );
      expect(mockSetItemByPersonaId).toHaveBeenCalledWith('number-key', 42);
      expect(mockSetItemByPersonaId).toHaveBeenCalledWith('boolean-key', true);
      expect(mockSetItemByPersonaId).toHaveBeenCalledWith('null-key', null);
    });

    it('should handle falsy values correctly', () => {
      setItemByPersonaId(mockSandbox, 'zero', 0);
      setItemByPersonaId(mockSandbox, 'false', false);
      setItemByPersonaId(mockSandbox, 'empty', '');

      expect(mockSetItemByPersonaId).toHaveBeenCalledWith('zero', 0);
      expect(mockSetItemByPersonaId).toHaveBeenCalledWith('false', false);
      expect(mockSetItemByPersonaId).toHaveBeenCalledWith('empty', '');
    });
  });

  describe('getItemByPersonaId', () => {
    it('should retrieve all allowed value types from persistent storage', () => {
      mockGetItemByPersonaId
        .mockReturnValueOnce('value')
        .mockReturnValueOnce(42)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(null);

      expect(getItemByPersonaId(mockSandbox, 'string-key')).toBe('value');
      expect(getItemByPersonaId(mockSandbox, 'number-key')).toBe(42);
      expect(getItemByPersonaId(mockSandbox, 'boolean-key')).toBe(true);
      expect(getItemByPersonaId(mockSandbox, 'null-key')).toBeNull();
    });

    it('should return undefined for non-existent key', () => {
      mockGetItemByPersonaId.mockReturnValue(undefined);
      expect(getItemByPersonaId(mockSandbox, 'non-existent')).toBeUndefined();
    });

    it('should handle falsy values correctly', () => {
      mockGetItemByPersonaId
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce('');

      expect(getItemByPersonaId(mockSandbox, 'zero')).toBe(0);
      expect(getItemByPersonaId(mockSandbox, 'false')).toBe(false);
      expect(getItemByPersonaId(mockSandbox, 'empty')).toBe('');
    });
  });

  describe('getItemByPersonaIdAsync', () => {
    it('should retrieve values asynchronously from persistent storage', async () => {
      mockGetItemByPersonaIdAsync.mockResolvedValue('async-value');

      const result = await getItemByPersonaIdAsync(mockSandbox, 'test-key');

      expect(mockGetItemByPersonaIdAsync).toHaveBeenCalledWith('test-key');
      expect(result).toBe('async-value');
    });

    it('should handle promise rejection', async () => {
      const error = new Error('Storage access failed');
      mockGetItemByPersonaIdAsync.mockRejectedValue(error);

      await expect(
        getItemByPersonaIdAsync(mockSandbox, 'error-key'),
      ).rejects.toThrow('Storage access failed');
    });

    it('should handle all value types asynchronously', async () => {
      mockGetItemByPersonaIdAsync
        .mockResolvedValueOnce('value')
        .mockResolvedValueOnce(42)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(null);

      await expect(getItemByPersonaIdAsync(mockSandbox, 'k1')).resolves.toBe(
        'value',
      );
      await expect(getItemByPersonaIdAsync(mockSandbox, 'k2')).resolves.toBe(
        42,
      );
      await expect(getItemByPersonaIdAsync(mockSandbox, 'k3')).resolves.toBe(
        false,
      );
      await expect(
        getItemByPersonaIdAsync(mockSandbox, 'k4'),
      ).resolves.toBeNull();
    });
  });

  describe('removeItemByPersonaId', () => {
    it('should remove an item from persistent storage', () => {
      removeItemByPersonaId(mockSandbox, 'test-key');

      expect(
        mockSandbox.extensions.qbo.webStorage.persistent,
      ).toHaveBeenCalled();
      expect(mockRemoveItemByPersonaId).toHaveBeenCalledWith('test-key');
    });

    it('should handle multiple removes', () => {
      removeItemByPersonaId(mockSandbox, 'key1');
      removeItemByPersonaId(mockSandbox, 'key2');

      expect(mockRemoveItemByPersonaId).toHaveBeenCalledTimes(2);
    });
  });

  describe('integration scenarios', () => {
    it('should set, get, and remove values', () => {
      mockGetItemByPersonaId
        .mockReturnValueOnce('value')
        .mockReturnValueOnce(undefined);

      setItemByPersonaId(mockSandbox, 'key', 'value');
      expect(getItemByPersonaId(mockSandbox, 'key')).toBe('value');

      removeItemByPersonaId(mockSandbox, 'key');
      expect(getItemByPersonaId(mockSandbox, 'key')).toBeUndefined();
    });

    it('should handle async get after set', async () => {
      mockGetItemByPersonaIdAsync.mockResolvedValue('async-value');

      setItemByPersonaId(mockSandbox, 'key', 'async-value');
      await expect(getItemByPersonaIdAsync(mockSandbox, 'key')).resolves.toBe(
        'async-value',
      );
    });

    it('should update existing values', () => {
      setItemByPersonaId(mockSandbox, 'key', 1);
      setItemByPersonaId(mockSandbox, 'key', 2);

      expect(mockSetItemByPersonaId).toHaveBeenNthCalledWith(1, 'key', 1);
      expect(mockSetItemByPersonaId).toHaveBeenNthCalledWith(2, 'key', 2);
    });
  });
});
