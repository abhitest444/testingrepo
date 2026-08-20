/**
 * Style constants for Step 4 Field Mapping component
 * Extracted from inline styles for better maintainability and reusability
 */

export const styles = {
  // Container styles
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },

  // Header section
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#6b7280',
  },

  // Stats section
  stats: {
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '14px',
  },
  statLabel: {
    color: '#374151',
  },
  statValueMapped: {
    fontWeight: 600,
    color: '#10b981',
  },
  statValueRemaining: {
    fontWeight: 600,
    color: '#f97316',
  },

  // Table styles
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: 'white',
  },
  tableHeaderRow: {
    borderBottom: '2px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  tableHeader: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
  },
  tableHeaderCenter: {
    padding: '12px 16px',
    textAlign: 'center' as const,
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    width: '120px',
  },
  tableHeaderMapTo: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    minWidth: '300px',
  },

  // Table row styles
  tableRow: {
    borderBottom: '1px solid #e5e7eb',
  },
  tableCell: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#111827',
  },
  tableCellCenter: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center' as const,
  },
  tableCellDropdown: {
    padding: '12px 16px',
    minWidth: '300px',
  },

  // Accordion section
  accordionSection: {
    marginBottom: '16px',
  },
  accordionBody: {
    padding: '16px',
  },

  // Actions section
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
    marginTop: '24px',
  },

  // Messages
  errorMessage: {
    fontSize: '14px',
    color: '#ef4444',
    marginTop: '12px',
    textAlign: 'right' as const,
    fontWeight: 500,
  },
  warningMessage: {
    fontSize: '14px',
    color: '#f59e0b',
    marginTop: '12px',
    textAlign: 'right' as const,
  },

  // State screens (loading, error, empty)
  stateScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '384px',
  },
  stateScreenContent: {
    textAlign: 'center' as const,
  },
  loadingSpinner: {
    animation: 'spin 1s linear infinite',
    borderRadius: '50%',
    height: '48px',
    width: '48px',
    borderBottom: '2px solid #4f46e5',
    margin: '0 auto 16px',
  },
  loadingText: {
    color: '#6b7280',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: '16px',
  },
  emptyStateTitle: {
    fontSize: '18px',
    fontWeight: 500,
    color: '#111827',
    marginBottom: '8px',
  },
  emptyStateText: {
    color: '#6b7280',
    marginBottom: '24px',
  },
} as const;
