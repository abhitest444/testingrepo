import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import Widget from 'web-shell-core/widgets/HOCWidget';
import GuidedTooltip from 'src/js/widgets/common/TourFramework/components/GuidedTooltip';
import { TourStep } from 'src/js/widgets/common/TourFramework/types';
import { useTourStorage } from 'src/js/widgets/common/TourFramework/hooks/useTourStorage';
import projectsAnimation from 'src/assets/animations/projects.json';
import {
  IntroBulletList,
  IntroBullet,
  IntroModalOverrides,
} from './TimeProjectTour.styled';

// Tour storage id — changing this string forces the tour to re-show for
// every existing user, so treat it as part of the public API of the tour.
// Bumping the suffix is the standard way to re-trigger the tour after a
// content or flow change. Keep the `time-project-intro-` prefix stable
// so the scoped CSS selectors in `TimeProjectTour.styled.ts` (which
// match `[data-testid^="guided-modal-time-project-intro"]`) keep
// applying after a bump.
const TOUR_ID = 'time-project-tour';

type TourStage =
  | 'idle'
  | 'intro'
  | 'manageProjects'
  | 'estimateDrawer'
  | 'done';

interface TimeProjectTourProps {
  // Should this tour be evaluated this render? Callers gate on things
  // like "data is loaded" / "feature flag on" before turning it on so we
  // don't flash a tour over a loading skeleton.
  enabled: boolean;
  // Whether the project list has at least one row. The first two steps
  // (intro + manage projects) are valid for any user; the third
  // (estimate drawer) requires a row to anchor against, so we skip it
  // when the list is empty.
  hasProjects: boolean;
  // Bumped by the parent whenever an anchor's underlying DOM node
  // changes. Refs alone don't trigger React renders, so the parent
  // pairs them with this counter to force re-evaluation of step
  // readiness.
  anchorVersion: number;
  // DOM anchors for the popover steps as RefObjects. Resolved by the
  // parent so this component stays decoupled from the page layout.
  manageProjectsAnchorRef: React.RefObject<HTMLElement | null>;
  estimateDrawerAnchorRef: React.RefObject<HTMLElement | null>;
  // Whether the create-estimate drawer is currently mounted. Used to
  // hold the tour at the manage-projects step until the drawer is ready
  // (we pass a fresh anchor as soon as the drawer paints).
  estimateDrawerOpen: boolean;
  // Called by step 2's "Done" — the parent should open the create
  // estimate drawer for the first row at this point. The orchestrator
  // will automatically advance to step 3 once `estimateDrawerAnchor`
  // becomes a real node.
  onRequestOpenEstimateDrawer: () => void;
  // Called when the entire tour completes (or is dismissed via X).
  onComplete?: () => void;
}

/**
 * Three-stage walkthrough for the Time Projects landing page:
 *
 *   1. Intro modal (Lottie + bullet list + "Got it") — uses the shared
 *      `TourFramework` widget in modal mode.
 *   2. Tooltip on the "Manage projects" button — shared
 *      `GuidedTooltip` (single-step) so we get IDS-consistent chrome
 *      (close X, footer button) for free.
 *   3. Tooltip pointing at the create-estimate drawer's left edge.
 *
 * Persistence: completion is recorded against `TOUR_ID` via
 * `useTourStorage` once the user clicks the final "Got it" (or X's out
 * of any step), matching how other tours opt out of re-prompting.
 */
const TimeProjectTour: React.FC<TimeProjectTourProps> = ({
  enabled,
  hasProjects,
  anchorVersion,
  manageProjectsAnchorRef,
  estimateDrawerAnchorRef,
  estimateDrawerOpen,
  onRequestOpenEstimateDrawer,
  onComplete,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const text = (id: string) => intl.formatMessage({ id });

  const [stage, setStage] = useState<TourStage>('idle');

  // Tracks whether the user clicked "Got it" on the intro modal. The
  // shared `GuidedModal` fires both its step `onNext` callback AND the
  // top-level `onClose` prop in the same handler when the action button
  // is pressed (so X / Done both look the same upstream). Without this
  // ref, our `handleIntroClose` would immediately undo the stage advance
  // we just made in `handleIntroComplete`, and the user would never see
  // the Manage projects tooltip.
  const introNextClickedRef = useRef(false);
  // Same trick for the manageProjects tooltip: `GuidedTooltip` (single-
  // step) fires both `onComplete` AND `onClose` from the same Done click.
  // Without this guard, the click would advance the stage AND
  // immediately call finishTour, so the third (estimate-drawer) step
  // would never get a chance to render.
  const manageNextClickedRef = useRef(false);

  const {
    isTourCompleted,
    isLoading: isStorageLoading,
    initializeTourStatus,
    markTourCompleted,
  } = useTourStorage(sandbox, TOUR_ID);

  // Read the persisted completion flag exactly once when the tour
  // becomes eligible. Without this, every parent re-render would refire
  // the request.
  useEffect(() => {
    if (!enabled) return;
    initializeTourStatus();
  }, [enabled, initializeTourStatus]);

  // Move from `idle` into the intro modal once we know the user hasn't
  // already seen the tour. Stays in `idle` (no UI rendered) for users
  // who completed it before.
  useEffect(() => {
    if (!enabled || isStorageLoading) return;
    if (stage !== 'idle') return;
    if (isTourCompleted) {
      setStage('done');
      return;
    }
    setStage('intro');
  }, [enabled, isStorageLoading, isTourCompleted, stage]);

  // Auto-advance from `manageProjects` to `estimateDrawer` as soon as
  // the parent has actually mounted the drawer and registered its
  // anchor. We can't advance synchronously from the click handler
  // because the drawer mounts on the next render.
  useEffect(() => {
    if (stage !== 'manageProjects') return;
    if (estimateDrawerOpen && estimateDrawerAnchorRef.current) {
      setStage('estimateDrawer');
    }
    // anchorVersion participates in the dep list so we re-check the
    // ref when the parent reports a fresh DOM node.
  }, [stage, estimateDrawerOpen, estimateDrawerAnchorRef, anchorVersion]);

  const finishTour = useCallback(async () => {
    setStage('done');
    try {
      await markTourCompleted();
    } catch (err) {
      sandbox.logger.warn(
        '[TimeProjectTour] Failed to persist tour completion',
        { error: err },
      );
    }
    onComplete?.();
  }, [markTourCompleted, onComplete, sandbox]);

  // Recovery for the estimate-drawer step. If the drawer disappears
  // while we're anchored to it (user closes the drawer, save completes
  // and the parent dispatches `closeEstimateDrawer`, page navigates
  // etc.), the tooltip would silently render `null` and the tour would
  // be stuck — never persisting completion and re-triggering on the
  // next reload. Treat any disappearance of the drawer as the user
  // being done and persist completion.
  useEffect(() => {
    if (stage !== 'estimateDrawer') return;
    if (!estimateDrawerOpen) {
      finishTour();
    }
  }, [stage, estimateDrawerOpen, finishTour]);

  // Mid-tour disable recovery. If the parent flips `enabled` to false
  // while the tour is showing (e.g., user navigates away, page errors),
  // the anchors the popovers depend on may unmount. Reset back to
  // `idle` so we don't render stale popovers against stale DOM. We
  // deliberately do NOT persist completion here — the user hasn't
  // actually finished, they've just navigated away, and we want the
  // tour to re-evaluate cleanly when `enabled` flips back to true.
  useEffect(() => {
    if (enabled) return;
    if (stage === 'idle' || stage === 'done') return;
    setStage('idle');
  }, [enabled, stage]);

  const handleIntroComplete = useCallback(() => {
    introNextClickedRef.current = true;
    setStage('manageProjects');
  }, []);

  const handleIntroClose = useCallback(() => {
    if (introNextClickedRef.current) {
      // The framework also calls onClose right after our onNext fires
      // when the user clicks "Got it". Swallow that ghost close so we
      // don't immediately roll the tour into the `done` state.
      introNextClickedRef.current = false;
      return;
    }
    // Genuine dismiss (X button) — count it as completing the whole
    // tour so we don't keep re-prompting on every reload.
    finishTour();
  }, [finishTour]);

  const handleManageProjectsConfirm = useCallback(() => {
    manageNextClickedRef.current = true;
    if (!hasProjects) {
      // No row to open the drawer against — the third step is
      // unreachable, so end the tour here. The user has still seen
      // the intro modal and the manage-projects tooltip, which is
      // the meaningful slice of the walkthrough for an empty list.
      finishTour();
      return;
    }
    onRequestOpenEstimateDrawer();
  }, [hasProjects, onRequestOpenEstimateDrawer, finishTour]);

  const handleManageProjectsClose = useCallback(() => {
    if (manageNextClickedRef.current) {
      // Ghost close fired right after Done — swallow it so the tour
      // doesn't terminate before the auto-advance effect transitions
      // us into the estimate-drawer step.
      manageNextClickedRef.current = false;
      return;
    }
    finishTour();
  }, [finishTour]);

  const handleEstimateDrawerConfirm = useCallback(() => {
    finishTour();
  }, [finishTour]);

  // Steps for the intro modal. Description is a ReactNode so we can
  // render proper bullet semantics rather than three lines of text.
  const introSteps: TourStep[] = [
    {
      id: 'time-project-intro',
      title: text('timeProject.tour.intro.title'),
      description: (
        <IntroBulletList>
          <IntroBullet>{text('timeProject.tour.intro.bullet1')}</IntroBullet>
          <IntroBullet>{text('timeProject.tour.intro.bullet2')}</IntroBullet>
          <IntroBullet>{text('timeProject.tour.intro.bullet3')}</IntroBullet>
        </IntroBulletList>
      ),
      lottieData: projectsAnimation,
      doneLabel: text('timeProject.tour.gotIt'),
      onNext: handleIntroComplete,
    },
  ];

  // Step 2 — single-step tooltip anchored on the "Manage projects"
  // button. We construct it inside `useMemo` so the targetRef is always
  // a fresh wrapper that points at the parent's current ref node.
  // (`GuidedTooltip` reads `step.targetRef.current` at render time, so
  // a stable ref object is enough — but we still need `anchorVersion`
  // in the dep list to trigger the re-render when the node arrives.)
  const manageProjectsSteps: TourStep[] = useMemo(
    () => [
      {
        id: 'time-project-tour-manage',
        title: text('timeProject.tour.manageProjects.title'),
        description: text('timeProject.tour.manageProjects.body'),
        // Cast to RefObject<HTMLElement>: TourStep types the ref as
        // non-null, but the GuidedTooltip itself null-checks .current.
        targetRef: manageProjectsAnchorRef as React.RefObject<HTMLElement>,
        position: 'bottom',
        alignment: 'right',
        // Text-only marketing nudge — no Lottie / image / colored
        // placeholder, just the title + body.
        hideMedia: true,
        doneLabel: text('timeProject.tour.gotIt'),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intl, manageProjectsAnchorRef, anchorVersion],
  );

  const estimateDrawerSteps: TourStep[] = useMemo(
    () => [
      {
        id: 'time-project-tour-estimate',
        title: text('timeProject.tour.estimate.title'),
        description: text('timeProject.tour.estimate.body'),
        targetRef: estimateDrawerAnchorRef as React.RefObject<HTMLElement>,
        // Tooltip sits to the LEFT of the drawer's left edge so it
        // reads as "anchored to the border" rather than floating over
        // the drawer content. Top alignment keeps it visually paired
        // with the drawer header instead of drifting toward the
        // center of a tall drawer.
        position: 'left',
        alignment: 'top',
        hideMedia: true,
        // Push the tooltip rightward so its right edge overlaps the
        // drawer's left border (rather than floating in the gap a few
        // pixels off).
        tooltipOffset: { x: -35, y: 80 },
        doneLabel: text('timeProject.tour.gotIt'),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intl, estimateDrawerAnchorRef, anchorVersion],
  );

  return (
    <>
      {/* Scoped overrides (left-align title/body, auto-height container,
          contained Lottie) live next to the intro Widget so they're
          only injected while this tour is on screen. */}
      {stage === 'intro' && <IntroModalOverrides />}
      {stage === 'intro' && (
        <Widget
          key="time-tracking-ui/TourFramework-time-project-intro"
          widgetId="time-tracking-ui/TourFramework"
          data-testid="time-project-intro-tour-widget"
          tourId={`${TOUR_ID}-intro`}
          open
          steps={introSteps}
          mode="modal"
          onClose={handleIntroClose}
        />
      )}

      <GuidedTooltip
        open={stage === 'manageProjects'}
        steps={manageProjectsSteps}
        doneLabel={text('timeProject.tour.gotIt')}
        onClose={handleManageProjectsClose}
        onComplete={handleManageProjectsConfirm}
      />

      <GuidedTooltip
        open={stage === 'estimateDrawer'}
        steps={estimateDrawerSteps}
        doneLabel={text('timeProject.tour.gotIt')}
        onClose={finishTour}
        onComplete={handleEstimateDrawerConfirm}
      />
    </>
  );
};

export default TimeProjectTour;
