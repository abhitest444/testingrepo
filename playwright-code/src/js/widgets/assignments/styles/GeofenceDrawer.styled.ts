import styled, { createGlobalStyle } from 'styled-components';
import { DrawerHeader, DrawerContent } from '@ids-ts/drawer';
import { GEOFENCE_ACCENT_COLOR } from 'src/js/widgets/assignments/constants';

/**
 * The IDS DropdownTypeahead menu is rendered via Portal onto document.body,
 * so scoped CSS cannot reach it. This global style constrains the portaled
 * listbox width and wraps long menu-item text (e.g. full street addresses).
 */
export const GeofenceDropdownMenuFix = createGlobalStyle`
  ul[class*='DropdownTypeahead-menuWrapper'][role='listbox'] {
    width: 0 !important;
    box-sizing: border-box;
  }

  ul[class*='DropdownTypeahead-menuWrapper'] li[role='option'] [class*='menu-item-container'] {
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
  }
`;

// GeofenceDrawer styles

export const StyledDrawerHeader = styled(DrawerHeader)`
  border-bottom: 1px solid #d4d7dc;
  padding: 16px 24px;
`;

export const StyledDrawerContent = styled(DrawerContent)`
  mask-image: none !important;
`;

export const ContentWrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  overflow-x: hidden;
`;

export const CustomerName = styled.h2`
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
  color: #393a3d;
  margin: 0;
`;

export const AddressText = styled.p`
  font-size: 14px;
  line-height: 20px;
  color: #6b6c72;
  margin: 2px 0 0 0;
  font-weight: 500;
`;

export const DescriptionText = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #6b6c72;
  margin: 0;

  a {
    color: ${GEOFENCE_ACCENT_COLOR};
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const AssignNote = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #6b6c72;
  margin: 4px 0 0 0;
`;

export const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const ToggleLabel = styled.span`
  font-size: 15px;
  font-weight: 500;
  line-height: 24px;
  color: #393a3d;
`;

export const FooterButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

// GeofenceLocationFields styles

export const FieldSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;

  .idsDropdownTypeahead {
    width: 100% !important;
    min-width: 0 !important;
  }

  > .idsDropdownTypeahead [class*='iconBox'] {
    display: none;
  }
`;

/** Wrapper for address input + suggestions dropdown. position:relative needed for absolute dropdown. */
export const AddressSearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

/** Autocomplete suggestions list */
export const SuggestionsList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  margin: 2px 0 0;
  background: #fff;
  border: 1px solid #d6d6d6;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  max-height: 200px;
  overflow-y: auto;
`;

export const SuggestionItem = styled.div<{ highlighted?: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  line-height: 20px;
  color: #393a3d;
  background: ${({ highlighted }) => (highlighted ? '#f0f7f5' : '#fff')};

  &:first-child {
    border-radius: 6px 6px 0 0;
  }
  &:last-child {
    border-radius: 0 0 6px 6px;
  }
  &:hover {
    background: #f0f7f5;
  }
`;

export const RadiusLabel = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #6b6c72;
  margin: 0 0 4px 0;
`;

export const RadiusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const RadiusInput = styled.div`
  width: 140px;
  flex-shrink: 0;
`;

export const SliderWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;

  input[type='range'] {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: linear-gradient(
      to right,
      #037c6b 0%,
      #037c6b var(--progress, 50%),
      #d4d7dc var(--progress, 50%),
      #d4d7dc 100%
    );
    border-radius: 2px;
    outline: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #d4d7dc;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      border: 2px solid #d4d7dc;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
  }
`;

export const MapPlaceholder = styled.div`
  position: relative;
  width: 100%;
  height: 280px;
  border-radius: 8px;
  overflow: hidden;
`;

/** Fills MapPlaceholder; hidden until API is ready to prevent tile flash under spinner */
export const GeofenceMapHost = styled.div`
  position: absolute;
  inset: 0;

  &[data-visible='false'] {
    visibility: hidden;
  }
  &[data-visible='true'] {
    visibility: visible;
  }
`;

/** Full-bleed overlay so the spinner sits centred on the map */
export const GeofenceMapSpinnerOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

export const MapContainer = styled.div`
  width: 100%;
  height: 280px;
  border-radius: 8px;
  border: 1px solid #d4d7dc;
  overflow: hidden;
  position: relative;
`;

export const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  width: 100%;
`;
