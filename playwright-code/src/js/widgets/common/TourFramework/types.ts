import type { GuidedTourTooltipProps as GTTProps } from '@ids-ts/guided-tour-tooltip';
import type { Positions, Alignments } from '@ids-ts/position';
import { Sandbox } from 'src/js/common/sandbox';

/**
 * TourStep is the same for both modal and tooltip,
 * for modal -> step_id will be the same as the id of the step,
 * for tooltip -> step_id can be anything, but targetRef is required, and will be same as data-testid of the target element,
 */

// This is passed as prop to the TourFramework component
export interface TourStep {
  id: string;
  title: string;
  // ReactNode (not just string) so consumers can render rich content like
  // bullet lists, links or inline emphasis inside the body. Both renderers
  // (`GuidedModal`'s <B2> and `GuidedTooltip`'s styled <Description>) pass
  // this straight through as children, so JSX works without extra plumbing.
  description: React.ReactNode;
  targetRef?: React.RefObject<HTMLElement>;
  showOverlay?: boolean;
  position?: Positions;
  alignment?: Alignments;
  image?: string; // Image URL/path or filename (e.g., 'display_by.svg')
  lottieData?: object | string; // Lottie animation data object or filename (e.g., 'animation.json')
  /**
   * Suppress the media block entirely for tooltip mode — no image, no
   * Lottie, and no random colored placeholder. Use this for text-only
   * informational tooltips where a media slot would just add visual
   * noise. Has no effect in modal mode (the modal layout reserves a
   * media region by design).
   */
  hideMedia?: boolean;
  /**
   * Pixel offset applied to the tooltip's final position (tooltip mode
   * only). Lets a consumer nudge the tooltip past the IDS-computed
   * placement — e.g., to overlap an adjacent drawer's border instead
   * of floating in the gap next to it. Implemented via the CSS
   * `translate` property so it composes with IDS' positioning
   * `transform` instead of clobbering it.
   */
  tooltipOffset?: { x?: number; y?: number };
  nextLabel?: string;
  backLabel?: string;
  doneLabel?: string;
  onNext?: () => void; // Custom callback when next button is clicked
  onBack?: () => void; // Custom callback when back button is clicked
}

/**
 * IDS-compatible step configuration for tooltip mode
 * Matches GTTStep interface from @ids-ts/guided-tour-tooltip
 */
export interface TooltipStepConfig {
  targetElement: HTMLElement | null;
  message: React.ReactNode;
  title?: string;
  className?: string;
  position?: Positions;
  alignment?: Alignments;
  nextLabel?: string;
  backLabel?: string;
  enableClickAway?: boolean;
  onNextClick?: (index: number) => void;
  onBackClick?: (index: number) => void;
  onClose?: (index?: number) => void;
  renderCoachMarks?: (
    props: GTTProps & { children: React.ReactNode },
  ) => JSX.Element | null;
  /**
   * Function that returns inline styles to apply to the Position wrapper
   * Called by IDS GuidedTourTooltip and passed to GuidanceTooltip's stylePosition prop
   * @param step - The current step object
   * @returns CSS properties object or null
   */
  stylePosition?: (step: TooltipStepConfig) => React.CSSProperties | null;
}

/**
 * Tour completion status for consumer callbacks
 */
export interface TourCompletionStatus {
  /** Whether the tour has been completed by this user */
  isCompleted: boolean;
  /** Whether we're still checking completion status */
  isLoading: boolean;
}

export interface TourFrameworkProps {
  /** The AppFabric sandbox instance - required for tour storage */
  sandbox: Sandbox;
  /** Whether the tour is currently open/visible */
  open: boolean;
  /** Array of tour steps to display */
  steps: TourStep[];
  /** Unique identifier for the tour - used for persistence */
  tourId: string;
  /** Display mode: 'modal' or 'tooltip' */
  mode?: 'modal' | 'tooltip';
  /**
   * Called when the tour is closed (via X button or Done button)
   * The consumer should set open=false in this callback
   */
  onClose: () => void;
  /**
   * Called when tour completion status changes
   * Use this to show/hide "View Tour" button based on completion
   * Also called when user completes the tour (isCompleted changes to true)
   */
  onComplete?: (status: TourCompletionStatus) => void;
  /** Label for the Done button on last step (default: 'Done') */
  doneLabel?: string;
  /** Label for the Next button (default: 'Next') */
  nextLabel?: string;
  /** Label for the Back button (default: 'Back') */
  backLabel?: string;
}

/**
 * Allowed value types for storage
 * Must match @appfabric/sandbox-spec AllowedStoredValueType
 */
export type AllowedStoredValueType = string | number | boolean | null;
