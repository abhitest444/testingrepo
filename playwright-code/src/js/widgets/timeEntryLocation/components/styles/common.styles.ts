import styled from 'styled-components';
import { Circle } from '@design-systems/icons';
import { breakPoints } from '../../../../common/screenSizeUtils';

// Responsive helper - creates media query for small screens
export const smallScreen = (styles: string): string => `
  @media (max-width: ${breakPoints.md}px) {
    ${styles}
  }
`;

export const HorizontalDivider = styled.hr`
  border: none;
  border-top: 1px solid #d4d7dc;
  width: 100%;
`;

// TODO: Theme additions to be done if needed
export const GreenLocationMarker = styled(Circle)`
  width: 10px;
  height: 10px;
  color: #00892e;
  border-radius: 50%;
  box-shadow: 0 0 0 2px white, 0 0 0 7px rgba(0, 137, 46, 0.3),
    0 1px 6px rgba(0, 0, 0, 0.15);
`;

// TODO: Theme additions to be done if needed
export const GrayLocationMarker = styled(Circle)`
  width: 10px;
  height: 10px;
  color: #6b6c72;
  border-radius: 50%;
  box-shadow: 0 0 0 2px white, 0 1px 6px rgba(0, 0, 0, 0.15);
`;

// TODO: Theme additions to be done if needed
export const OrangeLocationMarker = styled(Circle)`
  width: 10px;
  height: 10px;
  color: #ff6a00;
  border-radius: 50%;
  box-shadow: 0 0 0 2px white, 0 1px 6px rgba(0, 0, 0, 0.15);
`;

// SVG data URL for green location marker
const GREEN_MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
<circle opacity="0.3" cx="13" cy="12" r="12" fill="#00892E"/>
<g filter="url(#filter0_d_1709_39171)">
<circle cx="13" cy="12" r="5" fill="#00892E"/>
<circle cx="13" cy="12" r="6" stroke="white" stroke-width="2"/>
</g>
<defs>
<filter id="filter0_d_1709_39171" x="0" y="0" width="26" height="26" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="3"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1709_39171"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1709_39171" result="shape"/>
</filter>
</defs>
</svg>`;

// SVG data URL for gray intermediate point marker
const GRAY_MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
<g filter="url(#filter0_d_1709_39195)">
<circle cx="13" cy="12" r="5" fill="#6B6C72"/>
<circle cx="13" cy="12" r="6" stroke="white" stroke-width="2"/>
</g>
<defs>
<filter id="filter0_d_1709_39195" x="0" y="0" width="26" height="26" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="3"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1709_39195"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1709_39195" result="shape"/>
</filter>
</defs>
</svg>`;

// SVG data URL for orange flagged intermediate point marker
const ORANGE_MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
<g filter="url(#filter0_d_1709_39196)">
<circle cx="13" cy="12" r="5" fill="#FF6A00"/>
<circle cx="13" cy="12" r="6" stroke="white" stroke-width="2"/>
</g>
<defs>
<filter id="filter0_d_1709_39196" x="0" y="0" width="26" height="26" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="3"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1709_39196"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1709_39196" result="shape"/>
</filter>
</defs>
</svg>`;

// Get SVG data URL for green marker (start/end points)
export const getGreenMarkerUrl = (): string =>
  `data:image/svg+xml,${encodeURIComponent(GREEN_MARKER_SVG)}`;

// Get SVG data URL for gray marker (intermediate points)
export const getGrayMarkerUrl = (): string =>
  `data:image/svg+xml,${encodeURIComponent(GRAY_MARKER_SVG)}`;

// Get SVG data URL for orange marker (intermediate points with an active device/geofence flag)
export const getOrangeMarkerUrl = (): string =>
  `data:image/svg+xml,${encodeURIComponent(ORANGE_MARKER_SVG)}`;

export default {
  HorizontalDivider,
  GreenLocationMarker,
  GrayLocationMarker,
  OrangeLocationMarker,
  getGreenMarkerUrl,
  getGrayMarkerUrl,
  getOrangeMarkerUrl,
};
