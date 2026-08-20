import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

export interface ClassMapping {
  id: string;
  name: string;
  isMappedToDAS: boolean; // Whether this class exists in DAS
}

export interface ClassMappingsState {
  classMappings: Record<string, ClassMapping>; // key: class name, value: ClassMapping
  isLoading: boolean;
  error: string | null;
}

const initialState: ClassMappingsState = {
  classMappings: {},
  isLoading: false,
  error: null,
};

const classMappingsSlice = createSlice({
  name: 'classMappings',
  initialState,
  reducers: {
    // Initialize class mappings from DAS data
    initializeClassMappings: (
      state,
      action: PayloadAction<{ classes: any[] }>,
    ) => {
      const { classes } = action.payload;

      // Clear existing mappings
      state.classMappings = {};

      // Add all DAS classes as mapped
      classes.forEach((classItem: any) => {
        const className = classItem.fullName || classItem.name || '';
        if (className) {
          state.classMappings[className.toLowerCase().trim()] = {
            id: classItem.id,
            name: className,
            isMappedToDAS: true,
          };
        }
      });
    },

    // Add a new class mapping (when user creates a new class)
    addClassMapping: (
      state,
      action: PayloadAction<{ className: string; classId: string }>,
    ) => {
      const { className, classId } = action.payload;
      const normalizedName = className.toLowerCase().trim();

      state.classMappings[normalizedName] = {
        id: classId,
        name: className,
        isMappedToDAS: true, // Newly created classes are considered mapped
      };
    },

    // Update class mapping (when user selects from dropdown)
    updateClassMapping: (
      state,
      action: PayloadAction<{ className: string; classId: string }>,
    ) => {
      const { className, classId } = action.payload;
      const normalizedName = className.toLowerCase().trim();

      if (state.classMappings[normalizedName]) {
        state.classMappings[normalizedName].id = classId;
        state.classMappings[normalizedName].isMappedToDAS = true;
      } else {
        // Add new mapping if it doesn't exist
        state.classMappings[normalizedName] = {
          id: classId,
          name: className,
          isMappedToDAS: true,
        };
      }
    },

    // Check if a class needs validation error
    checkClassValidation: (
      state,
      action: PayloadAction<{ className: string }>,
    ) => {
      const { className } = action.payload;
      const normalizedName = className.toLowerCase().trim();

      // If class doesn't exist in mappings, it needs validation
      if (!state.classMappings[normalizedName]) {
        state.classMappings[normalizedName] = {
          id: '',
          name: className,
          isMappedToDAS: false,
        };
      }
    },

    // Clear all mappings
    clearClassMappings: (state) => {
      state.classMappings = {};
    },

    // Set loading state
    setClassMappingsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error state
    setClassMappingsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAllSlices, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const {
  initializeClassMappings,
  addClassMapping,
  updateClassMapping,
  clearClassMappings,
} = classMappingsSlice.actions;

export default classMappingsSlice.reducer;

// Selectors
export const selectClassMappings = (state: any) =>
  state.classMappings.classMappings;
export const selectClassMapping = (className: string) => (state: any) => {
  const normalizedName = className.toLowerCase().trim();
  return state.classMappings.classMappings[normalizedName];
};
export const selectClassMappingsLoading = (state: any) =>
  state.classMappings.isLoading;
export const selectClassMappingsError = (state: any) =>
  state.classMappings.error;

// Helper function to check if a class needs validation error
export const getClassValidationError = (
  className: string,
  state: any,
): string | null => {
  const normalizedName = className.toLowerCase().trim();
  const mapping = state.classMappings.classMappings[normalizedName];

  if (!mapping || !mapping.isMappedToDAS || !mapping.id) {
    return 'class';
  }

  return null;
};
