/**
 * Test suite for User Settings Widget Helpers
 * Unit tests for decryption functions
 */

import { decryptWorkerId } from 'src/js/widgets/userSettings/utils/helpers';
import { encryptWorkerId } from 'src/js/widgets/assignments/utils/helpers';

describe('User Settings Widget Helpers', () => {
  describe('decryptWorkerId', () => {
    describe('Successful decryption', () => {
      test('should decrypt a valid encrypted worker ID', () => {
        const workerId = 'worker-123';
        const encrypted = encryptWorkerId(workerId);
        const decrypted = decryptWorkerId(encrypted);

        expect(decrypted).toBe(workerId);
      });

      test('should decrypt worker ID with special characters', () => {
        const workerId = 'worker@special#chars';
        const encrypted = encryptWorkerId(workerId);
        const decrypted = decryptWorkerId(encrypted);

        expect(decrypted).toBe(workerId);
      });

      test('should decrypt worker ID with spaces', () => {
        const workerId = 'worker with spaces';
        const encrypted = encryptWorkerId(workerId);
        const decrypted = decryptWorkerId(encrypted);

        expect(decrypted).toBe(workerId);
      });

      test('should decrypt worker ID with Unicode characters', () => {
        const workerId = 'worker-测试-123';
        const encrypted = encryptWorkerId(workerId);
        const decrypted = decryptWorkerId(encrypted);

        expect(decrypted).toBe(workerId);
      });

      test('should decrypt empty string', () => {
        const workerId = '';
        const encrypted = encryptWorkerId(workerId);
        const decrypted = decryptWorkerId(encrypted);

        expect(decrypted).toBe(workerId);
      });

      test('should decrypt very long worker ID', () => {
        const workerId = 'a'.repeat(1000);
        const encrypted = encryptWorkerId(workerId);
        const decrypted = decryptWorkerId(encrypted);

        expect(decrypted).toBe(workerId);
      });

      test('should handle URL-safe base64 with padding', () => {
        // Manually create a URL-safe base64 string that needs padding
        const workerId = 'test-worker-id';
        const base64 = btoa(encodeURIComponent(workerId))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
        const decrypted = decryptWorkerId(base64);

        expect(decrypted).toBe(workerId);
      });

      test('should handle URL-safe base64 without padding', () => {
        const workerId = 'short';
        const encrypted = encryptWorkerId(workerId);
        const decrypted = decryptWorkerId(encrypted);

        expect(decrypted).toBe(workerId);
      });
    });

    describe('Error handling', () => {
      test('should return null for invalid base64 string', () => {
        const invalidBase64 = 'invalid-base64-!@#$';
        const result = decryptWorkerId(invalidBase64);

        expect(result).toBeNull();
      });

      test('should return null for malformed encrypted string', () => {
        // Use a string that will definitely cause atob to fail
        const malformed = '!!!invalid!!!';
        const result = decryptWorkerId(malformed);

        expect(result).toBeNull();
      });

      test('should return empty string for empty input', () => {
        // Empty string is valid base64 and decodes to empty string
        const result = decryptWorkerId('');

        // Empty string decodes successfully to empty string
        expect(result).toBe('');
      });

      test('should handle decryption errors gracefully', () => {
        // Create a string that will cause atob to fail
        const invalid = '!!!';
        const result = decryptWorkerId(invalid);

        expect(result).toBeNull();
      });
    });

    describe('Round-trip encryption/decryption', () => {
      test('should correctly encrypt and decrypt various worker IDs', () => {
        const testCases = [
          'worker-123',
          'worker-456-789',
          'worker@domain.com',
          'worker#special$chars',
          'worker with spaces',
          'worker-测试-123',
          'worker-émojis-🚀',
          'a'.repeat(100),
          '',
        ];

        testCases.forEach((workerId) => {
          const encrypted = encryptWorkerId(workerId);
          const decrypted = decryptWorkerId(encrypted);
          expect(decrypted).toBe(workerId);
        });
      });

      test('should maintain consistency across multiple encryptions', () => {
        const workerId = 'worker-123';
        const encrypted1 = encryptWorkerId(workerId);
        const encrypted2 = encryptWorkerId(workerId);

        // Same input should produce same output
        expect(encrypted1).toBe(encrypted2);

        // Both should decrypt to same value
        expect(decryptWorkerId(encrypted1)).toBe(workerId);
        expect(decryptWorkerId(encrypted2)).toBe(workerId);
      });
    });

    describe('Edge cases', () => {
      test('should handle worker ID with only numbers', () => {
        const workerId = '123456789';
        const encrypted = encryptWorkerId(workerId);
        const decrypted = decryptWorkerId(encrypted);

        expect(decrypted).toBe(workerId);
      });

      test('should handle worker ID with only letters', () => {
        const workerId = 'abcdefghijklmnopqrstuvwxyz';
        const encrypted = encryptWorkerId(workerId);
        const decrypted = decryptWorkerId(encrypted);

        expect(decrypted).toBe(workerId);
      });

      test('should handle worker ID with mixed case', () => {
        const workerId = 'Worker-Id-With-Mixed-Case';
        const encrypted = encryptWorkerId(workerId);
        const decrypted = decryptWorkerId(encrypted);

        expect(decrypted).toBe(workerId);
      });

      test('should handle worker ID with newlines and tabs', () => {
        const workerId = 'worker\nwith\ttabs';
        const encrypted = encryptWorkerId(workerId);
        const decrypted = decryptWorkerId(encrypted);

        expect(decrypted).toBe(workerId);
      });
    });
  });
});
