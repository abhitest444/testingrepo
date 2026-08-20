import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIntl, useSandbox } from '@payroll/quicksand';
import styled from 'styled-components';
import Button from '@ids-ts/button';
import { B2, B3 } from '@ids-ts/typography';
import { AiSparkles, Close } from '@design-systems/icons';
import { useWeeklyImportExperiment } from './WeeklyImportExperimentContext';

const HeaderButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 10px;
  z-index: 1000;
`;

const HeaderButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  line-height: 1;
`;

const TooltipBox = styled.div<{ $top: number; $left: number }>`
  position: fixed;
  z-index: 99999;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  width: 320px;
  background: var(--color-container-background-primary, #fff);
  border: 1px solid var(--color-border-secondary, #eceef1);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid var(--color-border-secondary, #eceef1);
  }

  &::after {
    content: '';
    position: absolute;
    top: -7px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-bottom: 7px solid var(--color-container-background-primary, #fff);
  }
`;

const TooltipHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  color: var(--color-icon-secondary, #6b6c72);

  &:hover {
    color: var(--color-icon-primary, #393a3d);
  }
`;

const TooltipMessage = styled(B3)`
  color: var(--color-text-secondary, #6b6c72);
`;

const TooltipFooter = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/**
 * Renders the "Import time with AI" button in the Trowser header (via portal)
 * and a "Try AI time import" tip popover below it.
 * Only renders when the IXP experiment context indicates showImportCTA=true.
 */
export const ImportTimeWithAICTA: React.FC = () => {
  const { showImportCTA, treatmentKey } = useWeeklyImportExperiment();
  const sandbox = useSandbox();
  const intl = useIntl();

  const portalRoot = useRef(document.createElement('div'));
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isPortalReady, setIsPortalReady] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [tipPos, setTipPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!showImportCTA) return undefined;

    // Prefer a stable hook over a styled-components generated class. Falls
    // back to the class match so this still works against the current IDS
    // Trowser, but warns once so we notice if the class name changes.
    const stableTarget = document.querySelector(
      '[data-portal-slot="trowser-header-actions"]',
    );
    const fallbackTarget = stableTarget
      ? null
      : document.querySelector('[class*="TrowserHeader-headerRight"]');
    if (fallbackTarget) {
      // eslint-disable-next-line no-console
      console.warn(
        'ImportTimeWithAICTA: relying on class*="TrowserHeader-headerRight" fallback; coordinate a data-portal-slot attribute with the Trowser owner',
      );
    }
    const headerElement = stableTarget ?? fallbackTarget;
    const portalEl = portalRoot.current;
    if (headerElement) {
      headerElement.insertBefore(portalEl, headerElement.firstChild);
      setIsPortalReady(true);
    }

    // Detach the portal root on unmount so we never leak a detached DOM
    // node if the gate remounts.
    return () => {
      if (portalEl.parentNode) {
        portalEl.parentNode.removeChild(portalEl);
      }
      setIsPortalReady(false);
    };
  }, [showImportCTA]);

  const updateTipPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    if (rect.width === 0) return;

    const tooltipWidth = 320;
    const gap = 12;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    left = Math.max(8, left);

    setTipPos({ top: rect.bottom + gap, left });
  }, []);

  useEffect(() => {
    if (!isPortalReady || !showTip) return undefined;

    const timer = setTimeout(updateTipPosition, 400);
    return () => clearTimeout(timer);
  }, [isPortalReady, showTip, updateTipPosition]);

  useEffect(() => {
    if (!showTip || !tipPos) return undefined;

    window.addEventListener('resize', updateTipPosition);
    window.addEventListener('scroll', updateTipPosition, true);
    return () => {
      window.removeEventListener('resize', updateTipPosition);
      window.removeEventListener('scroll', updateTipPosition, true);
    };
  }, [showTip, tipPos, updateTipPosition]);

  const handleOpenTimeImport = useCallback(() => {
    sandbox.logger.log(
      `WeeklyTimeEntry: Opening time-agent import from CTA (treatment=${treatmentKey})`,
    );
    sandbox.navigation.navigate(
      `app/time-agent-ui-plugin/timeagent?from=payroll_weekly_timesheet&treatment=${encodeURIComponent(
        treatmentKey || '',
      )}`,
    );
  }, [sandbox, treatmentKey]);

  const handleDismissTip = useCallback(() => {
    setShowTip(false);
  }, []);

  if (!showImportCTA || !isPortalReady) {
    return null;
  }

  return (
    <>
      {createPortal(
        <HeaderButtonWrapper ref={buttonRef}>
          <Button
            priority="tertiary"
            size="medium"
            onClick={handleOpenTimeImport}
          >
            <HeaderButtonContent>
              <AiSparkles size="small" />
              {intl.formatMessage({ id: 'import.time.with.ai' })}
            </HeaderButtonContent>
          </Button>
        </HeaderButtonWrapper>,
        portalRoot.current,
      )}
      {showTip &&
        tipPos &&
        createPortal(
          <TooltipBox $top={tipPos.top} $left={tipPos.left}>
            <TooltipHeader>
              <B2 weight="demi">
                {intl.formatMessage({ id: 'try.ai.time.import.title' })}
              </B2>
              <CloseBtn onClick={handleDismissTip} aria-label="Dismiss tip">
                <Close size="xsmall" />
              </CloseBtn>
            </TooltipHeader>
            <TooltipMessage>
              {intl.formatMessage({ id: 'try.ai.time.import.body' })}
            </TooltipMessage>
            <TooltipFooter>
              <Button
                priority="primary"
                size="small"
                onClick={handleDismissTip}
              >
                {intl.formatMessage({ id: 'try.ai.time.import.dismiss' })}
              </Button>
            </TooltipFooter>
          </TooltipBox>,
          document.body,
        )}
    </>
  );
};
