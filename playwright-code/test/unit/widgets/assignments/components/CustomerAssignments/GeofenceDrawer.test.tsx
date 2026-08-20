import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GeofenceDrawer from 'src/js/widgets/assignments/components/CustomerAssignments/components/GeofenceDrawer';
import { GEOFENCE_RADIUS } from 'src/js/widgets/assignments/constants';
import { GEOFENCE_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';

const mockGeofenceState: {
  nodes: any[];
  loading: boolean;
  error: string | null;
  overrides: Record<string, boolean>;
} = {
  nodes: [
    {
      timeAgainstContactDAS: { customer: { id: 'cust-1' } },
      geofenceEnabled: { value: false },
      geofenceLocation: null,
    },
  ],
  loading: false,
  error: null,
  overrides: {},
};

const mockGeofenceLocationSearchState = {
  selectedPlace: null,
  addressInput: '',
  predictions: [],
  radiusSearchText: null as string | null,
  mapReady: false,
  addressError: false,
  radiusError: false,
  resolvedPlaceId: '',
  geofenceOn: false,
  radius: GEOFENCE_RADIUS.DEFAULT,
  saveError: null as string | null,
};

// Smart dispatch that keeps mock geofenceOn/radius in sync so the component
// re-reads the right value from the selector mock on each render.
const mockDispatch = jest.fn().mockImplementation((action: any) => {
  if (action?.type === 'geofenceLocationSearch/setGeofenceOn') {
    mockGeofenceLocationSearchState.geofenceOn = action.payload;
  }
  if (action?.type === 'geofenceLocationSearch/setRadius') {
    mockGeofenceLocationSearchState.radius = action.payload;
  }
  if (action?.type === 'geofenceLocationSearch/setSaveError') {
    mockGeofenceLocationSearchState.saveError = action.payload;
  }
  if (action?.type === 'geofenceLocationSearch/clearSelectedPlace') {
    mockGeofenceLocationSearchState.selectedPlace = null;
    mockGeofenceLocationSearchState.addressInput = '';
    mockGeofenceLocationSearchState.predictions = [];
    mockGeofenceLocationSearchState.resolvedPlaceId = '';
  }
});

jest.mock('src/js/widgets/assignments/store/hooks', () => ({
  useAppSelector: (selector: (state: any) => any) =>
    selector({
      geofenceConfiguration: mockGeofenceState,
      geofenceLocationSearch: mockGeofenceLocationSearchState,
    }),
  useAppDispatch: () => mockDispatch,
}));

let mockMutationOnSuccess: (() => void) | undefined;
let mockMutationLoading = false;
const mockMutate = jest.fn().mockImplementation(() => {
  mockMutationOnSuccess?.();
  return Promise.resolve({});
});

jest.mock(
  'src/js/service/hooks/assignments/useUpdateGeofenceConfiguration',
  () => ({
    useUpdateGeofenceConfiguration: ({ onSuccess }: any = {}) => {
      mockMutationOnSuccess = onSuccess;
      return [mockMutate, { loading: mockMutationLoading }];
    },
  }),
);

const mockExtractGeofenceAddressFields = jest.fn().mockReturnValue({});
jest.mock('src/js/widgets/assignments/utils/geofenceUtils', () => ({
  ...jest.requireActual('src/js/widgets/assignments/utils/geofenceUtils'),
  extractGeofenceAddressFields: (...args: any[]) =>
    mockExtractGeofenceAddressFields(...args),
}));

const mockNavigate = jest.fn();
const mockTrack = jest.fn();
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: jest.fn(({ id }) => id),
  }),
  useSandbox: () => ({
    navigation: { navigate: mockNavigate },
  }),
  useTracking: () => mockTrack,
}));

jest.mock('src/js/widgets/assignments/styles/GeofenceDrawer.styled', () => ({
  StyledDrawerHeader: ({ title, onClose, children }: any) => (
    <div data-testid="drawer-header">
      <span>{title}</span>
      <button data-testid="drawer-header-close" onClick={onClose}>
        Close
      </button>
      {children}
    </div>
  ),
  StyledDrawerContent: ({ children }: any) => (
    <div data-testid="drawer-content">{children}</div>
  ),
  ContentWrapper: ({ children }: any) => (
    <div data-testid="content-wrapper">{children}</div>
  ),
  CustomerName: ({ children }: any) => (
    <span data-testid="customer-name">{children}</span>
  ),
  AddressText: ({ children }: any) => (
    <span data-testid="address-text">{children}</span>
  ),
  DescriptionText: ({ children }: any) => (
    <p data-testid="description-text">{children}</p>
  ),
  AssignNote: ({ children }: any) => (
    <p data-testid="assign-note">{children}</p>
  ),
  ToggleRow: ({ children }: any) => (
    <div data-testid="toggle-row">{children}</div>
  ),
  ToggleLabel: ({ children }: any) => (
    <span data-testid="toggle-label">{children}</span>
  ),
  FooterButtonsContainer: ({ children }: any) => (
    <div data-testid="footer-buttons">{children}</div>
  ),
  HeaderContent: ({ children }: any) => (
    <div data-testid="header-content">{children}</div>
  ),
  LoadingWrapper: ({ children }: any) => (
    <div data-testid="loading-wrapper">{children}</div>
  ),
  GeofenceDropdownMenuFix: () => null,
}));

jest.mock('@ids-ts/drawer', () => ({
  Drawer: ({ children, open }: any) =>
    open ? <div data-testid="drawer">{children}</div> : null,
  DrawerFooter: ({ children }: any) => (
    <div data-testid="drawer-footer">{children}</div>
  ),
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick, priority, disabled }: any) => (
    <button
      onClick={onClick}
      data-testid={`button-${priority}`}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  __esModule: true,
  Activity: ({ shape, size }: { shape: string; size: string }) => (
    <div data-testid="activity-loader" data-shape={shape} data-size={size}>
      Loading...
    </div>
  ),
}));

jest.mock('@ids-ts/switch', () => ({
  __esModule: true,
  default: ({ checked, onChange, 'aria-label': ariaLabel }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      data-testid="geofence-switch"
    />
  ),
}));

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ children, type, onClose }: any) => (
    <div data-testid="page-message" data-type={type}>
      {children}
      <button data-testid="page-message-close" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

jest.mock(
  'src/js/widgets/assignments/components/CustomerAssignments/components/GeofenceLocationFields',
  () => ({
    __esModule: true,
    default: ({ addressValue }: any) => (
      <div data-testid="geofence-location-fields">
        <span data-testid="location-address">{addressValue}</span>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/common/AssignmentDrawer/components/UnsavedChangesModal',
  () => ({
    UnsavedChangesModal: ({ open, onSave, onDontSave, onClose }: any) =>
      open ? (
        <div data-testid="unsaved-changes-modal">
          <button data-testid="modal-save-btn" onClick={onSave}>
            Save
          </button>
          <button data-testid="modal-dont-save-btn" onClick={onDontSave}>
            Don&apos;t Save
          </button>
          <button data-testid="modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      ) : null,
  }),
);

describe('GeofenceDrawer', () => {
  const defaultProps = {
    open: true,
    entityId: 'cust-1',
    timeAgainst: { customerId: 'cust-1' } as const,
    geofenceInfo: {
      entityId: 'cust-1',
      customerName: 'Acme Corp',
      customerAddress: '123 Main St',
      geofenceEnabled: false,
      geofenceEnabledVersion: null,
      geofenceLocation: null,
      geofenceLocationVersion: null,
    },
    onSave: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockClear();
    mockMutate.mockClear();
    mockMutationLoading = false;
    mockExtractGeofenceAddressFields.mockReturnValue({});
    mockGeofenceState.loading = false;
    mockGeofenceState.error = null;
    mockGeofenceState.nodes = [
      {
        timeAgainstContactDAS: { customer: { id: 'cust-1' } },
        geofenceEnabled: { value: false },
        geofenceLocation: null,
      },
    ];
    mockGeofenceLocationSearchState.geofenceOn = false;
    mockGeofenceLocationSearchState.radius = GEOFENCE_RADIUS.DEFAULT;
    mockGeofenceLocationSearchState.selectedPlace = null;
    mockGeofenceLocationSearchState.saveError = null;
    mockGeofenceLocationSearchState.addressError = false;
    mockGeofenceLocationSearchState.radiusError = false;
  });

  describe('Loading State', () => {
    it('should show loading indicator when Redux loading is true', () => {
      mockGeofenceState.loading = true;
      render(<GeofenceDrawer {...defaultProps} />);

      expect(screen.getByTestId('loading-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
    });

    it('should not show customer content when loading', () => {
      mockGeofenceState.loading = true;
      render(<GeofenceDrawer {...defaultProps} />);

      expect(screen.queryByTestId('customer-name')).not.toBeInTheDocument();
      expect(screen.queryByTestId('toggle-row')).not.toBeInTheDocument();
      expect(screen.queryByTestId('geofence-switch')).not.toBeInTheDocument();
    });

    it('should disable save button when loading', () => {
      mockGeofenceState.loading = true;
      render(<GeofenceDrawer {...defaultProps} />);

      const saveBtn = screen.getByTestId('button-primary');
      expect(saveBtn).toBeDisabled();
    });

    it('should render drawer with loading when open', () => {
      mockGeofenceState.loading = true;
      render(<GeofenceDrawer {...defaultProps} />);

      expect(screen.getByTestId('drawer')).toBeInTheDocument();
      expect(screen.getByTestId('loading-wrapper')).toBeInTheDocument();
    });
  });

  describe('Mutation Loading State', () => {
    it('should show activity loader instead of toggle and fields when mutation is loading', () => {
      mockMutationLoading = true;
      mockGeofenceLocationSearchState.geofenceOn = true;
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      expect(screen.getByTestId('loading-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
      expect(screen.queryByTestId('geofence-switch')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('geofence-location-fields'),
      ).not.toBeInTheDocument();
    });

    it('should still show customer name and description when mutation is loading', () => {
      mockMutationLoading = true;
      render(<GeofenceDrawer {...defaultProps} />);

      expect(screen.getByTestId('customer-name')).toHaveTextContent(
        'Acme Corp',
      );
      expect(screen.getByTestId('description-text')).toBeInTheDocument();
      expect(screen.getByTestId('assign-note')).toBeInTheDocument();
    });

    it('should disable save button when mutation is loading', () => {
      mockMutationLoading = true;
      mockGeofenceLocationSearchState.geofenceOn = true;
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: false },
          geofenceLocation: {
            latitude: 37.7749,
            longitude: -122.4194,
            geofenceRadiusInMeter: GEOFENCE_RADIUS.DEFAULT,
          },
        },
      ];
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      const saveBtn = screen.getByTestId('button-primary');
      expect(saveBtn).toBeDisabled();
    });

    it('should show save text in button even when mutation is loading', () => {
      mockMutationLoading = true;
      render(<GeofenceDrawer {...defaultProps} />);

      expect(
        screen.getByText('assignments.geofence.drawer.save'),
      ).toBeInTheDocument();
    });
  });

  describe('Basic Rendering', () => {
    it('should not render when closed', () => {
      render(<GeofenceDrawer {...defaultProps} open={false} />);

      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });

    it('should render when open', async () => {
      render(<GeofenceDrawer {...defaultProps} />);

      expect(screen.getByTestId('drawer')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId('customer-name')).toBeInTheDocument();
      });
    });

    it('should display the drawer title', async () => {
      render(<GeofenceDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('assignments.geofence.drawer.title'),
        ).toBeInTheDocument();
      });
    });

    it('should display the customer name', async () => {
      render(<GeofenceDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-name')).toHaveTextContent(
          'Acme Corp',
        );
      });
    });

    it('should display the description text', async () => {
      render(<GeofenceDrawer {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByTestId('description-text')).toBeInTheDocument();
      });

      expect(
        screen.getByText('assignments.geofence.drawer.description'),
      ).toBeInTheDocument();
    });

    it('should display the manage settings link', async () => {
      render(<GeofenceDrawer {...defaultProps} />);
      await waitFor(() => {
        expect(
          screen.getByText('assignments.geofence.drawer.manageSettings'),
        ).toBeInTheDocument();
      });

      const link = screen.getByText(
        'assignments.geofence.drawer.manageSettings',
      );
      expect(link.closest('a')).toHaveAttribute(
        'href',
        '/app/accountsettings?p=time',
      );
    });

    it('should navigate via sandbox when manage settings link is clicked', async () => {
      render(<GeofenceDrawer {...defaultProps} />);

      const link = await screen.findByText(
        'assignments.geofence.drawer.manageSettings',
      );
      fireEvent.click(link);

      expect(mockNavigate).toHaveBeenCalledWith('/app/accountsettings?p=time');
    });

    it('should display the assign note', async () => {
      render(<GeofenceDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('assignments.geofence.drawer.assignNote'),
        ).toBeInTheDocument();
      });
    });

    it('should display the toggle label', async () => {
      render(<GeofenceDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('assignments.geofence.drawer.toggleLabel'),
        ).toBeInTheDocument();
      });
    });

    it('should initialize toggle from Redux when initialGeofenceOn omitted', async () => {
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: true },
          geofenceLocation: null,
        },
      ];
      // Pre-seed mock state to match what the useEffect dispatch would set
      mockGeofenceLocationSearchState.geofenceOn = true;
      render(<GeofenceDrawer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('geofence-switch')).toBeChecked();
      });
    });
  });

  describe('Toggle Behavior', () => {
    it('should initialize toggle to off when initialGeofenceOn is false', async () => {
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);

      const toggle = await screen.findByTestId('geofence-switch');
      expect(toggle).not.toBeChecked();
    });

    it('should initialize toggle to on when initialGeofenceOn is true', async () => {
      mockGeofenceLocationSearchState.geofenceOn = true;
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      await waitFor(() => {
        expect(screen.getByTestId('geofence-switch')).toBeChecked();
      });
    });

    it('should toggle geofence on when switch is clicked', async () => {
      const { rerender } = render(
        <GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />,
      );

      const toggle = await screen.findByTestId('geofence-switch');
      fireEvent.click(toggle);

      rerender(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);

      await waitFor(() => {
        expect(screen.getByTestId('geofence-switch')).toBeChecked();
      });
    });

    it('should toggle geofence off when switch is clicked twice', async () => {
      const { rerender } = render(
        <GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />,
      );

      const toggle = await screen.findByTestId('geofence-switch');
      fireEvent.click(toggle);
      rerender(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);
      await waitFor(() => expect(toggle).toBeChecked());

      fireEvent.click(toggle);
      rerender(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);
      await waitFor(() => expect(toggle).not.toBeChecked());
    });
  });

  describe('GeofenceLocationFields', () => {
    it('should not show location fields when geofence is off', async () => {
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);

      await waitFor(() => {
        expect(screen.getByTestId('geofence-switch')).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId('geofence-location-fields'),
      ).not.toBeInTheDocument();
    });

    it('should show location fields when geofence is on', async () => {
      mockGeofenceLocationSearchState.geofenceOn = true;
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      expect(
        await screen.findByTestId('geofence-location-fields'),
      ).toBeInTheDocument();
    });

    it('should show location fields after toggling on', async () => {
      const { rerender } = render(
        <GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('geofence-switch')).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId('geofence-location-fields'),
      ).not.toBeInTheDocument();

      const toggle = screen.getByTestId('geofence-switch');
      fireEvent.click(toggle);

      rerender(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('geofence-location-fields'),
        ).toBeInTheDocument();
      });
    });

    it('should hide location fields after toggling off', async () => {
      mockGeofenceLocationSearchState.geofenceOn = true;
      const { rerender } = render(
        <GeofenceDrawer {...defaultProps} initialGeofenceOn />,
      );

      expect(
        await screen.findByTestId('geofence-location-fields'),
      ).toBeInTheDocument();

      const toggle = screen.getByTestId('geofence-switch');
      fireEvent.click(toggle);

      rerender(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      await waitFor(() => {
        expect(
          screen.queryByTestId('geofence-location-fields'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Footer Buttons', () => {
    it('should render cancel and save buttons', async () => {
      render(<GeofenceDrawer {...defaultProps} />);

      expect(
        await screen.findByText('assignments.geofence.drawer.cancel'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('assignments.geofence.drawer.save'),
      ).toBeInTheDocument();
    });

    it('should call onClose when cancel button is clicked with no unsaved changes', async () => {
      (mockGeofenceLocationSearchState as any).selectedPlace = {
        label: defaultProps.geofenceInfo.customerAddress,
      };
      render(<GeofenceDrawer {...defaultProps} />);

      const cancelBtn = await screen.findByText(
        'assignments.geofence.drawer.cancel',
      );
      fireEvent.click(cancelBtn);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSave with false when geofence is off and save is clicked', async () => {
      // API has geofence on; user has turned it off so there are changes and Save is enabled.
      // useUpdateGeofenceConfiguration mock calls onSuccess synchronously → onSave is invoked.
      mockGeofenceState.nodes[0].geofenceEnabled = { value: true };
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);

      const saveBtn = await screen.findByText(
        'assignments.geofence.drawer.save',
      );
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(false);
      });
    });

    it('should call onSave with true when geofence is on and save is clicked', async () => {
      mockGeofenceLocationSearchState.geofenceOn = true;
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: false },
          geofenceLocation: {
            latitude: 37.7749,
            longitude: -122.4194,
            geofenceRadiusInMeter: GEOFENCE_RADIUS.DEFAULT,
          },
        },
      ];
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      const saveBtn = await screen.findByText(
        'assignments.geofence.drawer.save',
      );
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(true);
      });
    });

    it('should call onSave with toggled value after user toggles and saves', async () => {
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: false },
          geofenceLocation: {
            latitude: 37.7749,
            longitude: -122.4194,
            geofenceRadiusInMeter: GEOFENCE_RADIUS.DEFAULT,
          },
        },
      ];
      const { rerender } = render(
        <GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />,
      );

      const toggle = await screen.findByTestId('geofence-switch');
      fireEvent.click(toggle);

      rerender(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);
      await waitFor(() => expect(toggle).toBeChecked());

      const saveBtn = screen.getByText('assignments.geofence.drawer.save');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('hasChanges – toggle ON from table', () => {
    it('should disable save when initialGeofenceOn is true, API also says true, and no other changes', async () => {
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: true },
          geofenceLocation: null,
        },
      ];
      mockGeofenceLocationSearchState.geofenceOn = true;
      (mockGeofenceLocationSearchState as any).selectedPlace = {
        label: defaultProps.geofenceInfo.customerAddress,
      };
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      const saveBtn = await screen.findByTestId('button-primary');
      expect(saveBtn).toBeDisabled();
    });

    it('should disable save when user toggles OFF in drawer from table toggle-ON because API was already OFF', async () => {
      mockGeofenceLocationSearchState.geofenceOn = true;
      (mockGeofenceLocationSearchState as any).selectedPlace = {
        label: defaultProps.geofenceInfo.customerAddress,
      };
      const { rerender } = render(
        <GeofenceDrawer {...defaultProps} initialGeofenceOn />,
      );

      const toggle = await screen.findByTestId('geofence-switch');
      fireEvent.click(toggle);

      rerender(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      await waitFor(() => {
        const saveBtn = screen.getByTestId('button-primary');
        expect(saveBtn).toBeDisabled();
      });
    });
  });

  describe('Address Prop', () => {
    it('should default address to empty string when not provided', async () => {
      const propsWithoutAddress = {
        ...defaultProps,
        geofenceInfo: {
          ...defaultProps.geofenceInfo,
          customerAddress: '',
        },
        initialGeofenceOn: true as const,
      };

      mockGeofenceLocationSearchState.geofenceOn = true;
      render(<GeofenceDrawer {...propsWithoutAddress} />);

      expect((await screen.findByTestId('location-address')).textContent).toBe(
        '',
      );
    });
  });

  describe('Open/Close Transitions', () => {
    it('should render when open prop changes from false to true', () => {
      const { rerender } = render(
        <GeofenceDrawer {...defaultProps} open={false} />,
      );

      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();

      rerender(<GeofenceDrawer {...defaultProps} open />);

      expect(screen.getByTestId('drawer')).toBeInTheDocument();
    });

    it('should hide when open prop changes from true to false', () => {
      const { rerender } = render(<GeofenceDrawer {...defaultProps} open />);

      expect(screen.getByTestId('drawer')).toBeInTheDocument();

      rerender(<GeofenceDrawer {...defaultProps} open={false} />);

      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });

    it('should clear errors when drawer opens', () => {
      mockDispatch.mockClear();
      render(<GeofenceDrawer {...defaultProps} open />);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'geofenceLocationSearch/setSaveError',
          payload: null,
        }),
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'geofenceLocationSearch/setAddressError',
          payload: false,
        }),
      );
    });
  });

  describe('Unsaved Changes Modal', () => {
    it('should not show modal when there are no changes and cancel is clicked', async () => {
      (mockGeofenceLocationSearchState as any).selectedPlace = {
        label: defaultProps.geofenceInfo.customerAddress,
      };
      render(<GeofenceDrawer {...defaultProps} />);

      const cancelBtn = await screen.findByText(
        'assignments.geofence.drawer.cancel',
      );
      fireEvent.click(cancelBtn);

      expect(
        screen.queryByTestId('unsaved-changes-modal'),
      ).not.toBeInTheDocument();
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should show modal when there are unsaved changes and cancel is clicked', async () => {
      const { rerender } = render(
        <GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />,
      );

      const toggle = await screen.findByTestId('geofence-switch');
      fireEvent.click(toggle);
      rerender(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);

      const cancelBtn = screen.getByText('assignments.geofence.drawer.cancel');
      fireEvent.click(cancelBtn);

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should show modal when there are unsaved changes and header close is clicked', async () => {
      const { rerender } = render(
        <GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />,
      );

      const toggle = await screen.findByTestId('geofence-switch');
      fireEvent.click(toggle);
      rerender(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);

      const headerClose = screen.getByTestId('drawer-header-close');
      fireEvent.click(headerClose);

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should close drawer without saving when "Don\'t Save" is clicked in modal', async () => {
      const { rerender } = render(
        <GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />,
      );

      const toggle = await screen.findByTestId('geofence-switch');
      fireEvent.click(toggle);
      rerender(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);

      fireEvent.click(screen.getByTestId('drawer-header-close'));
      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('modal-dont-save-btn'));

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('should trigger save when "Save" is clicked in modal', async () => {
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: false },
          geofenceLocation: {
            latitude: 37.7749,
            longitude: -122.4194,
            geofenceRadiusInMeter: GEOFENCE_RADIUS.DEFAULT,
          },
        },
      ];
      mockGeofenceLocationSearchState.geofenceOn = true;

      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      await screen.findByTestId('geofence-switch');

      fireEvent.click(screen.getByTestId('drawer-header-close'));

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('modal-save-btn'));

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(true);
      });
    });

    it('should dismiss modal when modal close button is clicked without closing drawer', async () => {
      const { rerender } = render(
        <GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />,
      );

      const toggle = await screen.findByTestId('geofence-switch');
      fireEvent.click(toggle);
      rerender(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);

      fireEvent.click(screen.getByTestId('drawer-header-close'));
      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('modal-close-btn'));

      expect(
        screen.queryByTestId('unsaved-changes-modal'),
      ).not.toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Radius initialisation', () => {
    it('should reset radius to default when node has no saved radius', () => {
      (mockGeofenceLocationSearchState as any).radius = 500;
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: false },
          geofenceLocation: null,
        },
      ];
      render(<GeofenceDrawer {...defaultProps} />);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'geofenceLocationSearch/setRadius',
          payload: GEOFENCE_RADIUS.DEFAULT,
        }),
      );
    });

    it('should set radius from node when saved radius exists', () => {
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: false },
          geofenceLocation: {
            latitude: 37.7749,
            longitude: -122.4194,
            geofenceRadiusInMeter: 350,
          },
        },
      ];
      render(<GeofenceDrawer {...defaultProps} />);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'geofenceLocationSearch/setRadius',
          payload: 350,
        }),
      );
    });
  });

  describe('Tracking', () => {
    it('should track VIEW_GEOFENCE_DRAWER when drawer opens', () => {
      render(<GeofenceDrawer {...defaultProps} />);

      expect(mockTrack).toHaveBeenCalledWith(
        GEOFENCE_TRACKING_POINTS.VIEW_GEOFENCE_DRAWER,
      );
    });

    it('should not track VIEW_GEOFENCE_DRAWER when drawer is closed', () => {
      render(<GeofenceDrawer {...defaultProps} open={false} />);

      expect(mockTrack).not.toHaveBeenCalledWith(
        GEOFENCE_TRACKING_POINTS.VIEW_GEOFENCE_DRAWER,
      );
    });

    it('should track TURN_ON_GEOFENCE when toggle is clicked', async () => {
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);

      const toggle = await screen.findByTestId('geofence-switch');
      fireEvent.click(toggle);

      expect(mockTrack).toHaveBeenCalledWith(
        GEOFENCE_TRACKING_POINTS.TURN_ON_GEOFENCE,
      );
    });

    it('should track SAVE_GEOFENCE when save button is clicked', async () => {
      mockGeofenceLocationSearchState.geofenceOn = true;
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: false },
          geofenceLocation: {
            latitude: 37.7749,
            longitude: -122.4194,
            geofenceRadiusInMeter: GEOFENCE_RADIUS.DEFAULT,
          },
        },
      ];
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      const saveBtn = await screen.findByText(
        'assignments.geofence.drawer.save',
      );
      fireEvent.click(saveBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        GEOFENCE_TRACKING_POINTS.SAVE_GEOFENCE,
      );
    });

    it('should track CANCEL_GEOFENCE_DRAWER when cancel button is clicked', async () => {
      render(<GeofenceDrawer {...defaultProps} />);

      const cancelBtn = await screen.findByText(
        'assignments.geofence.drawer.cancel',
      );
      fireEvent.click(cancelBtn);

      expect(mockTrack).toHaveBeenCalledWith(
        GEOFENCE_TRACKING_POINTS.CANCEL_GEOFENCE_DRAWER,
      );
    });

    it('should track MANAGE_SETTINGS_LINK when settings link is clicked', async () => {
      render(<GeofenceDrawer {...defaultProps} />);

      const link = await screen.findByText(
        'assignments.geofence.drawer.manageSettings',
      );
      fireEvent.click(link);

      expect(mockTrack).toHaveBeenCalledWith(
        GEOFENCE_TRACKING_POINTS.MANAGE_SETTINGS_LINK,
      );
    });

    it('should track DONT_SAVE_GEOFENCE when dont save is clicked in unsaved changes modal', async () => {
      const { rerender } = render(
        <GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />,
      );

      const toggle = await screen.findByTestId('geofence-switch');
      fireEvent.click(toggle);
      rerender(<GeofenceDrawer {...defaultProps} initialGeofenceOn={false} />);

      fireEvent.click(screen.getByTestId('drawer-header-close'));
      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('modal-dont-save-btn'));

      expect(mockTrack).toHaveBeenCalledWith(
        GEOFENCE_TRACKING_POINTS.DONT_SAVE_GEOFENCE,
      );
    });
  });

  describe('Save – addressUnchanged reuses saved coordinates', () => {
    const savedLat = 37.7749;
    const savedLng = -122.4194;
    const nodeWithCoordinates = {
      timeAgainstContactDAS: { customer: { id: 'cust-1' } },
      geofenceEnabled: { value: false, meta: { version: 'v1' } },
      geofenceLocation: {
        latitude: savedLat,
        longitude: savedLng,
        geofenceRadiusInMeter: GEOFENCE_RADIUS.DEFAULT,
        meta: { version: 'loc-v1' },
      },
    };

    it('should send saved lat/lng when address label matches customer address', async () => {
      mockGeofenceLocationSearchState.geofenceOn = true;
      (mockGeofenceLocationSearchState as any).selectedPlace = {
        placeId: 'place-abc',
        lat: 37.775,
        lng: -122.42,
        address: '123 Main St, San Francisco',
        label: '123 Main St',
        addressComponents: [],
      };
      mockGeofenceState.nodes = [nodeWithCoordinates];

      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      const saveBtn = await screen.findByTestId('button-primary');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1);
      });
      const { input } = mockMutate.mock.calls[0][0].variables;
      expect(input.geofenceLocation.latitude).toBe(savedLat);
      expect(input.geofenceLocation.longitude).toBe(savedLng);
    });

    it('should send selectedPlace lat/lng when address label differs from customer address', async () => {
      mockGeofenceLocationSearchState.geofenceOn = true;
      const newLat = 40.7128;
      const newLng = -74.006;
      (mockGeofenceLocationSearchState as any).selectedPlace = {
        placeId: 'place-new',
        lat: newLat,
        lng: newLng,
        address: '456 Broadway, New York',
        label: '456 Broadway',
        addressComponents: [],
      };
      mockGeofenceState.nodes = [nodeWithCoordinates];

      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      const saveBtn = await screen.findByTestId('button-primary');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1);
      });
      const { input } = mockMutate.mock.calls[0][0].variables;
      expect(input.geofenceLocation.latitude).toBe(newLat);
      expect(input.geofenceLocation.longitude).toBe(newLng);
    });

    it('should send selectedPlace lat/lng when there are no existing coordinates', async () => {
      mockGeofenceLocationSearchState.geofenceOn = true;
      const newLat = 40.7128;
      const newLng = -74.006;
      (mockGeofenceLocationSearchState as any).selectedPlace = {
        placeId: 'place-new',
        lat: newLat,
        lng: newLng,
        address: '123 Main St, San Francisco',
        label: '123 Main St',
        addressComponents: [],
      };
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: false },
          geofenceLocation: null,
        },
      ];

      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      const saveBtn = await screen.findByTestId('button-primary');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1);
      });
      const { input } = mockMutate.mock.calls[0][0].variables;
      expect(input.geofenceLocation.latitude).toBe(newLat);
      expect(input.geofenceLocation.longitude).toBe(newLng);
    });

    it('should include extractGeofenceAddressFields output in mutation payload', async () => {
      mockExtractGeofenceAddressFields.mockReturnValue({
        address1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        zipCode: '94105',
      });
      mockGeofenceLocationSearchState.geofenceOn = true;
      (mockGeofenceLocationSearchState as any).selectedPlace = {
        placeId: 'place-abc',
        lat: 37.775,
        lng: -122.42,
        address: '123 Main St, San Francisco',
        label: '456 Broadway',
        addressComponents: [
          { types: ['locality'], long_name: 'San Francisco' },
        ],
      };
      mockGeofenceState.nodes = [nodeWithCoordinates];

      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      const saveBtn = await screen.findByTestId('button-primary');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1);
      });
      expect(mockExtractGeofenceAddressFields).toHaveBeenCalledWith([
        { types: ['locality'], long_name: 'San Francisco' },
      ]);
      const loc = mockMutate.mock.calls[0][0].variables.input.geofenceLocation;
      expect(loc.address1).toBe('123 Main St');
      expect(loc.city).toBe('San Francisco');
      expect(loc.formattedAddress).toBe('123 Main St, San Francisco');
      expect(loc.addressLabel).toBe('456 Broadway');
    });
  });

  describe('Save Disabled – geofence on without coordinates', () => {
    it('should set address error when geofence is on but no address selected and no saved coordinates', async () => {
      mockGeofenceLocationSearchState.geofenceOn = true;
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: false },
          geofenceLocation: null,
        },
      ];
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      const saveBtn = await screen.findByTestId('button-primary');
      fireEvent.click(saveBtn);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'geofenceLocationSearch/setAddressError',
          payload: true,
        }),
      );
    });

    it('should enable save when geofence is on and coordinates are already saved', async () => {
      mockGeofenceLocationSearchState.geofenceOn = true;
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: false },
          geofenceLocation: {
            latitude: 37.7749,
            longitude: -122.4194,
            geofenceRadiusInMeter: GEOFENCE_RADIUS.DEFAULT,
          },
        },
      ];
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      const saveBtn = await screen.findByTestId('button-primary');
      expect(saveBtn).not.toBeDisabled();
    });

    it('should enable save when geofence is on and a new place is selected', async () => {
      mockGeofenceLocationSearchState.geofenceOn = true;
      (mockGeofenceLocationSearchState as any).selectedPlace = {
        placeId: 'place-123',
        lat: 40.7128,
        lng: -74.006,
        address: '456 Broadway, New York',
        label: '456 Broadway',
        addressComponents: [],
      };
      mockGeofenceState.nodes = [
        {
          timeAgainstContactDAS: { customer: { id: 'cust-1' } },
          geofenceEnabled: { value: false },
          geofenceLocation: null,
        },
      ];
      render(<GeofenceDrawer {...defaultProps} initialGeofenceOn />);

      const saveBtn = await screen.findByTestId('button-primary');
      expect(saveBtn).not.toBeDisabled();
    });
  });
});
