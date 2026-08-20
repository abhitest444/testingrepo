export { default as Dimensions } from './Dimensions';
export { DIMENSIONS_FORM_NAME, DIMENSIONS_TEST_IDS } from './types';
export type { DimensionsProps } from './Dimensions';

export type {
  CustomExtensionDimensionInput,
  CustomExtensionDimensionWire,
  CustomExtensionsInput,
  CustomExtensionsWire,
  DimensionDefinition,
  DimensionOption,
  DimensionRenderState,
  DimensionValue,
} from './types';

export {
  composeDimensionQuickfillValue,
  computeDimensionRender,
  computeDimensionRenderMap,
  extractDimensionOptionId,
  hasDimensionValue,
  isRequiredOnForm,
  isVisibleInCreate,
  isWorkerDefaultOption,
  mapCustomExtensionsToDimensionValues,
  mapDimensionsToPayload,
  getDimensionDisplayOptionId,
  resolveDimensionFormValue,
} from './dimensionUtils';
export {
  default as DimensionsField,
  type DimensionsFieldProps,
} from './DimensionsField';
