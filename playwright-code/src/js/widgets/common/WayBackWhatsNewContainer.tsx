import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

import { IconControl } from '@ids-ts/icon-control';
import { MapSigns, PlayFill } from '@design-systems/icons';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from '@ids-ts/drawer';
import Button from '@ids-ts/button';
import PageMessage from '@ids-ts/page-message';
import { B3 } from '@ids-ts/typography';
import { useIntl, useTracking } from '@payroll/quicksand';
import Video from '@ids-ts/video';

import { SINGLE_TIME_TRACKING_POINTS } from 'src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';
import { WEEKLY_TIME_TRACKING_POINTS } from 'src/js/common/useClickTracking';

import TimeEntriesMakeoverUrl from 'src/js/widgets/images/TimeEntriesMakeover.png';
import { useStorage } from 'src/js/hooks/useStorage';

const IconControlWrapper = styled.div`
  display: flex;
  gap: 20px;
  padding: 10px;
  justify-content: flex-end;
  height: 56px;

  @media screen and (max-width: 768px) {
    display: none;
  }
`;

const StyledPageMessage = styled(PageMessage)`
  &&& {
    align-items: center;
    margin-bottom: 1em;
    flex: 0 1 auto;
  }
`;

const DrawerContentMessage = styled.div`
  margin-bottom: 12px;
`;

const DrawerContentListItem = styled.div`
  margin-bottom: 1.5em;
`;

const StyledIconControl = styled(IconControl)`
  height: 200px;

  &&& {
    display: grid;
    grid-template-areas: 'stack';
    justify-items: center;
    align-items: center;
  }

  svg {
    z-index: 100;
    grid-area: stack;
    margin-right: 0;
  }

  img {
    grid-area: stack;
    margin-left: -8px;
    margin-right: -8px;
    height: 100%;
    width: 100%;
  }
`;

interface WithSelector {
  selector: string;
  trowserId?: never;
  comingSoon?: boolean;
  isFormEdited?: boolean;
  isTimeEntry?: boolean;
  trackingPoints:
    | typeof SINGLE_TIME_TRACKING_POINTS
    | typeof WEEKLY_TIME_TRACKING_POINTS;
  onTourReset?: () => void;
  actionLabelId?: string;
}

interface WithTrowserId {
  selector?: never;
  trowserId: string;
  comingSoon?: boolean;
  isFormEdited?: boolean;
  isTimeEntry?: boolean;
  onTourReset?: () => void;
  trackingPoints:
    | typeof SINGLE_TIME_TRACKING_POINTS
    | typeof WEEKLY_TIME_TRACKING_POINTS;
  actionLabelId?: string;
}

export type WayBackWhatsNewContainerProps = WithSelector | WithTrowserId;

const WayBackWhatsNewContainer = ({
  selector,
  trowserId,
  trackingPoints,
  comingSoon = false,
  isFormEdited = false,
  isTimeEntry = false,
  onTourReset,
  actionLabelId = 'whatsNew.action.label',
}: WayBackWhatsNewContainerProps): JSX.Element => {
  const [showWhatsNewMessage, setShowWhatsNewMessage] = useStorage(
    'ttui-showWhatsNewMessageFinal',
  ) as [boolean, (value: boolean) => void];
  const [showWhatsNewPanel, setShowWhatsNewPanel] = useState(false);
  const [showWhatsNewVideo, setShowWhatsNewVideo] = useState(false);

  const intl = useIntl();
  const track = useTracking();

  const defaultSelector =
    selector || `[data-automation-id*='${trowserId}_header'] > :last-child`;
  const portalRoot = useRef(document.createElement('div'));

  useEffect(() => {
    document.querySelector(defaultSelector)?.prepend(portalRoot.current);
  }, [defaultSelector]);

  useEffect(() => {
    if (showWhatsNewMessage === null) {
      setShowWhatsNewMessage(true);
    }
  }, [showWhatsNewMessage, setShowWhatsNewMessage]);

  const handleSeeWhatsNewClick = () => {
    if (onTourReset) {
      onTourReset();
    } else {
      setShowWhatsNewPanel(true);
    }
    if (trackingPoints) {
      track(trackingPoints.SEE_WHATS_NEW);
    }
  };

  const handleWhatsNewPanelOnClose = () => {
    setShowWhatsNewPanel(false);
  };

  const handlePageMessageDismiss = () => {
    setShowWhatsNewMessage(false);
  };

  const handleShowVideoClick = () => {
    setShowWhatsNewVideo(true);
  };

  const handleCloseVideo = () => {
    setShowWhatsNewVideo(false);
  };

  const renderHeaderIconButtons = () =>
    createPortal(
      <IconControlWrapper>
        {!isTimeEntry && (
          <IconControl
            label={intl.formatMessage({ id: actionLabelId })}
            size="medium"
            onClick={handleSeeWhatsNewClick}
          >
            <MapSigns />
          </IconControl>
        )}
      </IconControlWrapper>,
      portalRoot.current,
    );

  return (
    <>
      {renderHeaderIconButtons()}
      {comingSoon && (
        <StyledPageMessage
          type="info"
          actionLabel={intl.formatMessage({ id: actionLabelId })}
          onActionClick={handleSeeWhatsNewClick}
          data-testid="whats-new-message-banner"
          open={showWhatsNewMessage}
          dismissible
          onClose={handlePageMessageDismiss}
        >
          {intl.formatMessage({ id: 'whatsNew.banner.message' })}
        </StyledPageMessage>
      )}
      <Drawer
        backdrop
        open={showWhatsNewPanel}
        size="small"
        onClose={handleWhatsNewPanelOnClose}
        autoFocus
        restoreFocus
        data-testid="whats-new-panel"
      >
        <DrawerHeader
          title={intl.formatMessage({ id: 'watsNew.panel.title' })}
        />
        <DrawerContent>
          <DrawerContentMessage>
            <B3>{intl.formatMessage({ id: 'whatsNew.panel.message' })}</B3>
          </DrawerContentMessage>
          <DrawerContentListItem>
            <B3 as="h3" weight="demi">
              {intl.formatMessage({ id: 'whatsNew.panel.list.title.one' })}
            </B3>
            <B3>
              {intl.formatMessage({ id: 'whatsNew.panel.list.descr.one' })}
            </B3>
          </DrawerContentListItem>
          <DrawerContentListItem>
            <B3 as="h3" weight="demi">
              {intl.formatMessage({ id: 'whatsNew.panel.list.title.two' })}
            </B3>
            <B3>
              {intl.formatMessage({ id: 'whatsNew.panel.list.descr.two' })}
            </B3>
          </DrawerContentListItem>
          <DrawerContentListItem>
            <B3 as="h3" weight="demi">
              {intl.formatMessage({ id: 'whatsNew.panel.list.title.three' })}
            </B3>
            <B3>
              {intl.formatMessage({ id: 'whatsNew.panel.list.descr.three' })}
            </B3>
          </DrawerContentListItem>
          <DrawerContentListItem>
            <B3 as="h3" weight="demi">
              {intl.formatMessage({ id: 'whatsNew.panel.list.title.four' })}
            </B3>
            <StyledIconControl
              size="large"
              onClick={handleShowVideoClick}
              aria-label={intl.formatMessage({
                id: 'whatsNew.panel.play.video.alt',
              })}
            >
              <PlayFill />
              <img src={TimeEntriesMakeoverUrl} alt="" />
            </StyledIconControl>
          </DrawerContentListItem>
        </DrawerContent>
        <DrawerFooter
          footerPrimaryAction={
            <Button purpose="standard" onClick={handleWhatsNewPanelOnClose}>
              Close
            </Button>
          }
        />
      </Drawer>
      <Video
        data-testid="whats-new-video"
        url="https://www.youtube.com/embed/j2AcIkmn4AY?si=NU1la8FmzaA5vgGl"
        open={showWhatsNewVideo}
        onCloseVideo={handleCloseVideo}
      />
    </>
  );
};

export default WayBackWhatsNewContainer;
