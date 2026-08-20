/**
 * Test suite for Custom Fields Tour Steps
 * Unit tests for the CustomFieldsTourSteps function
 * @jest-environment jsdom
 */

import React from 'react';
import { CustomFieldsTourSteps } from 'src/js/widgets/customField/utils/tourSteps';
import { TourStep } from 'src/js/widgets/common/TourFramework/types';

// Mock the animation imports
jest.mock(
  'src/assets/animations/assignments/custom-field-settings/step-1.json',
  () => ({
    v: '5.5.7',
    fr: 30,
    ip: 0,
    op: 60,
    w: 300,
    h: 300,
    nm: 'Step 1',
    ddd: 0,
    assets: [],
    layers: [],
  }),
);

jest.mock(
  'src/assets/animations/assignments/custom-field-settings/step-2.json',
  () => ({
    v: '5.5.7',
    fr: 30,
    ip: 0,
    op: 60,
    w: 300,
    h: 300,
    nm: 'Step 2',
    ddd: 0,
    assets: [],
    layers: [],
  }),
);

jest.mock(
  'src/assets/animations/assignments/custom-field-settings/step-3.json',
  () => ({
    v: '5.5.7',
    fr: 30,
    ip: 0,
    op: 60,
    w: 300,
    h: 300,
    nm: 'Step 3',
    ddd: 0,
    assets: [],
    layers: [],
  }),
);

// Import after mocking
const firstStep = require('src/assets/animations/assignments/custom-field-settings/step-1.json');
const secondStep = require('src/assets/animations/assignments/custom-field-settings/step-2.json');
const thirdStep = require('src/assets/animations/assignments/custom-field-settings/step-3.json');

// Create mock intl object
const createMockIntl = () => ({
  formatMessage: ({ id }: { id: string }) => {
    const messages: Record<string, string> = {
      'customFields.tour.table.step.1.title': 'Custom Fields Table',
      'customFields.tour.table.step.1.description':
        'View and manage your custom fields assignments in this table.',
      'customFields.tour.table.step.1.nextLabel': 'Next: Customers',
      'customFields.tour.table.step.2.title': 'Customer Assignments',
      'customFields.tour.table.step.2.description':
        'Assign custom fields to customers for better organization.',
      'customFields.tour.table.step.2.nextLabel': 'Next: Workers',
      'customFields.tour.table.step.3.title': 'Worker Assignments',
      'customFields.tour.table.step.3.description':
        'Assign custom fields to workers for accurate time tracking.',
      'customFields.tour.table.step.3.nextLabel': 'Done',
    };
    return messages[id] || id;
  },
});

describe('CustomFieldsTourSteps', () => {
  // Create mock refs for testing
  let customFieldsTableRef: React.RefObject<HTMLElement>;
  let customersColumnRef: React.RefObject<HTMLElement>;
  let workersColumnRef: React.RefObject<HTMLElement>;
  let mockIntl: ReturnType<typeof createMockIntl>;

  beforeEach(() => {
    // Ensure document is defined for jsdom
    customFieldsTableRef = { current: document.createElement('div') };
    customersColumnRef = { current: document.createElement('div') };
    workersColumnRef = { current: document.createElement('div') };
    mockIntl = createMockIntl();
  });

  describe('Basic functionality', () => {
    test('should return 3 steps', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps).toHaveLength(3);
    });

    test('should return correct first step configuration', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps[0]).toEqual({
        id: 'step-1',
        title: 'Custom Fields Table',
        description:
          'View and manage your custom fields assignments in this table.',
        showOverlay: false,
        position: 'right',
        alignment: 'center',
        targetRef: customFieldsTableRef,
        nextLabel: 'Next: Customers',
        lottieData: firstStep,
      });
    });

    test('should return correct second step configuration', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps[1]).toEqual({
        id: 'step-2',
        title: 'Customer Assignments',
        description:
          'Assign custom fields to customers for better organization.',
        showOverlay: false,
        position: 'right',
        alignment: 'center',
        targetRef: customersColumnRef,
        nextLabel: 'Next: Workers',
        lottieData: secondStep,
      });
    });

    test('should return correct third step configuration', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps[2]).toEqual({
        id: 'step-3',
        title: 'Worker Assignments',
        description:
          'Assign custom fields to workers for accurate time tracking.',
        showOverlay: false,
        position: 'right',
        alignment: 'center',
        targetRef: workersColumnRef,
        nextLabel: 'Done',
        lottieData: thirdStep,
      });
    });

    test('should have correct refs assigned to steps', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps[0].targetRef).toBe(customFieldsTableRef);
      expect(steps[1].targetRef).toBe(customersColumnRef);
      expect(steps[2].targetRef).toBe(workersColumnRef);
    });
  });

  describe('Step structure validation', () => {
    test('should have all required TourStep properties for each step', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      steps.forEach((step: TourStep) => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('showOverlay');
        expect(step).toHaveProperty('position');
        expect(step).toHaveProperty('alignment');
        expect(step).toHaveProperty('targetRef');
        expect(step).toHaveProperty('nextLabel');
        expect(step).toHaveProperty('lottieData');
      });
    });

    test('should have non-empty titles for all steps', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      steps.forEach((step: TourStep) => {
        expect(step.title).toBeTruthy();
        expect(step.title.length).toBeGreaterThan(0);
      });
    });

    test('should have non-empty descriptions for all steps', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      steps.forEach((step: TourStep) => {
        expect(step.description).toBeTruthy();
        if (typeof step.description === 'string') {
          expect(step.description.length).toBeGreaterThan(0);
        }
      });
    });

    test('should have unique IDs for all steps', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      const ids = steps.map((step) => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('should have correct step IDs', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps[0].id).toBe('step-1');
      expect(steps[1].id).toBe('step-2');
      expect(steps[2].id).toBe('step-3');
    });

    test('should have showOverlay set to false for all steps', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      steps.forEach((step: TourStep) => {
        expect(step.showOverlay).toBe(false);
      });
    });
  });

  describe('Lottie animations', () => {
    test('should assign correct lottie data to each step', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps[0].lottieData).toBe(firstStep);
      expect(steps[1].lottieData).toBe(secondStep);
      expect(steps[2].lottieData).toBe(thirdStep);
    });

    test('should have lottie data objects defined', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      steps.forEach((step: TourStep) => {
        expect(step.lottieData).toBeDefined();
        expect(typeof step.lottieData).toBe('object');
      });
    });
  });

  describe('Position and alignment', () => {
    test('should have first step with right position and center alignment', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps[0].position).toBe('right');
      expect(steps[0].alignment).toBe('center');
    });

    test('should have second step with right position and center alignment', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps[1].position).toBe('right');
      expect(steps[1].alignment).toBe('center');
    });

    test('should have third step with right position and center alignment', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps[2].position).toBe('right');
      expect(steps[2].alignment).toBe('center');
    });

    test('should have center alignment for all steps', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      steps.forEach((step: TourStep) => {
        expect(step.alignment).toBe('center');
      });
    });
  });

  describe('nextLabel logic', () => {
    test('should have nextLabel pointing to next step in sequence', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps[0].nextLabel).toBe('Next: Customers');
      expect(steps[1].nextLabel).toBe('Next: Workers');
      expect(steps[2].nextLabel).toBe('Done');
    });

    test('should have last step with Done label', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps[steps.length - 1].nextLabel).toBe('Done');
    });
  });

  describe('Edge cases', () => {
    test('should handle null refs gracefully', () => {
      const nullTableRef = { current: null };
      const nullCustomersRef = { current: null };
      const nullWorkersRef = { current: null };

      const steps = CustomFieldsTourSteps(
        nullTableRef,
        nullCustomersRef,
        nullWorkersRef,
        mockIntl,
      );

      expect(steps).toHaveLength(3);
      expect(steps[0].targetRef).toBe(nullTableRef);
      expect(steps[1].targetRef).toBe(nullCustomersRef);
      expect(steps[2].targetRef).toBe(nullWorkersRef);
    });

    test('should maintain immutability - calling function twice returns independent arrays', () => {
      const steps1 = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );
      const steps2 = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps1).not.toBe(steps2);
      expect(steps1).toEqual(steps2);
    });

    test('should return array that can be safely modified without affecting future calls', () => {
      const steps1 = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      // Modify first result
      steps1.push({
        id: 'extra-step',
        title: 'Extra',
        description: 'Extra step',
        showOverlay: false,
        position: 'bottom',
        alignment: 'left',
        targetRef: customFieldsTableRef,
        nextLabel: 'Done',
        lottieData: firstStep,
      });

      const steps2 = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(steps1).toHaveLength(4);
      expect(steps2).toHaveLength(3);
    });
  });

  describe('Intl integration', () => {
    test('should use intl.formatMessage for titles', () => {
      const formatMessageSpy = jest.fn(({ id }) => `translated-${id}`);
      const spyIntl = { formatMessage: formatMessageSpy };

      CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        spyIntl,
      );

      expect(formatMessageSpy).toHaveBeenCalledWith({
        id: 'customFields.tour.table.step.1.title',
      });
      expect(formatMessageSpy).toHaveBeenCalledWith({
        id: 'customFields.tour.table.step.2.title',
      });
      expect(formatMessageSpy).toHaveBeenCalledWith({
        id: 'customFields.tour.table.step.3.title',
      });
    });

    test('should use intl.formatMessage for descriptions', () => {
      const formatMessageSpy = jest.fn(({ id }) => `translated-${id}`);
      const spyIntl = { formatMessage: formatMessageSpy };

      CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        spyIntl,
      );

      expect(formatMessageSpy).toHaveBeenCalledWith({
        id: 'customFields.tour.table.step.1.description',
      });
      expect(formatMessageSpy).toHaveBeenCalledWith({
        id: 'customFields.tour.table.step.2.description',
      });
      expect(formatMessageSpy).toHaveBeenCalledWith({
        id: 'customFields.tour.table.step.3.description',
      });
    });

    test('should use intl.formatMessage for nextLabels', () => {
      const formatMessageSpy = jest.fn(({ id }) => `translated-${id}`);
      const spyIntl = { formatMessage: formatMessageSpy };

      CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        spyIntl,
      );

      expect(formatMessageSpy).toHaveBeenCalledWith({
        id: 'customFields.tour.table.step.1.nextLabel',
      });
      expect(formatMessageSpy).toHaveBeenCalledWith({
        id: 'customFields.tour.table.step.2.nextLabel',
      });
      expect(formatMessageSpy).toHaveBeenCalledWith({
        id: 'customFields.tour.table.step.3.nextLabel',
      });
    });
  });

  describe('Type safety', () => {
    test('should return array of TourStep type', () => {
      const steps = CustomFieldsTourSteps(
        customFieldsTableRef,
        customersColumnRef,
        workersColumnRef,
        mockIntl,
      );

      expect(Array.isArray(steps)).toBe(true);
      steps.forEach((step) => {
        expect(step).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          showOverlay: expect.any(Boolean),
          position: expect.any(String),
          alignment: expect.any(String),
          nextLabel: expect.any(String),
          lottieData: expect.any(Object),
        });
      });
    });
  });
});
