import React, {
  createContext,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useState,
} from 'react';

export type AllowedEventKey = 'ArrowUp' | 'ArrowDown';

type RefMapIds = {
  rowId: number;
  colId: number;
};

type RefMap = RefMapIds & {
  ref: RefObject<HTMLInputElement>;
};

type RefMapItem = {
  [rowId: RefMapIds['rowId']]: {
    [colId: RefMapIds['colId']]: RefMap['ref'];
  };
};

const KeyboardNavigationContext = createContext<{
  addRefToKeyboardNavigationMap: (refMap: RefMap) => void;
  onArrowKeyDown: (key: AllowedEventKey, rowId: number, colId: number) => void;
  deleteRowFromKeyboardNavigationMap: (rowId: RefMapIds['rowId']) => void;
}>({
  addRefToKeyboardNavigationMap: () => {},
  deleteRowFromKeyboardNavigationMap: () => {},
  onArrowKeyDown: () => {},
});

const KeyboardNavigationProvider = ({ children }: { children: ReactNode }) => {
  const [keyboardNavigationMap, setKeyboardNavigationMap] =
    useState<RefMapItem>({});

  const addRefToKeyboardNavigationMap = useCallback(
    ({ rowId, colId, ref }: RefMap) => {
      if (keyboardNavigationMap[rowId]?.[colId]?.current) {
        return;
      }

      setKeyboardNavigationMap((prev) => ({
        ...prev,
        [rowId]: {
          ...prev[rowId],
          [colId]: ref,
        },
      }));
    },
    [keyboardNavigationMap],
  );

  const deleteRowFromKeyboardNavigationMap = useCallback(
    (rowId: RefMapIds['rowId']) => {
      if (!keyboardNavigationMap[rowId]) {
        return;
      }

      setKeyboardNavigationMap((prev) => {
        const newMap = { ...prev };

        // Delete the requested row and all rows after it
        // This is done to ensure that the rows that occurred
        // after the deleted row are re-indexed into the new, correct order
        Object.keys(newMap).forEach((key) => {
          const keyNumber = Number(key);
          if (keyNumber >= rowId) {
            delete newMap[keyNumber];
          }
        });

        return newMap;
      });
    },
    [keyboardNavigationMap],
  );

  const onArrowKeyDown = (
    key: AllowedEventKey,
    rowId: number,
    colId: number,
  ) => {
    let newRowId = rowId;

    switch (key) {
      case 'ArrowUp':
        newRowId = rowId - 1;
        break;
      case 'ArrowDown':
      default:
        newRowId = rowId + 1;
        break;
    }

    keyboardNavigationMap[newRowId]?.[colId]?.current?.focus();
  };

  return (
    <KeyboardNavigationContext.Provider
      value={{
        addRefToKeyboardNavigationMap,
        deleteRowFromKeyboardNavigationMap,
        onArrowKeyDown,
      }}
    >
      {children}
    </KeyboardNavigationContext.Provider>
  );
};

export { KeyboardNavigationProvider, KeyboardNavigationContext };
