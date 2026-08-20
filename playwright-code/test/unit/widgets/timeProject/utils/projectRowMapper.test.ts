import {
  mapStatusToProjectStatus,
  mapResponseToRows,
} from 'src/js/widgets/timeProject/utils/projectRowMapper';
import { WorkProjectEdge } from 'src/js/widgets/timeProject/types';

// ─────────────────────────────────────────────────────────────────────────────
// mapStatusToProjectStatus
// ─────────────────────────────────────────────────────────────────────────────

describe('mapStatusToProjectStatus', () => {
  describe('OIGQL human-readable strings', () => {
    it.each([
      ['In progress', 'IN_PROGRESS'],
      ['Completed', 'COMPLETED'],
      ['Not started', 'NOT_STARTED'],
      ['To do', 'TODO'],
      ['Canceled', 'CANCELLED'],
      ['Cancelled', 'CANCELLED'],
    ] as [string, string][])('maps "%s" → "%s"', (input, expected) => {
      expect(mapStatusToProjectStatus(input)).toBe(expected);
    });
  });

  describe('Workflow API ProperCase strings (no context → default QBOA behaviour)', () => {
    it.each([
      ['Inprogress', 'IN_PROGRESS'],
      ['Complete', 'COMPLETED'],
      ['Open', 'TODO'],
      ['Todo', 'TODO'],
    ] as [string, string][])('maps "%s" → "%s"', (input, expected) => {
      expect(mapStatusToProjectStatus(input)).toBe(expected);
    });
  });

  describe('ALL_CAPS safety-net variants (no context → default QBOA behaviour)', () => {
    it.each([
      ['IN_PROGRESS', 'IN_PROGRESS'],
      ['COMPLETE', 'COMPLETED'],
      ['OPEN', 'TODO'],
      ['TODO', 'TODO'],
      ['CANCELLED', 'CANCELLED'],
    ] as [string, string][])('maps "%s" → "%s"', (input, expected) => {
      expect(mapStatusToProjectStatus(input)).toBe(expected);
    });
  });

  describe('Workflow API context: isAccountant=true (QBOA)', () => {
    it('maps "Open" → "TODO" so the badge matches the "To do" filter label', () => {
      expect(mapStatusToProjectStatus('Open', { isAccountant: true })).toBe(
        'TODO',
      );
    });

    it('maps "OPEN" → "TODO"', () => {
      expect(mapStatusToProjectStatus('OPEN', { isAccountant: true })).toBe(
        'TODO',
      );
    });
  });

  describe('Workflow API context: isAccountant=false (QBO)', () => {
    it('maps "Open" → "NOT_STARTED" so the badge matches the "Not started" filter label', () => {
      expect(mapStatusToProjectStatus('Open', { isAccountant: false })).toBe(
        'NOT_STARTED',
      );
    });

    it('maps "OPEN" → "NOT_STARTED"', () => {
      expect(mapStatusToProjectStatus('OPEN', { isAccountant: false })).toBe(
        'NOT_STARTED',
      );
    });

    it('still maps non-Open statuses correctly for QBO', () => {
      expect(
        mapStatusToProjectStatus('Inprogress', { isAccountant: false }),
      ).toBe('IN_PROGRESS');
      expect(
        mapStatusToProjectStatus('Complete', { isAccountant: false }),
      ).toBe('COMPLETED');
      expect(mapStatusToProjectStatus('Todo', { isAccountant: false })).toBe(
        'TODO',
      );
    });
  });

  it('defaults to NOT_STARTED for an unrecognised status', () => {
    expect(mapStatusToProjectStatus('unknown-status')).toBe('NOT_STARTED');
  });

  it('defaults to NOT_STARTED for an empty string', () => {
    expect(mapStatusToProjectStatus('')).toBe('NOT_STARTED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

const buildEdge = (overrides: Record<string, any> = {}): WorkProjectEdge => ({
  cursor: 'cursor',
  node: {
    id: '123',
    name: 'Test Project',
    status: 'In progress',
    description: 'desc',
    dueDate: '2026-12-31',
    completedDate: null,
    startDate: '2026-01-01',
    customerId: null,
    active: true,
    customer: null,
    ...overrides,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// mapResponseToRows
// ─────────────────────────────────────────────────────────────────────────────

describe('mapResponseToRows', () => {
  it('returns an empty array for an empty edges list', () => {
    expect(mapResponseToRows([])).toEqual([]);
  });

  it('assigns the correct rowIndex to each row', () => {
    const rows = mapResponseToRows([
      buildEdge({ id: 'p1', name: 'A' }),
      buildEdge({ id: 'p2', name: 'B' }),
    ]);
    expect(rows[0].rowIndex).toBe(0);
    expect(rows[1].rowIndex).toBe(1);
  });

  it('maps projectId and uniqueId from a bare numeric OIGQL id', () => {
    const [row] = mapResponseToRows([buildEdge({ id: '793400145' })]);
    expect(row.projectId).toBe('793400145');
    expect(row.uniqueId).toBe('793400145');
  });

  it('decodes a Workflow API global ID to a numeric local projectId', () => {
    const [row] = mapResponseToRows([
      buildEdge({
        id: 'djQuMTo5OjAuMTo5MzQxNDU0NzE5NTE0OTAyOjY4ZDAxMTQ3ZGQ:793400145',
      }),
    ]);
    expect(row.projectId).toBe('793400145');
  });

  it('maps projectName from node.name', () => {
    const [row] = mapResponseToRows([buildEdge({ name: 'My Project' })]);
    expect(row.projectName).toBe('My Project');
  });

  it('uses empty string for projectName when name is null', () => {
    const [row] = mapResponseToRows([buildEdge({ name: null })]);
    expect(row.projectName).toBe('');
  });

  it('prefers customer.id over customerId for customerId field', () => {
    const [row] = mapResponseToRows([
      buildEdge({
        customerId: 'fallback-id',
        customer: {
          id: 'customer-id',
          displayName: 'Acme',
          fullName: '',
          firstName: '',
          lastName: '',
          companyId: '',
        },
      }),
    ]);
    expect(row.customerId).toBe('customer-id');
  });

  it('falls back to customerId when customer is null', () => {
    const [row] = mapResponseToRows([
      buildEdge({ customer: null, customerId: 'fallback-123' }),
    ]);
    expect(row.customerId).toBe('fallback-123');
  });

  it('extracts numeric local id from Workflow API client global ID', () => {
    const [row] = mapResponseToRows([
      buildEdge({
        customer: null,
        customerId: null,
        client: { id: 'djQuMTo5:888777666' },
      }),
    ]);
    expect(row.customerId).toBe('888777666');
  });

  it('returns empty customerId when customer, customerId, and client are all absent', () => {
    const [row] = mapResponseToRows([
      buildEdge({ customer: null, customerId: null, client: null }),
    ]);
    expect(row.customerId).toBe('');
  });

  it('returns empty customerId when client.id is an empty string', () => {
    // extractQboLocalId('') returns '' (falsy — falls through to the '' sentinel)
    const [row] = mapResponseToRows([
      buildEdge({ customer: null, customerId: null, client: { id: '' } }),
    ]);
    expect(row.customerId).toBe('');
  });

  it('passes a colonless client.id through as-is (no decodable QBO local ID)', () => {
    // If client.id has no colon, extractQboLocalId treats it as "already a local ID"
    // and returns it unchanged.  On the live Workflow path this can't happen for
    // QBO tenants (inServiceToType in ('CONTACT') guarantees QBO-format global IDs),
    // but the mapper is defensive and propagates whatever it receives rather than
    // silently dropping it.
    const [row] = mapResponseToRows([
      buildEdge({
        customer: null,
        customerId: null,
        client: { id: 'bare-id-no-colon' },
      }),
    ]);
    expect(row.customerId).toBe('bare-id-no-colon');
  });

  it('maps customerName from customer.displayName', () => {
    const [row] = mapResponseToRows([
      buildEdge({
        customer: {
          id: '1',
          displayName: 'Display Name',
          fullName: 'Full Name',
          firstName: '',
          lastName: '',
          companyId: '',
        },
      }),
    ]);
    expect(row.customerName).toBe('Display Name');
  });

  it('falls back to customer.fullName when displayName is absent', () => {
    const [row] = mapResponseToRows([
      buildEdge({
        customer: {
          id: '1',
          displayName: '',
          fullName: 'Full Name Only',
          firstName: '',
          lastName: '',
          companyId: '',
        },
      }),
    ]);
    expect(row.customerName).toBe('Full Name Only');
  });

  it('sets customerName to empty string when customer is null', () => {
    const [row] = mapResponseToRows([buildEdge({ customer: null })]);
    expect(row.customerName).toBe('');
  });

  it('maps status via mapStatusToProjectStatus', () => {
    const [row] = mapResponseToRows([buildEdge({ status: 'In progress' })]);
    expect(row.status).toBe('IN_PROGRESS');
  });

  it('maps deadline and deadlineLabel from dueDate', () => {
    const [row] = mapResponseToRows([buildEdge({ dueDate: '2026-06-30' })]);
    expect(row.deadline).toBe('2026-06-30');
    expect(row.deadlineLabel).toBe('2026-06-30');
  });

  it('sets budgetHoursTotal and budgetHoursRemaining to -1 sentinel', () => {
    const [row] = mapResponseToRows([buildEdge()]);
    expect(row.budgetHoursTotal).toBe(-1);
    expect(row.budgetHoursRemaining).toBe(-1);
  });

  it('sets budget to empty string', () => {
    const [row] = mapResponseToRows([buildEdge()]);
    expect(row.budget).toBe('');
  });

  it('maps startDate and completedDate', () => {
    const [row] = mapResponseToRows([
      buildEdge({ startDate: '2026-01-01', completedDate: '2026-12-31' }),
    ]);
    expect(row.startDate).toBe('2026-01-01');
    expect(row.completedDate).toBe('2026-12-31');
  });

  it('defaults active to true when node.active is null', () => {
    const [row] = mapResponseToRows([buildEdge({ active: null })]);
    expect(row.active).toBe(true);
  });

  it('maps active: false correctly', () => {
    const [row] = mapResponseToRows([buildEdge({ active: false })]);
    expect(row.active).toBe(false);
  });

  it('builds the full customer object when customer is present', () => {
    const [row] = mapResponseToRows([
      buildEdge({
        customer: {
          id: 'cust-1',
          companyId: 'co-1',
          fullName: 'Full',
          firstName: 'First',
          lastName: 'Last',
          displayName: 'Display',
        },
      }),
    ]);
    expect(row.customer).toEqual({
      id: 'cust-1',
      companyId: 'co-1',
      fullName: 'Full',
      firstName: 'First',
      lastName: 'Last',
      displayName: 'Display',
    });
  });

  it('sets customer to null when node.customer is null', () => {
    const [row] = mapResponseToRows([buildEdge({ customer: null })]);
    expect(row.customer).toBeNull();
  });

  describe('isAccountant context for Workflow API Open status', () => {
    it('maps Open → TODO when isAccountant=true (QBOA)', () => {
      const [row] = mapResponseToRows([buildEdge({ status: 'Open' })], {
        isAccountant: true,
      });
      expect(row.status).toBe('TODO');
    });

    it('maps Open → NOT_STARTED when isAccountant=false (QBO)', () => {
      const [row] = mapResponseToRows([buildEdge({ status: 'Open' })], {
        isAccountant: false,
      });
      expect(row.status).toBe('NOT_STARTED');
    });

    it('maps Open → TODO when no context is provided (OIGQL default)', () => {
      const [row] = mapResponseToRows([buildEdge({ status: 'Open' })]);
      expect(row.status).toBe('TODO');
    });
  });

  describe('onUnknownStatus callback', () => {
    it('calls onUnknownStatus instead of console.warn when an unrecognised status is encountered', () => {
      const onUnknownStatus = jest.fn();
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const [row] = mapResponseToRows(
        [buildEdge({ status: 'UNKNOWN_STATUS' })],
        {
          onUnknownStatus,
        },
      );

      expect(onUnknownStatus).toHaveBeenCalledTimes(1);
      expect(onUnknownStatus).toHaveBeenCalledWith('UNKNOWN_STATUS');
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(row.status).toBe('NOT_STARTED');

      consoleSpy.mockRestore();
    });

    it('falls back to console.warn when onUnknownStatus is not provided', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const [row] = mapResponseToRows([
        buildEdge({ status: 'ANOTHER_UNKNOWN' }),
      ]);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ANOTHER_UNKNOWN'),
      );
      expect(row.status).toBe('NOT_STARTED');

      consoleSpy.mockRestore();
    });

    it('does not invoke onUnknownStatus for recognised statuses', () => {
      const onUnknownStatus = jest.fn();

      mapResponseToRows([buildEdge({ status: 'Open' })], { onUnknownStatus });

      expect(onUnknownStatus).not.toHaveBeenCalled();
    });
  });
});
