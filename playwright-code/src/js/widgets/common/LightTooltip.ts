import styled from 'styled-components';
import Tooltip from '@ids-ts/tooltip';

const LightTooltip = styled(Tooltip)`
  &[class*='Tooltip-tooltipWrapper'] {
    --color-container-background-complementary: var(
      --color-container-background-primary
    );
    box-shadow: none;
    filter: drop-shadow(0 0 1px var(--color-ui-positive))
      drop-shadow(0 0 1px var(--color-ui-positive))
      drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));

    [class*='Tooltip-tooltipInnerWrapper'],
    [class*='Tooltip-tooltipInnerWrapper'] * {
      color: var(--color-text-primary);
    }
  }
`;

export default LightTooltip;
