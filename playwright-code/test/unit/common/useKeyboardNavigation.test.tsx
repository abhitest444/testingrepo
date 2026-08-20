import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import {
  KeyboardNavigationContext,
  KeyboardNavigationProvider,
} from 'src/js/common/useKeyboardNavigation';

describe('KeyboardNavigationProvider', () => {
  test('add ref to keyboard navigation map', () => {
    const ref = { current: document.createElement('input') };
    const rowId = 1;
    const colId = 1;

    const TestComponent = () => {
      const { addRefToKeyboardNavigationMap } = React.useContext(
        KeyboardNavigationContext,
      );
      React.useEffect(() => {
        addRefToKeyboardNavigationMap({ rowId, colId, ref });
      }, [addRefToKeyboardNavigationMap]);

      return null;
    };

    render(
      <KeyboardNavigationProvider>
        <TestComponent />
      </KeyboardNavigationProvider>,
    );

    expect(ref.current).toBeDefined();
  });

  it('on arrow key down focus', () => {
    const ref1 = { current: document.createElement('input') };
    const ref2 = { current: document.createElement('input') };
    const colId = 1;

    const TestComponent = () => {
      const { addRefToKeyboardNavigationMap, onArrowKeyDown } =
        React.useContext(KeyboardNavigationContext);
      React.useEffect(() => {
        addRefToKeyboardNavigationMap({ rowId: 1, colId, ref: ref1 });
        addRefToKeyboardNavigationMap({ rowId: 2, colId, ref: ref2 });
      }, [addRefToKeyboardNavigationMap]);

      return (
        <div>
          <input
            ref={ref1}
            onKeyDown={() => onArrowKeyDown('ArrowDown', 1, colId)}
          />
          <input ref={ref2} />
        </div>
      );
    };

    render(
      <KeyboardNavigationProvider>
        <TestComponent />
      </KeyboardNavigationProvider>,
    );

    fireEvent.keyDown(ref1.current, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(ref2.current);
  });

  it('on arrow key up focus', () => {
    const ref1 = { current: document.createElement('input') };
    const ref2 = { current: document.createElement('input') };
    const colId = 1;

    const TestComponent = () => {
      const { addRefToKeyboardNavigationMap, onArrowKeyDown } =
        React.useContext(KeyboardNavigationContext);
      React.useEffect(() => {
        addRefToKeyboardNavigationMap({ rowId: 1, colId, ref: ref1 });
        addRefToKeyboardNavigationMap({ rowId: 2, colId, ref: ref2 });
      }, [addRefToKeyboardNavigationMap]);

      return (
        <div>
          <input ref={ref1} />
          <input
            ref={ref2}
            onKeyDown={() => onArrowKeyDown('ArrowUp', 2, colId)}
          />
        </div>
      );
    };

    render(
      <KeyboardNavigationProvider>
        <TestComponent />
      </KeyboardNavigationProvider>,
    );

    fireEvent.keyDown(ref2.current, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(ref1.current);
  });

  it('delete row from keyboard navigation map', () => {
    const ref = { current: document.createElement('input') };
    const rowId = 1;
    const colId = 1;
    const deleteRowMock = jest.fn();

    const TestComponent = () => {
      const {
        addRefToKeyboardNavigationMap,
        deleteRowFromKeyboardNavigationMap,
      } = React.useContext(KeyboardNavigationContext);
      deleteRowMock.mockImplementation(() =>
        deleteRowFromKeyboardNavigationMap(1),
      );

      React.useEffect(() => {
        addRefToKeyboardNavigationMap({ rowId, colId, ref });
      }, [addRefToKeyboardNavigationMap]);

      return null;
    };

    render(
      <KeyboardNavigationProvider>
        <TestComponent />
      </KeyboardNavigationProvider>,
    );

    act(() => {
      deleteRowMock();
    });

    expect(deleteRowMock).toHaveBeenCalled();
    expect(ref.current).toBeDefined();

    jest.resetAllMocks();
  });

  it('delete row that does not exist on keyboard navigation map', () => {
    const ref = { current: document.createElement('input') };
    const rowId = 1;
    const colId = 1;
    const deleteRowMock = jest.fn();

    const TestComponent = () => {
      const {
        addRefToKeyboardNavigationMap,
        deleteRowFromKeyboardNavigationMap,
      } = React.useContext(KeyboardNavigationContext);
      deleteRowMock.mockImplementation(() =>
        deleteRowFromKeyboardNavigationMap(2),
      );

      React.useEffect(() => {
        addRefToKeyboardNavigationMap({ rowId, colId, ref });
      }, [addRefToKeyboardNavigationMap]);

      return null;
    };

    render(
      <KeyboardNavigationProvider>
        <TestComponent />
      </KeyboardNavigationProvider>,
    );

    act(() => {
      deleteRowMock();
    });

    expect(deleteRowMock).toHaveBeenCalled();
    expect(ref.current).toBeDefined();

    jest.resetAllMocks();
  });

  it('does not throw when colId is missing from the row', () => {
    const ref = { current: document.createElement('input') };
    const colId = 99;

    const TestComponent = () => {
      const { addRefToKeyboardNavigationMap, onArrowKeyDown } =
        React.useContext(KeyboardNavigationContext);
      React.useEffect(() => {
        addRefToKeyboardNavigationMap({ rowId: 1, colId: 1, ref });
      }, [addRefToKeyboardNavigationMap]);

      return (
        <input
          ref={ref}
          onKeyDown={() => onArrowKeyDown('ArrowDown', 1, colId)}
        />
      );
    };

    render(
      <KeyboardNavigationProvider>
        <TestComponent />
      </KeyboardNavigationProvider>,
    );

    expect(() =>
      fireEvent.keyDown(ref.current, { key: 'ArrowDown' }),
    ).not.toThrow();
  });
});
