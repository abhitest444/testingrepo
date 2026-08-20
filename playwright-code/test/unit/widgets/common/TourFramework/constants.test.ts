import {
  TOUR_FRAMEWORK_MODES,
  TOUR_STORAGE_PREFIX,
  TOUR_SESSION_PREFIX,
  getTourStorageKey,
  getTourSessionKey,
  colors,
  getRandomColor,
} from 'src/js/widgets/common/TourFramework/constants';

describe('TourFramework Constants', () => {
  describe('TOUR_FRAMEWORK_MODES', () => {
    it('should have MODAL mode defined', () => {
      expect(TOUR_FRAMEWORK_MODES.MODAL).toBe('modal');
    });

    it('should have TOOLTIP mode defined', () => {
      expect(TOUR_FRAMEWORK_MODES.TOOLTIP).toBe('tooltip');
    });

    it('should have exactly 2 modes', () => {
      expect(Object.keys(TOUR_FRAMEWORK_MODES)).toHaveLength(2);
    });

    it('should contain only the expected modes', () => {
      expect(TOUR_FRAMEWORK_MODES).toEqual({
        MODAL: 'modal',
        TOOLTIP: 'tooltip',
      });
    });
  });

  describe('Storage Prefixes', () => {
    it.each([
      {
        description: 'should have correct TOUR_STORAGE_PREFIX',
        value: TOUR_STORAGE_PREFIX,
        expected: 'tour_completed_',
      },
      {
        description: 'should have correct TOUR_SESSION_PREFIX',
        value: TOUR_SESSION_PREFIX,
        expected: 'tour_session_',
      },
    ])('$description', ({ value, expected }) => {
      expect(value).toBe(expected);
    });

    it('should be strings', () => {
      expect(typeof TOUR_STORAGE_PREFIX).toBe('string');
      expect(typeof TOUR_SESSION_PREFIX).toBe('string');
    });
  });

  describe.each([
    {
      label: 'getTourStorageKey',
      fn: getTourStorageKey,
      prefix: 'tour_completed_',
    },
    {
      label: 'getTourSessionKey',
      fn: getTourSessionKey,
      prefix: 'tour_session_',
    },
  ])('$label', ({ fn, prefix }) => {
    it('should generate correct key for a given tour ID', () => {
      const tourId = 'onboarding-tour';
      expect(fn(tourId)).toBe(`${prefix}onboarding-tour`);
    });

    it('should handle tour IDs with special characters', () => {
      const tourId = 'tour-123_test';
      expect(fn(tourId)).toBe(`${prefix}tour-123_test`);
    });

    it('should handle empty tour ID', () => {
      expect(fn('')).toBe(`${prefix}`);
    });

    it('should generate unique keys for different tour IDs', () => {
      const key1 = fn('tour-1');
      const key2 = fn('tour-2');
      expect(key1).not.toBe(key2);
    });

    it('should be consistent for the same tour ID', () => {
      const tourId = 'consistent-tour';
      expect(fn(tourId)).toBe(fn(tourId));
    });
  });

  it('getTourSessionKey should generate different keys than getTourStorageKey for same tour ID', () => {
    const tourId = 'same-tour';
    expect(getTourStorageKey(tourId)).not.toBe(getTourSessionKey(tourId));
  });

  describe('colors', () => {
    it('should be an array', () => {
      expect(Array.isArray(colors)).toBe(true);
    });

    it('should contain 6 colors', () => {
      expect(colors).toHaveLength(6);
    });

    it('should contain valid hex color codes', () => {
      colors.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should have expected color values', () => {
      expect(colors).toEqual([
        '#f0e6f6',
        '#e6f4ea',
        '#fff3cd',
        '#e8d4f8',
        '#fce4ec',
        '#e1f5fe',
      ]);
    });

    it('should have all unique colors', () => {
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });
  });

  describe('getRandomColor', () => {
    it('should return a color from the colors array', () => {
      const randomColor = getRandomColor();
      expect(colors).toContain(randomColor);
    });

    it('should return a valid hex color', () => {
      const randomColor = getRandomColor();
      expect(randomColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should return a string', () => {
      const randomColor = getRandomColor();
      expect(typeof randomColor).toBe('string');
    });

    it('should potentially return different colors on multiple calls', () => {
      const results = new Set();
      // Call 100 times to increase chance of getting different colors
      for (let i = 0; i < 100; i += 1) {
        results.add(getRandomColor());
      }
      // With 6 colors and 100 calls, we should get at least 2 different colors
      expect(results.size).toBeGreaterThan(1);
    });

    it('should always return one of the predefined colors', () => {
      // Test multiple times to ensure consistency
      for (let i = 0; i < 50; i += 1) {
        const randomColor = getRandomColor();
        expect(colors).toContain(randomColor);
      }
    });

    it('should not return undefined or null', () => {
      const randomColor = getRandomColor();
      expect(randomColor).toBeDefined();
      expect(randomColor).not.toBeNull();
    });
  });

  describe('Integration tests', () => {
    it('should generate different storage and session keys for same tour', () => {
      const tourId = 'integration-test-tour';
      const storageKey = getTourStorageKey(tourId);
      const sessionKey = getTourSessionKey(tourId);

      expect(storageKey).toContain(TOUR_STORAGE_PREFIX);
      expect(sessionKey).toContain(TOUR_SESSION_PREFIX);
      expect(storageKey).not.toBe(sessionKey);
    });

    it('should handle complex tour ID scenarios', () => {
      const complexTourId = 'customer-assignment-table-tour-v2';
      const storageKey = getTourStorageKey(complexTourId);
      const sessionKey = getTourSessionKey(complexTourId);

      expect(storageKey).toBe(`tour_completed_${complexTourId}`);
      expect(sessionKey).toBe(`tour_session_${complexTourId}`);
    });
  });
});
