import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import CreateEstimateDrawer from 'src/js/widgets/timeProject/components/CreateEstimateDrawer';
import { CREATE_ESTIMATE_TRACKING_POINTS } from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';

const mockTrack = jest.fn();
const mockUseCreateEstimateTrackingPoints = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useTracking: () => mockTrack,
}));

jest.mock(
  'src/js/widgets/timeProject/hooks/useCreateEstimateTrackingPoints',
  () => ({
    useCreateEstimateTrackingPoints: () =>
      mockUseCreateEstimateTrackingPoints(),
  }),
);

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <div data-testid="activity-loader" />,
}));

const mockSaveEstimate = jest.fn().mockResolvedValue(true);
const mockValidateBeforeSave = jest.fn().mockReturnValue(true);
const mockChangeEstimateType = jest.fn();
const mockUpdateHoursValue = jest.fn();
const mockAddServiceItem = jest.fn();
const mockRemoveServiceItem = jest.fn();
const mockEditServiceItemHours = jest.fn();
const mockUpdateSelectedServiceItem = jest.fn();
const mockUpdateServiceItemHours = jest.fn();
const mockHasTypeChanged = jest.fn().mockReturnValue(false);
const mockPrefill = jest.fn();
const mockReset = jest.fn();

let mockHookState = {
  saving: false,
  saveError: null as string | null,
  saveSuccess: false,
  hoursValue: '10',
  inputError: null as string | null,
  estimateType: 'TOTAL_HOURS',
  serviceItemRows: [] as any[],
  selectedServiceItemId: '',
  serviceItemHoursValue: '',
  serviceItemInputError: null as string | null,
};

jest.mock('src/js/widgets/timeProject/hooks/useCreateEstimate', () => ({
  useCreateEstimate: () => ({
    ...mockHookState,
    updateHoursValue: mockUpdateHoursValue,
    changeEstimateType: mockChangeEstimateType,
    updateSelectedServiceItem: mockUpdateSelectedServiceItem,
    updateServiceItemHours: mockUpdateServiceItemHours,
    addServiceItem: mockAddServiceItem,
    removeServiceItem: mockRemoveServiceItem,
    editServiceItemHours: mockEditServiceItemHours,
    validateBeforeSave: mockValidateBeforeSave,
    saveEstimate: mockSaveEstimate,
    hasTypeChanged: mockHasTypeChanged,
    prefill: mockPrefill,
    reset: mockReset,
  }),
}));

const mockUpdateEstimate = jest.fn().mockResolvedValue(true);
jest.mock('src/js/widgets/timeProject/hooks/useUpdateEstimate', () => ({
  useUpdateEstimate: () => ({ updateEstimate: mockUpdateEstimate }),
}));

const mockDeleteEstimate = jest.fn().mockResolvedValue(true);
jest.mock('src/js/widgets/timeProject/hooks/useDeleteEstimate', () => ({
  useDeleteEstimate: () => ({ deleteEstimate: mockDeleteEstimate }),
}));

const mockSearchServiceItems = jest.fn();
jest.mock('src/js/widgets/timeProject/hooks/useServiceItemsList', () => ({
  useServiceItemsList: () => ({
    serviceItems: [
      { id: 'si1', name: 'Service Item 1' },
      { id: 'si2', name: 'Service Item 2' },
    ],
    serviceItemsLoading: false,
    serviceItemsHasMore: false,
    searchServiceItems: mockSearchServiceItems,
    loadMoreServiceItems: jest.fn(),
  }),
}));

let mockEstimatesMap: any = {};
// Default to "dirty" so the Save button is enabled in the majority of tests
// that simulate the user having entered/changed something. Tests that need
// the not-dirty path (e.g. close-without-modal) flip this back to false.
let mockIsDirty = true;

jest.mock('src/js/widgets/timeProject/store/estimateDrawerSlice', () => ({
  selectIsEstimateDrawerDirty: jest.fn(() => mockIsDirty),
}));

jest.mock('src/js/widgets/timeProject/store', () => ({
  useAppSelector: jest.fn((selector: any) =>
    selector({
      projects: { estimatesMap: mockEstimatesMap },
    }),
  ),
}));

jest.mock('src/js/service/utils/debounce', () => ({
  debounce: (fn: any) => fn,
}));

jest.mock('@ids-ts/drawer', () => ({
  Drawer: ({ children, onClose }: any) => (
    <div data-testid="create-estimate-drawer">
      <button data-testid="drawer-close" onClick={onClose}>
        Close
      </button>
      {children}
    </div>
  ),
  DrawerHeader: ({ title, onClose }: any) => (
    <div data-testid="drawer-header">{title}</div>
  ),
  DrawerContent: ({ children }: any) => <div>{children}</div>,
  DrawerFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@ids-ts/modal-dialog', () => ({
  Modal: ({ children, open, 'data-testid': testId }: any) =>
    open ? (
      <div data-testid={testId || 'change-type-modal'}>{children}</div>
    ) : null,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  ModalTitle: ({ title }: any) => <div>{title}</div>,
  ModalContent: ({ children }: any) => <div>{children}</div>,
  ModalActions: ({ children }: any) => <div>{children}</div>,
}));

jest.mock(
  '@ids-ts/text-field',
  () =>
    ({
      'data-testid': testId,
      type,
      value,
      onChange,
      'aria-label': ariaLabel,
    }: any) =>
      (
        <input
          data-testid={testId}
          type={type}
          value={value}
          onChange={onChange}
          aria-label={ariaLabel}
        />
      ),
);

jest.mock(
  '@ids-ts/button',
  () =>
    ({ children, 'data-testid': testId, onClick, disabled }: any) =>
      (
        <button data-testid={testId} onClick={onClick} disabled={disabled}>
          {children}
        </button>
      ),
);

jest.mock(
  '@ids-ts/page-message',
  () =>
    ({ children, 'data-testid': testId }: any) =>
      <div data-testid={testId}>{children}</div>,
);

jest.mock('@ids-ts/dropdown-typeahead', () => ({
  __esModule: true,
  default: ({
    'data-testid': testId,
    onFocus,
    onSearch,
    onBlur,
    onChange,
    dataSource,
  }: any) => (
    <div>
      <input
        data-testid={testId}
        onFocus={onFocus}
        onChange={(e) => onSearch?.(e)}
        onBlur={onBlur}
      />
      <select
        data-testid={`${testId}-select`}
        onChange={(e) => {
          const val = e.target.value;
          onChange?.(e, { selectedItem: { value: val } });
        }}
      >
        {dataSource?.map((item: any) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  ),
  MenuItem: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@ids-ts/typography', () => ({
  B2: ({ children }: any) => <span>{children}</span>,
  B3: ({ children }: any) => <span>{children}</span>,
}));

jest.mock(
  'src/js/widgets/timeProject/components/CreateEstimateDrawer.styled',
  () => {
    const createMock = (name: string) => {
      const Component = ({ children, 'data-testid': testId, onClick }: any) => (
        <div data-testid={testId || name} onClick={onClick}>
          {children}
        </div>
      );
      Component.displayName = name;
      return Component;
    };
    return {
      EstimateTypeSection: createMock('EstimateTypeSection'),
      RadioGroup: createMock('RadioGroup'),
      RadioOption: createMock('RadioOption'),
      RadioRow: createMock('RadioRow'),
      RadioInput: ({
        type,
        name,
        value,
        checked,
        onChange,
        'data-testid': testId,
      }: any) => (
        <input
          type={type}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          data-testid={testId}
        />
      ),
      RadioDescription: createMock('RadioDescription'),
      HoursInputSection: createMock('HoursInputSection'),
      InputWrapper: createMock('InputWrapper'),
      FooterContainer: createMock('FooterContainer'),
      ErrorContainer: createMock('ErrorContainer'),
      ServiceItemSection: createMock('ServiceItemSection'),
      ServiceItemInputRow: createMock('ServiceItemInputRow'),
      DropdownWrapper: createMock('DropdownWrapper'),
      HoursFieldWrapper: createMock('HoursFieldWrapper'),
      ServiceItemTable: createMock('ServiceItemTable'),
      TableHeader: ({ children }: any) => <th>{children}</th>,
      TableCell: ({ children }: any) => <td>{children}</td>,
      TotalRow: ({ children, 'data-testid': testId }: any) => (
        <tr data-testid={testId}>{children}</tr>
      ),
      TotalCell: ({ children }: any) => <td>{children}</td>,
      ActionWrapper: ({
        children,
        'data-testid': testId,
        onClick,
        onBlur,
      }: any) => (
        <div
          data-testid={testId || 'ActionWrapper'}
          onClick={onClick}
          onBlur={onBlur}
        >
          {children}
        </div>
      ),
      ActionButton: ({ children, 'data-testid': testId, onClick }: any) => (
        <button data-testid={testId} onClick={onClick}>
          {children}
        </button>
      ),
      ActionMenu: createMock('ActionMenu'),
      ActionMenuItem: ({ children, 'data-testid': testId, onClick }: any) => (
        <button data-testid={testId} onClick={onClick}>
          {children}
        </button>
      ),
      InlineEditInput: ({ 'data-testid': testId, onChange, value }: any) => (
        <input data-testid={testId} onChange={onChange} value={value} />
      ),
      InlineEditError: ({ 'data-testid': testId, children }: any) => (
        <div data-testid={testId}>{children}</div>
      ),
      SavingOverlay: ({
        children,
        'data-testid': testId,
        role,
        'aria-live': ariaLive,
        'aria-busy': ariaBusy,
      }: any) => (
        <div
          data-testid={testId || 'SavingOverlay'}
          role={role}
          aria-live={ariaLive}
          aria-busy={ariaBusy}
        >
          {children}
        </div>
      ),
    };
  },
);

const mockProject = {
  rowIndex: 0,
  uniqueId: '1',
  projectId: 'p1',
  projectName: 'Test Project',
  customerId: 'c1',
  customerName: 'Test Customer',
  status: 'IN_PROGRESS' as const,
  deadline: '',
  deadlineLabel: '',
  budget: '',
  budgetHoursTotal: 0,
  budgetHoursRemaining: 0,
  startDate: '',
  completedDate: '',
  active: true,
  description: '',
  customer: null,
};

describe('CreateEstimateDrawer', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCreateEstimateTrackingPoints.mockReturnValue(
      CREATE_ESTIMATE_TRACKING_POINTS,
    );
    mockHookState = {
      saving: false,
      saveError: null,
      saveSuccess: false,
      hoursValue: '10',
      inputError: null,
      estimateType: 'TOTAL_HOURS',
      serviceItemRows: [],
      selectedServiceItemId: '',
      serviceItemHoursValue: '',
      serviceItemInputError: null,
    };
    mockEstimatesMap = {};
    mockIsDirty = true;
  });

  it('renders the drawer', () => {
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('create-estimate-drawer')).toBeInTheDocument();
  });

  it('tracks CLOSE_CREATE_ESTIMATE on drawer close', () => {
    // When nothing is dirty, the close button skips the unsaved-changes
    // modal and closes the drawer immediately (which is what fires the
    // CLOSE_CREATE_ESTIMATE tracking event).
    mockIsDirty = false;
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('drawer-close'));
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.CLOSE_CREATE_ESTIMATE,
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('tracks ENABLE_BY_SERVICE_ITEM on radio change', () => {
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('estimate-type-service'));
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.ENABLE_BY_SERVICE_ITEM,
    );
    expect(mockChangeEstimateType).toHaveBeenCalledWith('BY_SERVICE_ITEM');
  });

  it('tracks ENABLE_BY_HOURS when switching back from service item', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('estimate-type-hours'));
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.ENABLE_BY_HOURS,
    );
    expect(mockChangeEstimateType).toHaveBeenCalledWith('TOTAL_HOURS');
  });

  it('tracks ENTER_HOURS_WORKED and updates value', () => {
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.change(screen.getByTestId('estimate-hours-input'), {
      target: { value: '5' },
    });
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.ENTER_HOURS_WORKED,
    );
    expect(mockUpdateHoursValue).toHaveBeenCalledWith('5');
  });

  it('tracks SAVE_ESTIMATE on save when validate passes', async () => {
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('estimate-save-button'));
    });
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.SAVE_ESTIMATE,
    );
  });

  it('does not save when validation fails', async () => {
    mockValidateBeforeSave.mockReturnValueOnce(false);
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('estimate-save-button'));
    });
    expect(mockSaveEstimate).not.toHaveBeenCalled();
  });

  it('renders service item rows with actions when type is BY_SERVICE_ITEM', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      {
        serviceItemId: 'si1',
        serviceItemName: 'Development',
        estimatedHours: 40,
      },
    ];
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.getByTestId('action-menu-si1')).toBeInTheDocument();
  });

  it('tracks CLICK_ELLIPSIS_SERVICE_ITEM on menu toggle', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      {
        serviceItemId: 'si1',
        serviceItemName: 'Development',
        estimatedHours: 40,
      },
    ];
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('action-menu-si1'));
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.CLICK_ELLIPSIS_SERVICE_ITEM,
    );
  });

  it('tracks SELECT_DELETE_SERVICE_ITEM on delete', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      {
        serviceItemId: 'si1',
        serviceItemName: 'Development',
        estimatedHours: 40,
      },
    ];
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('action-menu-si1'));
    fireEvent.click(screen.getByTestId('action-delete-si1'));
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.SELECT_DELETE_SERVICE_ITEM,
    );
    expect(mockRemoveServiceItem).toHaveBeenCalledWith('si1');
  });

  it('tracks EDIT_SERVICE_LINE_ITEM on edit row', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      {
        serviceItemId: 'si1',
        serviceItemName: 'Development',
        estimatedHours: 40,
      },
    ];
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('action-menu-si1'));
    fireEvent.click(screen.getByTestId('action-edit-si1'));
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.EDIT_SERVICE_LINE_ITEM,
    );
  });

  it('tracks ENTER_SERVICE_HOURS on service item hours change', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.change(screen.getByTestId('service-item-hours-input'), {
      target: { value: '8' },
    });
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.ENTER_SERVICE_HOURS,
    );
  });

  it('tracks ADD_SERVICE_ITEM_DETAILS on add button click', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.selectedServiceItemId = 'si1';
    mockHookState.serviceItemHoursValue = '10';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('service-item-add-button'));
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.ADD_SERVICE_ITEM_DETAILS,
    );
    expect(mockAddServiceItem).toHaveBeenCalled();
  });

  it('tracks CLICK_SERVICE_ITEM_DROPDOWN on focus', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.focus(screen.getByTestId('service-item-dropdown'));
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.CLICK_SERVICE_ITEM_DROPDOWN,
    );
  });

  it('tracks SELECT_SERVICE_ITEM_DROPDOWN on selection', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.change(screen.getByTestId('service-item-dropdown-select'), {
      target: { value: 'si1' },
    });
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.SELECT_SERVICE_ITEM_DROPDOWN,
    );
  });

  it('tracks EDIT_SERVICE_HOURS when inline edit input changes', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      {
        serviceItemId: 'si1',
        serviceItemName: 'Development',
        estimatedHours: 40,
      },
    ];
    const { rerender } = render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('action-menu-si1'));
    fireEvent.click(screen.getByTestId('action-edit-si1'));
    fireEvent.change(screen.getByTestId('inline-edit-input-si1'), {
      target: { value: '50' },
    });
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.EDIT_SERVICE_HOURS,
    );
  });

  it('shows success message when saveSuccess is true', () => {
    mockHookState.saveSuccess = true;
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('estimate-success-message')).toBeInTheDocument();
  });

  it('shows error message when saveError is set', () => {
    mockHookState.saveError = 'some.error.key';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('estimate-error-message')).toBeInTheDocument();
  });

  it('shows type change modal when editing and type has changed', async () => {
    mockHasTypeChanged.mockReturnValue(true);
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        isEdit
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('estimate-save-button'));
    });
    expect(screen.getByTestId('change-type-modal')).toBeInTheDocument();
  });

  it('tracks CANCEL_ESTIMATE_TYPE_CHANGE when cancel is clicked in modal', async () => {
    mockHasTypeChanged.mockReturnValue(true);
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        isEdit
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('estimate-save-button'));
    });
    fireEvent.click(screen.getByTestId('change-type-cancel'));
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.CANCEL_ESTIMATE_TYPE_CHANGE,
    );
  });

  it('tracks CHANGE_ESTIMATE_TYPE when continue is clicked in modal', async () => {
    mockHasTypeChanged.mockReturnValue(true);
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        isEdit
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('estimate-save-button'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-type-continue'));
    });
    expect(mockTrack).toHaveBeenCalledWith(
      CREATE_ESTIMATE_TRACKING_POINTS.CHANGE_ESTIMATE_TYPE,
    );
  });

  it('prefills data when isEdit is true and estimate exists', () => {
    mockEstimatesMap = {
      p1: {
        projectEstimateType: 'TOTAL_HOURS',
        budgetHoursTotal: 20,
        budgetHoursRemaining: 10,
        elapsedSeconds: 36000,
        estimateItems: [],
      },
    };
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        isEdit
      />,
    );
    expect(mockPrefill).toHaveBeenCalled();
  });

  it('shows unsaved changes modal on close when redux says dirty', () => {
    mockIsDirty = true;
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('drawer-close'));
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(
      screen.getByTestId('estimate-unsaved-changes-modal'),
    ).toBeInTheDocument();
  });

  it('closes immediately without modal when redux says not dirty', () => {
    mockIsDirty = false;
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('drawer-close'));
    expect(mockOnClose).toHaveBeenCalled();
    expect(
      screen.queryByTestId('estimate-unsaved-changes-modal'),
    ).not.toBeInTheDocument();
  });

  it('handles service item search input', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.change(screen.getByTestId('service-item-dropdown'), {
      target: { value: 'test search' },
    });
    expect(mockSearchServiceItems).toHaveBeenCalledWith('test search');
  });

  it('handles service item blur', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.blur(screen.getByTestId('service-item-dropdown'));
    expect(mockSearchServiceItems).toHaveBeenCalledWith('');
  });

  it('calls updateEstimate when isEdit and save succeeds', async () => {
    mockHookState.hoursValue = '10';
    mockHasTypeChanged.mockReturnValue(false);
    mockValidateBeforeSave.mockReturnValue(true);
    mockUpdateEstimate.mockResolvedValue(true);
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        isEdit
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('estimate-save-button'));
    });
    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith(
        CREATE_ESTIMATE_TRACKING_POINTS.SAVE_ESTIMATE,
      );
      expect(mockUpdateEstimate).toHaveBeenCalled();
    });
  });

  it('disables save when saving is in progress', () => {
    mockHookState.saving = true;
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('estimate-save-button')).toBeDisabled();
  });

  it('renders the saving overlay while a save mutation is in flight', () => {
    mockHookState.saving = true;
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('estimate-saving-overlay')).toBeInTheDocument();
  });

  // Regression: after a successful save we hold the spinner up across the
  // parent's refetch (`onSuccess` returns a promise) so the user never sees
  // the drawer disappear while the summary view is still rebuilding. Once
  // `onSuccess` resolves the overlay should clear.
  it('keeps the saving overlay up until the async onSuccess resolves', async () => {
    let resolveOnSuccess: (() => void) | undefined;
    const onSuccess = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveOnSuccess = resolve;
        }),
    );

    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={onSuccess}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('estimate-save-button'));
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(screen.getByTestId('estimate-saving-overlay')).toBeInTheDocument();

    await act(async () => {
      resolveOnSuccess?.();
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId('estimate-saving-overlay'),
      ).not.toBeInTheDocument();
    });
  });

  it('disables save for service items when no rows added', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [];
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('estimate-save-button')).toBeDisabled();
  });

  // Editing an existing TOTAL_HOURS estimate and switching the type to
  // BY_SERVICE_ITEM should not allow Save until at least one service item
  // is added - otherwise the user could accidentally wipe out their hours
  // estimate just by toggling the radio.
  it('disables save in edit mode when type was switched and no rows added', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [];
    mockHasTypeChanged.mockReturnValue(true);
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        isEdit
      />,
    );
    expect(screen.getByTestId('estimate-save-button')).toBeDisabled();
  });

  // The "save with no rows == delete estimate" affordance should still be
  // available when the original estimate was already a service-item estimate.
  it('enables save in edit mode for empty service-item list when type unchanged', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [];
    mockHasTypeChanged.mockReturnValue(false);
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        isEdit
      />,
    );
    expect(screen.getByTestId('estimate-save-button')).not.toBeDisabled();
  });

  it('displays input error', () => {
    mockHookState.inputError = 'timeProject.estimate.error.invalidHours';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('estimate-hours-input')).toBeInTheDocument();
  });

  it('renders total row in service item table', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      {
        serviceItemId: 'si1',
        serviceItemName: 'Dev',
        estimatedHours: 20,
      },
      {
        serviceItemId: 'si2',
        serviceItemName: 'Design',
        estimatedHours: 15,
      },
    ];
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByText('Dev')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByTestId('service-item-total-row')).toBeInTheDocument();
  });

  it('disables add button when no service item selected', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.selectedServiceItemId = '';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('service-item-add-button')).toBeDisabled();
  });

  it('saves with editingRowId active and valid hours for service item', async () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      { serviceItemId: 'si1', serviceItemName: 'Dev', estimatedHours: 40 },
    ];
    mockValidateBeforeSave.mockReturnValue(true);
    mockSaveEstimate.mockResolvedValue(true);

    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('action-menu-si1'));
    fireEvent.click(screen.getByTestId('action-edit-si1'));
    fireEvent.change(screen.getByTestId('inline-edit-input-si1'), {
      target: { value: '50' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('estimate-save-button'));
    });
    expect(mockEditServiceItemHours).toHaveBeenCalledWith('si1', 50);
  });

  it('saves with editingRowId active but invalid hours (NaN)', async () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      { serviceItemId: 'si1', serviceItemName: 'Dev', estimatedHours: 40 },
    ];
    mockValidateBeforeSave.mockReturnValue(true);
    mockSaveEstimate.mockResolvedValue(true);

    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('action-menu-si1'));
    fireEvent.click(screen.getByTestId('action-edit-si1'));
    fireEvent.change(screen.getByTestId('inline-edit-input-si1'), {
      target: { value: 'abc' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('estimate-save-button'));
    });
    expect(mockEditServiceItemHours).not.toHaveBeenCalled();
  });

  it('handles type change continue when deleteEstimate fails', async () => {
    mockHasTypeChanged.mockReturnValue(true);
    mockDeleteEstimate.mockResolvedValue(false);

    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        isEdit
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('estimate-save-button'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-type-continue'));
    });
    expect(mockSaveEstimate).not.toHaveBeenCalled();
  });

  it('handles type change continue when saveEstimate fails', async () => {
    mockHasTypeChanged.mockReturnValue(true);
    mockDeleteEstimate.mockResolvedValue(true);
    mockSaveEstimate.mockResolvedValue(false);

    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        isEdit
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('estimate-save-button'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('change-type-continue'));
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('disables save when hoursValue is empty for TOTAL_HOURS', () => {
    mockHookState.hoursValue = '';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('estimate-save-button')).toBeDisabled();
  });

  it('disables save when inputError is set for TOTAL_HOURS', () => {
    mockHookState.inputError = 'some.error';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('estimate-save-button')).toBeDisabled();
  });

  it('disables add button when serviceItemInputError is set', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.selectedServiceItemId = 'si1';
    mockHookState.serviceItemHoursValue = '10';
    mockHookState.serviceItemInputError = 'some.error';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('service-item-add-button')).toBeDisabled();
  });

  it('enables add button when service item is selected even if hours empty', () => {
    // Hours are OPTIONAL for service items - empty hours default to 0 on
    // save, so the only requirement to enable "+ Add" is having a selected
    // service item.
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.selectedServiceItemId = 'si1';
    mockHookState.serviceItemHoursValue = '';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('service-item-add-button')).not.toBeDisabled();
  });

  it('disables add button when no service item is selected', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.selectedServiceItemId = '';
    mockHookState.serviceItemHoursValue = '10';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    expect(screen.getByTestId('service-item-add-button')).toBeDisabled();
  });

  it('resets editing state when deleting the currently edited row', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      { serviceItemId: 'si1', serviceItemName: 'Dev', estimatedHours: 40 },
    ];
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('action-menu-si1'));
    fireEvent.click(screen.getByTestId('action-edit-si1'));
    expect(screen.getByTestId('inline-edit-input-si1')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('action-menu-si1'));
    fireEvent.click(screen.getByTestId('action-delete-si1'));
    expect(mockRemoveServiceItem).toHaveBeenCalledWith('si1');
  });

  it('toggles menu off when clicking same service item menu twice', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      { serviceItemId: 'si1', serviceItemName: 'Dev', estimatedHours: 40 },
    ];
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('action-menu-si1'));
    expect(screen.getByTestId('action-edit-si1')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('action-menu-si1'));
    expect(screen.queryByTestId('action-edit-si1')).not.toBeInTheDocument();
  });

  it('closes the action menu when focus leaves the wrapper', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      { serviceItemId: 'si1', serviceItemName: 'Dev', estimatedHours: 40 },
    ];
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    fireEvent.click(screen.getByTestId('action-menu-si1'));
    expect(screen.getByTestId('action-edit-si1')).toBeInTheDocument();

    // Simulate focus moving to an element outside the wrapper (e.g. user
    // tabbing to or clicking the Save button). React `onBlur` bubbles, so
    // this fires on the wrapper with a relatedTarget that isn't a child.
    const trigger = screen.getByTestId('action-menu-si1');
    const outside = screen.getByTestId('estimate-save-button');
    fireEvent.blur(trigger, { relatedTarget: outside });

    expect(screen.queryByTestId('action-edit-si1')).not.toBeInTheDocument();
  });

  it('closes the action menu when focus is lost to a non-focusable area', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      { serviceItemId: 'si1', serviceItemName: 'Dev', estimatedHours: 40 },
    ];
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    fireEvent.click(screen.getByTestId('action-menu-si1'));
    expect(screen.getByTestId('action-edit-si1')).toBeInTheDocument();

    // Click on a non-focusable element -> browser blurs the trigger with
    // `relatedTarget = null`. The menu should still dismiss.
    fireEvent.blur(screen.getByTestId('action-menu-si1'), {
      relatedTarget: null,
    });

    expect(screen.queryByTestId('action-edit-si1')).not.toBeInTheDocument();
  });

  it('keeps the action menu open when focus moves between trigger and items', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    mockHookState.serviceItemRows = [
      { serviceItemId: 'si1', serviceItemName: 'Dev', estimatedHours: 40 },
    ];
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    fireEvent.click(screen.getByTestId('action-menu-si1'));
    const editItem = screen.getByTestId('action-edit-si1');

    // Focus moves from trigger -> Edit menu item, both inside the wrapper.
    fireEvent.blur(screen.getByTestId('action-menu-si1'), {
      relatedTarget: editItem,
    });

    expect(screen.getByTestId('action-edit-si1')).toBeInTheDocument();
  });

  it('calls reset on unmount cleanup', () => {
    const { unmount } = render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    unmount();
    expect(mockReset).toHaveBeenCalled();
  });

  it('shows edit drawer title when isEdit is true', () => {
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        isEdit
      />,
    );
    expect(screen.getByTestId('drawer-header')).toBeInTheDocument();
  });

  it('handles save returning false and not calling onSuccess', async () => {
    mockSaveEstimate.mockResolvedValue(false);
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('estimate-save-button'));
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('handles service item select with no selectedItem', () => {
    mockHookState.estimateType = 'BY_SERVICE_ITEM';
    render(
      <CreateEstimateDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
    const dropdown = screen.getByTestId('service-item-dropdown-select');
    fireEvent.change(dropdown, { target: { value: '' } });
    expect(mockUpdateSelectedServiceItem).not.toHaveBeenCalled();
  });
});
