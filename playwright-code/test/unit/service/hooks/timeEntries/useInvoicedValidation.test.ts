import { renderHook } from '@testing-library/react-hooks';
import { useInvoicedValidation } from '../../../../../src/js/hooks/useInvoicedValidation';

describe('useInvoicedValidation', () => {
  describe('Single Mode', () => {
    it('should not detect restricted changes for non-invoiced entries', () => {
      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'single',
          currentValues: { billable: true },
          defaultValues: { invoiceId: null, billable: false },
          dirtyFields: { billable: true },
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: null,
        isRestrictedChange: false,
      });
    });

    it('should detect billing restricted change', () => {
      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'single',
          currentValues: { billable: false },
          defaultValues: { invoiceId: '123', billable: true },
          dirtyFields: { billable: true },
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: 'billing',
        isRestrictedChange: true,
      });
    });

    it('should detect customer restricted change', () => {
      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'single',
          currentValues: { timeAgainst: { customer: '456' } },
          defaultValues: { invoiceId: '123', timeAgainst: { customer: '123' } },
          dirtyFields: { timeAgainst: { customer: true } },
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: 'customer',
        isRestrictedChange: true,
      });
    });

    it('should detect project restricted change', () => {
      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'single',
          currentValues: { timeAgainst: { project: '789' } },
          defaultValues: { invoiceId: '123', timeAgainst: { project: '123' } },
          dirtyFields: { 'timeAgainst.project': true },
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: 'project',
        isRestrictedChange: true,
      });
    });
  });

  describe('Weekly Mode', () => {
    it('should track modified rows for invoiced entries', () => {
      const currentValues = [
        { billable: false, billableStatus: 'HAS_BEEN_BILLED' },
        { billable: true, billableStatus: 'HAS_BEEN_BILLED' },
      ];
      const defaultValues = [
        { billable: true, billableStatus: 'HAS_BEEN_BILLED' },
        { billable: true, billableStatus: 'HAS_BEEN_BILLED' },
      ];
      const dirtyFields = {
        0: { billable: true },
        1: { description: true },
      };

      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'weekly',
          currentValues,
          defaultValues,
          dirtyFields,
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: 'billing',
        isRestrictedChange: true,
        modifiedRows: new Set([0]),
      });
    });

    it('should not track changes for non-invoiced entries', () => {
      const currentValues = [
        { billable: false, billableStatus: 'NOT_BILLED' },
        { billable: true, billableStatus: 'NOT_BILLED' },
      ];
      const defaultValues = [
        { billable: true, billableStatus: 'NOT_BILLED' },
        { billable: true, billableStatus: 'NOT_BILLED' },
      ];
      const dirtyFields = {
        0: { billable: true },
        1: { description: true },
      };

      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'weekly',
          currentValues,
          defaultValues,
          dirtyFields,
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: null,
        isRestrictedChange: false,
        modifiedRows: new Set(),
      });
    });

    it('should detect customer change when timeAgainst is marked as dirty', () => {
      const currentValues = [
        {
          timeAgainst: { customer: { id: '456' } },
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const defaultValues = [
        {
          timeAgainst: { customer: { id: '123' } },
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const dirtyFields = {
        0: { timeAgainst: true }, // timeAgainst marked as dirty without nested fields
      };

      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'weekly',
          currentValues,
          defaultValues,
          dirtyFields,
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: 'customer',
        isRestrictedChange: true,
        modifiedRows: new Set([0]),
      });
    });

    it('should handle array comparison correctly', () => {
      const currentValues = [
        {
          durations: [{ duration: 3600 }, { duration: 1800 }],
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const defaultValues = [
        {
          durations: [{ duration: 3600 }, { duration: 3600 }],
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const dirtyFields = {
        0: { durations: true },
      };

      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'weekly',
          currentValues,
          defaultValues,
          dirtyFields,
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: null,
        isRestrictedChange: false,
        modifiedRows: new Set([0]),
      });
    });

    it('should handle object comparison with different number of properties', () => {
      const currentValues = [
        {
          metadata: { key1: 'value1', key2: 'value2' },
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const defaultValues = [
        {
          metadata: { key1: 'value1' },
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const dirtyFields = {
        0: { metadata: true },
      };

      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'weekly',
          currentValues,
          defaultValues,
          dirtyFields,
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: null,
        isRestrictedChange: false,
        modifiedRows: new Set([0]),
      });
    });

    it('should handle nested object comparison with id fields', () => {
      const currentValues = [
        {
          timeAgainst: {
            project: { id: '456', name: 'New Name' },
          },
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const defaultValues = [
        {
          timeAgainst: {
            project: { id: '456', name: 'Old Name' },
          },
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const dirtyFields = {
        0: { timeAgainst: { project: true } },
      };

      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'weekly',
          currentValues,
          defaultValues,
          dirtyFields,
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: null,
        isRestrictedChange: false,
        modifiedRows: new Set(),
      });
    });

    it('should handle null/undefined value comparisons', () => {
      const currentValues = [
        {
          notes: null,
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const defaultValues = [
        {
          notes: null,
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const dirtyFields = {
        0: { notes: true },
      };

      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'weekly',
          currentValues,
          defaultValues,
          dirtyFields,
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: null,
        isRestrictedChange: false,
        modifiedRows: new Set(),
      });
    });

    it('should handle primitive value comparisons', () => {
      const currentValues = [
        {
          duration: 3600,
          description: 'Updated description',
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const defaultValues = [
        {
          duration: 1800,
          description: 'Original description',
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const dirtyFields = {
        0: { duration: true, description: true },
      };

      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'weekly',
          currentValues,
          defaultValues,
          dirtyFields,
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: null,
        isRestrictedChange: false,
        modifiedRows: new Set([0]),
      });
    });

    it('should handle empty/falsy value comparisons', () => {
      const currentValues = [
        {
          description: '',
          notes: '',
          tags: '',
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const defaultValues = [
        {
          description: '',
          notes: '',
          tags: '',
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const dirtyFields = {
        0: { description: true, notes: true, tags: true },
      };

      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'weekly',
          currentValues,
          defaultValues,
          dirtyFields,
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: null,
        isRestrictedChange: false,
        modifiedRows: new Set(),
      });
    });

    it('should handle complex object comparisons with different property structures', () => {
      const currentValues = [
        {
          metadata: {
            key1: { subKey1: 'value1' },
            key2: { id: '123', name: 'test' },
          },
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const defaultValues = [
        {
          metadata: {
            key1: { subKey1: 'different value' },
            key2: { id: '123', name: 'old test' },
          },
          billableStatus: 'HAS_BEEN_BILLED',
          invoiceId: '123',
        },
      ];
      const dirtyFields = {
        0: { metadata: true },
      };

      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'weekly',
          currentValues,
          defaultValues,
          dirtyFields,
        }),
      );

      expect(result.current).toEqual({
        restrictedFieldType: null,
        isRestrictedChange: false,
        modifiedRows: new Set([0]),
      });
    });
  });

  describe('getRestrictedContentKey', () => {
    it('should return correct content key for billing type', () => {
      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'single',
          currentValues: { billable: false },
          defaultValues: { invoiceId: '123' },
          dirtyFields: { billable: true },
        }),
      );

      expect(result.current.restrictedFieldType).toBe('billing');
    });

    it('should return correct content key for customer type', () => {
      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'single',
          currentValues: { timeAgainst: { customer: '456' } },
          defaultValues: { invoiceId: '123' },
          dirtyFields: { 'timeAgainst.customer': true },
        }),
      );

      expect(result.current.restrictedFieldType).toBe('customer');
    });

    it('should return correct content key for project type', () => {
      const { result } = renderHook(() =>
        useInvoicedValidation({
          mode: 'single',
          currentValues: { timeAgainst: { project: '789' } },
          defaultValues: { invoiceId: '123' },
          dirtyFields: { 'timeAgainst.project': true },
        }),
      );

      expect(result.current.restrictedFieldType).toBe('project');
    });

    it('should return default content key for null field type', () => {
      const {
        getRestrictedContentKey,
      } = require('../../../../../src/js/hooks/useInvoicedValidation');
      expect(getRestrictedContentKey(null)).toBe(
        'invoiced.time.popup.billing.content',
      );
    });

    it('should handle all field types', () => {
      const {
        getRestrictedContentKey,
      } = require('../../../../../src/js/hooks/useInvoicedValidation');

      expect(getRestrictedContentKey('billing')).toBe(
        'invoiced.time.popup.billing.content',
      );
      expect(getRestrictedContentKey('customer')).toBe(
        'invoiced.time.popup.customer.content',
      );
      expect(getRestrictedContentKey('project')).toBe(
        'invoiced.time.popup.project.content',
      );
    });
  });
});
