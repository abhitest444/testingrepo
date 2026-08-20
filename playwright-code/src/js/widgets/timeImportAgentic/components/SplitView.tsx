import React, { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ChatStyleFlow from './ChatStyleFlow';
import { Step5Review } from '../step5Review';
import Step6Complete from '../step6Complete/Step6Complete';
import { selectSaveResult } from '../store/selectors';

const DIVIDER_WIDTH_PX = 5;
const MIN_LEFT_PERCENT = 20;
const MAX_LEFT_PERCENT = 80;
const DEFAULT_LEFT_PERCENT = 70;

const dividerStyle: React.CSSProperties = {
  width: DIVIDER_WIDTH_PX,
  flexShrink: 0,
  backgroundColor: '#808080',
  cursor: 'col-resize',
  userSelect: 'none',
};

export interface SplitViewProps {
  sandbox?: any;
  currentStep: number;
  isUploading: boolean;
  isLoading: boolean;
  hasError: string | null;
  isExtracting?: boolean;
  isGlobalProcessing?: boolean;
  onScanUploadSuccess: (fileId: string) => void;
  onMappingSubmit: () => void;
  onClose: () => void;
}

export const SplitView: React.FC<SplitViewProps> = ({
  sandbox,
  currentStep,
  isUploading,
  isLoading,
  hasError,
  isExtracting = false,
  isGlobalProcessing = false,
  onScanUploadSuccess,
  onMappingSubmit,
  onClose,
}) => {
  const [leftPercent, setLeftPercent] = useState(DEFAULT_LEFT_PERCENT);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startLeftPercentRef = useRef(DEFAULT_LEFT_PERCENT);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDividerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      startLeftPercentRef.current = leftPercent;
    },
    [leftPercent],
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    if (containerWidth <= 0) return;
    const deltaX = e.clientX - startXRef.current;
    const deltaPercent = (deltaX / containerWidth) * 100;
    let next = startLeftPercentRef.current + deltaPercent;
    next = Math.max(MIN_LEFT_PERCENT, Math.min(MAX_LEFT_PERCENT, next));
    setLeftPercent(next);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const saveResult = useSelector(selectSaveResult);

  // Left: review table (step 5) or success screen (step 6). Success/failure shown via row styling on step 5.
  const renderLeftPanelContent = () =>
    currentStep === 6 ? (
      <Step6Complete
        onClose={onClose}
        savedCount={saveResult?.savedEntries ?? 0}
        sandbox={sandbox}
      />
    ) : (
      <Step5Review hideTitle tableOnly />
    );

  // Right: chat-style flow – upload → preview → extraction summary → step 2 → step 3 → step 4 (same Redux/processing)
  const renderRightPanelContent = () => (
    <ChatStyleFlow
      sandbox={sandbox}
      currentStep={currentStep}
      isUploading={isUploading}
      isLoading={isLoading}
      hasError={hasError}
      isExtracting={isExtracting}
      isGlobalProcessing={isGlobalProcessing}
      onScanUploadSuccess={onScanUploadSuccess}
      onMappingSubmit={onMappingSubmit}
    />
  );

  return (
    <div
      ref={containerRef}
      data-view="split-view"
      style={{
        display: 'flex',
        width: '100%',
        height: '87vh',
        overflow: 'hidden',
      }}
    >
      <div
        data-panel="left"
        style={{
          width: `calc((100% - ${DIVIDER_WIDTH_PX}px) * ${leftPercent} / 100)`,
          minWidth: 0,
          height: '100%',
          overflow: 'auto',
          backgroundColor: '#f5f5f5',
          padding: '20px',
        }}
      >
        {renderLeftPanelContent()}
      </div>
      <div
        role="separator"
        aria-valuenow={leftPercent}
        aria-valuemin={MIN_LEFT_PERCENT}
        aria-valuemax={MAX_LEFT_PERCENT}
        aria-label="Resize panels"
        data-divider
        style={dividerStyle}
        onMouseDown={handleDividerMouseDown}
      />
      <div
        data-panel="right"
        style={{
          flex: 1,
          minWidth: 0,
          height: '87vh',
          overflow: 'auto',
          backgroundColor: '#fafafa',
          padding: '20px',
        }}
      >
        {renderRightPanelContent()}
      </div>
    </div>
  );
};

export default SplitView;
