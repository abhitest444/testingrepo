import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

/**
 * Interface representing the progress state
 * Simplified to only track current step and UI state
 */
export interface ProgressState {
  // Current step (1-6)
  currentStep: number;
  totalSteps: number;

  // UI state
  isTrowserOpen: boolean;
  cardFadeOut: boolean;

  // Global loading state
  isProcessing: boolean;
  loadingMessage: string;

  // Flag to track if all fields were mapped during processing (for Step 2 modal)
  allFieldsMappedOnLoad: boolean;

  // Flag to track if user is navigating backwards (to prevent auto-skip)
  isNavigatingBack: boolean;

  // Flag to track if user manually clicked a step (vs automatic navigation)
  isUserInitiatedNavigation: boolean;

  // Track completed steps (for progress card) - using array for Redux serialization
  completedSteps: number[];

  // Track visited steps (steps user has navigated to at least once)
  visitedSteps: number[];

  // True when user has clicked Continue in Step 2 or Step 3 (not on auto-skip)
  hasCompletedMappingContinue: boolean;

  // True only when user clicked Continue in Step 3 (unmapped field mapping) – used to show "Mapping complete" message
  hasClickedStep3Continue: boolean;

  // True when extraction summary typewriter animation has completed (enables Step 2/3)
  extractionSummaryTypewriterComplete: boolean;

  // Frozen extraction summary text (keyed by uploadId) to prevent typewriter restart on re-render
  extractionSummaryFrozenText: string | null;
  extractionSummaryFrozenTextUploadId: string | null;

  // Phase 2: when "Thanks, we found some unrecognized values..." typewriter completes (enables Step 3)
  phase2TypewriterComplete: boolean;

  // Step 3: extraction (extractUnmappedFields) has completed – needed to know hasUnmappedInStep3 accurately
  step3ExtractionComplete: boolean;
}

const initialState: ProgressState = {
  // Current step
  currentStep: 1,
  totalSteps: 6,

  // UI state
  isTrowserOpen: true,
  cardFadeOut: false,

  // Global loading state
  isProcessing: false,
  loadingMessage: '',

  // Field mapping state
  allFieldsMappedOnLoad: false,

  // Navigation state
  isNavigatingBack: false,

  // User-initiated navigation flag
  isUserInitiatedNavigation: false,

  // Completed steps (array for Redux serialization)
  completedSteps: [],

  // Visited steps (start with step 1)
  visitedSteps: [1],

  hasCompletedMappingContinue: false,

  hasClickedStep3Continue: false,

  extractionSummaryTypewriterComplete: false,

  extractionSummaryFrozenText: null,
  extractionSummaryFrozenTextUploadId: null,

  phase2TypewriterComplete: false,

  step3ExtractionComplete: false,
};

export const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    // Step navigation actions
    setCurrentStep: (state, action: PayloadAction<number>) => {
      const newStep = action.payload;

      // Validate step bounds
      if (newStep < 1 || newStep > state.totalSteps) {
        return;
      }

      // Update current step
      state.currentStep = newStep;

      // Track visited steps
      if (!state.visitedSteps.includes(newStep)) {
        state.visitedSteps.push(newStep);
      }
    },

    nextStep: (state) => {
      if (state.currentStep < state.totalSteps) {
        state.currentStep += 1;

        // Track visited steps
        if (!state.visitedSteps.includes(state.currentStep)) {
          state.visitedSteps.push(state.currentStep);
        }
      }
    },

    previousStep: (state) => {
      if (state.currentStep > 1) {
        state.currentStep -= 1;
      }
    },

    // UI state actions
    setTrowserOpen: (state, action: PayloadAction<boolean>) => {
      state.isTrowserOpen = action.payload;
    },

    setCardFadeOut: (state, action: PayloadAction<boolean>) => {
      state.cardFadeOut = action.payload;
    },

    // Global loading state actions
    setGlobalProcessing: (
      state,
      action: PayloadAction<{ isProcessing: boolean; message?: string }>,
    ) => {
      state.isProcessing = action.payload.isProcessing;
      state.loadingMessage = action.payload.message || '';
    },

    clearGlobalProcessing: (state) => {
      state.isProcessing = false;
      state.loadingMessage = '';
    },

    // Set whether all fields were mapped on load (for Step 2 modal)
    setAllFieldsMappedOnLoad: (state, action: PayloadAction<boolean>) => {
      state.allFieldsMappedOnLoad = action.payload;
    },

    // Set navigation direction
    setNavigatingBack: (state, action: PayloadAction<boolean>) => {
      state.isNavigatingBack = action.payload;
    },

    // Set user-initiated navigation flag
    setUserInitiatedNavigation: (state, action: PayloadAction<boolean>) => {
      state.isUserInitiatedNavigation = action.payload;
    },

    // Mark a step as completed
    markStepCompleted: (state, action: PayloadAction<number>) => {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
    },

    // Mark multiple steps as completed
    markStepsCompleted: (state, action: PayloadAction<number[]>) => {
      action.payload.forEach((step) => {
        if (!state.completedSteps.includes(step)) {
          state.completedSteps.push(step);
        }
      });
    },

    // Set when user clicks Continue in Step 2 or Step 3 (not on auto-skip)
    setMappingContinueClicked: (state, action: PayloadAction<boolean>) => {
      state.hasCompletedMappingContinue = action.payload;
    },

    // Set only when user clicks Continue in Step 3 (unmapped field mapping)
    setStep3ContinueClicked: (state, action: PayloadAction<boolean>) => {
      state.hasClickedStep3Continue = action.payload;
    },

    // Set when extraction summary typewriter animation completes
    setExtractionSummaryTypewriterComplete: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.extractionSummaryTypewriterComplete = action.payload;
    },

    // Set frozen extraction summary text (prevents typewriter restart)
    setExtractionSummaryFrozenText: (
      state,
      action: PayloadAction<{ text: string; uploadId: string }>,
    ) => {
      state.extractionSummaryFrozenText = action.payload.text;
      state.extractionSummaryFrozenTextUploadId = action.payload.uploadId;
    },

    // Set when Phase 2 ("Thanks, we found...") typewriter completes
    setPhase2TypewriterComplete: (state, action: PayloadAction<boolean>) => {
      state.phase2TypewriterComplete = action.payload;
    },

    // Set when Step 3 extraction (extractUnmappedFields) completes
    setStep3ExtractionComplete: (state, action: PayloadAction<boolean>) => {
      state.step3ExtractionComplete = action.payload;
    },

    // Reset actions
    resetProgressState: () => initialState,

    resetToStep: (state, action: PayloadAction<number>) => {
      const targetStep = action.payload;
      if (targetStep >= 1 && targetStep <= state.totalSteps) {
        state.currentStep = targetStep;
      }
    },
  },
  extraReducers: (builder) => {
    // Listen to global reset action
    builder.addCase(resetAllSlices, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const {
  setCurrentStep,
  nextStep,
  previousStep,
  setTrowserOpen,
  setCardFadeOut,
  setGlobalProcessing,
  clearGlobalProcessing,
  setAllFieldsMappedOnLoad,
  setNavigatingBack,
  setUserInitiatedNavigation,
  markStepCompleted,
  markStepsCompleted,
  setMappingContinueClicked,
  setStep3ContinueClicked,
  setExtractionSummaryTypewriterComplete,
  setExtractionSummaryFrozenText,
  setPhase2TypewriterComplete,
  setStep3ExtractionComplete,
  resetProgressState,
  resetToStep,
} = progressSlice.actions;

export default progressSlice.reducer;
