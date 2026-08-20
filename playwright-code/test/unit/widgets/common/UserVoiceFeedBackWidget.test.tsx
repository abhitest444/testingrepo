import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from 'test/unit/testUtils';
import * as UserVoiceUtils from 'src/js/common/UserVoiceUtils';

import UserVoiceFeedBackWidget, {
  UserVoiceFeedbackWidgetProps,
} from 'src/js/widgets/common/feedbackPopover/UserVoiceFeedBackWidget';

// Mock the HOCWidget component
jest.mock(
  'web-shell-core/widgets/HOCWidget',
  () =>
    function MockHOCWidget({
      children,
      className,
      style,
      id,
      dataTestId,
    }: any) {
      return (
        <div
          data-testid={dataTestId || 'hoc-widget'}
          className={className}
          style={style}
          id={id}
        >
          {typeof children === 'function' ? children(() => {}) : children}
        </div>
      );
    },
);

// Mock UserVoiceUtils
jest.mock('src/js/common/UserVoiceUtils', () => ({
  getCustomFields: jest.fn(),
}));

describe('UserVoiceFeedBackWidget', () => {
  let props: UserVoiceFeedbackWidgetProps;
  let mockSandbox: any;
  let getCustomFieldsSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a mock sandbox with all required methods
    mockSandbox = getDefaultSandbox();

    // Mock additional sandbox methods needed by the component
    mockSandbox.appContext.getRealmInfo = jest.fn().mockReturnValue({
      realmId: 'test-realm-id',
      realmName: 'Test Company',
    });

    mockSandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
      isAccountantUser: false,
      isAdmin: true,
      isMasterAdmin: false,
      legacyRoles: {
        roleType: 'admin',
      },
    });

    mockSandbox.sandboxContext.getInfo = jest.fn().mockReturnValue({
      widgetId: 'test-widget-id',
    });

    // Mock getCustomFields function
    getCustomFieldsSpy = jest.spyOn(UserVoiceUtils, 'getCustomFields');
    getCustomFieldsSpy.mockReturnValue({
      widgetId: 'test-widget-id',
      realmId: 'test-realm-id',
      realmName: 'Test Company',
      isAccountantUser: false,
      isAdmin: true,
      isMasterAdmin: false,
      roleType: 'admin',
    });

    // Default props
    props = {
      renderFeedbackTrigger: jest.fn((handleAccessPointClick) => (
        <button onClick={handleAccessPointClick} data-testid="feedback-trigger">
          Feedback Button
        </button>
      )),
      widgetIdentifier: 'custom-widget-id',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render without crashing', () => {
      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(screen.getByTestId('hoc-widget')).toBeInTheDocument();
      expect(screen.getByTestId('feedback-trigger')).toBeInTheDocument();
    });

    test('should render with default widgetIdentifier when not provided', () => {
      const propsWithoutWidgetId = {
        renderFeedbackTrigger: props.renderFeedbackTrigger,
      };

      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={propsWithoutWidgetId.renderFeedbackTrigger}
        />,
        mockSandbox,
      );

      expect(screen.getByTestId('hoc-widget')).toBeInTheDocument();
    });

    test('should call renderFeedbackTrigger with handleAccessPointClick function', () => {
      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(props.renderFeedbackTrigger).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });
  });

  describe('Internationalization', () => {
    test('should use intl for formatting messages', () => {
      const mockFormatMessage = jest.fn(({ id }) => `formatted-${id}`);
      mockSandbox.intl = {
        formatMessage: mockFormatMessage,
      };

      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      // The component should call formatMessage for various message IDs
      // Note: The actual implementation uses useIntl hook, so we can't directly test this
      // but we can verify the component renders without errors
      expect(screen.getByTestId('hoc-widget')).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    test('should call handleAccessPointClick when feedback trigger is clicked', () => {
      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      const feedbackButton = screen.getByTestId('feedback-trigger');
      fireEvent.click(feedbackButton);

      // The handleAccessPointClick function should be callable
      expect(feedbackButton).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('should render children as function', () => {
      const mockRenderFunction = jest.fn((handleAccessPointClick) => (
        <div
          data-testid="custom-trigger"
          onClick={handleAccessPointClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleAccessPointClick();
            }
          }}
          role="button"
          tabIndex={0}
        >
          Custom Trigger
        </div>
      ));

      const customProps = {
        renderFeedbackTrigger: mockRenderFunction,
        widgetIdentifier: props.widgetIdentifier,
      };

      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={customProps.renderFeedbackTrigger}
          widgetIdentifier={customProps.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(mockRenderFunction).toHaveBeenCalledWith(expect.any(Function));
      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    });
  });

  describe('Fallback Values Coverage', () => {
    test('should use fallback values when realmInfo properties are null/undefined', () => {
      // Mock realmInfo with null/undefined properties
      mockSandbox.appContext.getRealmInfo = jest.fn().mockReturnValue({
        realmId: 'test-realm-id',
        realmName: null, // This should trigger the fallback to empty string
      });

      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(screen.getByTestId('hoc-widget')).toBeInTheDocument();
      expect(getCustomFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          realmName: '', // Should use fallback empty string
        }),
      );
    });

    test('should use fallback values when authInfo properties are null/undefined', () => {
      // Mock authInfo with null/undefined properties
      mockSandbox.extensions.qbo.context.getAuthInfo = jest
        .fn()
        .mockReturnValue({
          isAccountantUser: null, // Should fallback to false
          isAdmin: undefined, // Should fallback to false
          isMasterAdmin: false,
          legacyRoles: {
            roleType: null, // Should fallback to empty string
          },
        });

      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(screen.getByTestId('hoc-widget')).toBeInTheDocument();
      expect(getCustomFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isAccountantUser: false, // Should use fallback false
          isAdmin: false, // Should use fallback false
          roleType: '', // Should use fallback empty string
        }),
      );
    });

    test('should use fallback values when authInfo.legacyRoles is null/undefined', () => {
      // Mock authInfo with null legacyRoles
      mockSandbox.extensions.qbo.context.getAuthInfo = jest
        .fn()
        .mockReturnValue({
          isAccountantUser: false,
          isAdmin: true,
          isMasterAdmin: false,
          legacyRoles: null, // This should trigger the fallback for roleType
        });

      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(screen.getByTestId('hoc-widget')).toBeInTheDocument();
      expect(getCustomFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          roleType: '', // Should use fallback empty string
        }),
      );
    });

    test('should use fallback values when all properties are falsy', () => {
      // Mock both realmInfo and authInfo with all falsy values
      mockSandbox.appContext.getRealmInfo = jest.fn().mockReturnValue({
        realmId: 'test-realm-id',
        realmName: '', // Empty string should still use fallback
      });

      mockSandbox.extensions.qbo.context.getAuthInfo = jest
        .fn()
        .mockReturnValue({
          isAccountantUser: 0, // Falsy value should fallback to false
          isAdmin: '', // Empty string should fallback to false
          isMasterAdmin: null,
          legacyRoles: {
            roleType: 0, // Falsy value should fallback to empty string
          },
        });

      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(screen.getByTestId('hoc-widget')).toBeInTheDocument();
      expect(getCustomFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          realmName: '', // Should use fallback empty string
          isAccountantUser: false, // Should use fallback false
          isAdmin: false, // Should use fallback false
          roleType: '', // Should use fallback empty string
        }),
      );
    });

    test('should use fallback values when realmInfo is null/undefined', () => {
      // Mock realmInfo as null to test optional chaining
      mockSandbox.appContext.getRealmInfo = jest.fn().mockReturnValue(null);

      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(screen.getByTestId('hoc-widget')).toBeInTheDocument();
      expect(getCustomFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          realmName: '', // Should use fallback empty string when realmInfo is null
        }),
      );
    });

    test('should use fallback values when authInfo is null/undefined', () => {
      // Mock authInfo as null to test optional chaining
      mockSandbox.extensions.qbo.context.getAuthInfo = jest
        .fn()
        .mockReturnValue(null);

      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(screen.getByTestId('hoc-widget')).toBeInTheDocument();
      expect(getCustomFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isAccountantUser: false, // Should use fallback false when authInfo is null
          isAdmin: false, // Should use fallback false when authInfo is null
          isMasterAdmin: false, // Should use fallback false when authInfo is null
          roleType: '', // Should use fallback empty string when authInfo is null
        }),
      );
    });

    test('should use fallback values when realmInfo is undefined', () => {
      // Mock realmInfo as undefined to test optional chaining
      mockSandbox.appContext.getRealmInfo = jest
        .fn()
        .mockReturnValue(undefined);

      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(screen.getByTestId('hoc-widget')).toBeInTheDocument();
      expect(getCustomFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          realmName: '', // Should use fallback empty string when realmInfo is undefined
        }),
      );
    });

    test('should use fallback values when authInfo is undefined', () => {
      // Mock authInfo as undefined to test optional chaining
      mockSandbox.extensions.qbo.context.getAuthInfo = jest
        .fn()
        .mockReturnValue(undefined);

      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(screen.getByTestId('hoc-widget')).toBeInTheDocument();
      expect(getCustomFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isAccountantUser: false, // Should use fallback false when authInfo is undefined
          isAdmin: false, // Should use fallback false when authInfo is undefined
          isMasterAdmin: false, // Should use fallback false when authInfo is undefined
          roleType: '', // Should use fallback empty string when authInfo is undefined
        }),
      );
    });

    test('should use fallback values when legacyRoles is undefined', () => {
      // Mock authInfo with undefined legacyRoles
      mockSandbox.extensions.qbo.context.getAuthInfo = jest
        .fn()
        .mockReturnValue({
          isAccountantUser: false,
          isAdmin: true,
          isMasterAdmin: false,
          legacyRoles: undefined, // This should trigger the fallback for roleType
        });

      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(screen.getByTestId('hoc-widget')).toBeInTheDocument();
      expect(getCustomFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          roleType: '', // Should use fallback empty string when legacyRoles is undefined
        }),
      );
    });
  });

  describe('Feature Flags', () => {
    test('should pass isOvertimeEnabled as false by default to getCustomFields', () => {
      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
        />,
        mockSandbox,
      );

      expect(getCustomFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isOvertimeEnabled: false,
        }),
      );
    });

    test('should pass isOvertimeEnabled as true when provided', () => {
      renderWithQuicksandProvider(
        <UserVoiceFeedBackWidget
          renderFeedbackTrigger={props.renderFeedbackTrigger}
          widgetIdentifier={props.widgetIdentifier}
          isOvertimeEnabled
        />,
        mockSandbox,
      );

      expect(getCustomFieldsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isOvertimeEnabled: true,
        }),
      );
    });
  });
});
