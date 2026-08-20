import { createAction } from '@reduxjs/toolkit';

/**
 * Global action to reset all slices when a new file is uploaded or user goes back to Step 1
 * All slices listen to this action in their extraReducers and reset to initial state
 */
export const resetAllSlices = createAction('global/resetAllSlices');
