import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import 'jest-styled-components';
import {
  WorkerMapContainer,
  MapContainer,
  MapToggleContainer,
  MapHeaderContainer,
  MapHeader,
  MapStatsContainer,
  HeaderImage,
  ClockedInMarker,
  ClockedInCountContainer,
  StyledIconControl,
} from 'src/js/widgets/whosworking/components/workerMap/WorkerMap.styled';

describe('WorkerMap.styled', () => {
  describe('WorkerMapContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<WorkerMapContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('is a div element', () => {
      const { container } = render(<WorkerMapContainer />);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('has correct flex style', () => {
      const { container } = render(<WorkerMapContainer />);
      expect(container.firstChild).toHaveStyleRule('flex', '1');
    });

    it('has correct display style', () => {
      const { container } = render(<WorkerMapContainer />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct flex-direction style', () => {
      const { container } = render(<WorkerMapContainer />);
      expect(container.firstChild).toHaveStyleRule('flex-direction', 'column');
    });

    it('has correct border-right style', () => {
      const { container } = render(<WorkerMapContainer />);
      expect(container.firstChild).toHaveStyleRule(
        'border-right',
        '1px solid #d4d7dc',
      );
    });

    it('has correct border-radius style', () => {
      const { container } = render(<WorkerMapContainer />);
      expect(container.firstChild).toHaveStyleRule(
        'border-radius',
        '12px 0 0 12px',
      );
    });

    it('has correct overflow style', () => {
      const { container } = render(<WorkerMapContainer />);
      expect(container.firstChild).toHaveStyleRule('overflow', 'hidden');
    });
  });

  describe('MapContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<MapContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct flex style', () => {
      const { container } = render(<MapContainer />);
      expect(container.firstChild).toHaveStyleRule('flex', '1');
    });

    it('has correct position style', () => {
      const { container } = render(<MapContainer />);
      expect(container.firstChild).toHaveStyleRule('position', 'relative');
    });

    it('accepts ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<MapContainer ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('MapToggleContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<MapToggleContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct position style', () => {
      const { container } = render(<MapToggleContainer />);
      expect(container.firstChild).toHaveStyleRule('position', 'absolute');
    });

    it('has correct top style', () => {
      const { container } = render(<MapToggleContainer />);
      expect(container.firstChild).toHaveStyleRule('top', '16px');
    });

    it('has correct left style', () => {
      const { container } = render(<MapToggleContainer />);
      expect(container.firstChild).toHaveStyleRule('left', '16px');
    });

    it('has correct z-index style', () => {
      const { container } = render(<MapToggleContainer />);
      expect(container.firstChild).toHaveStyleRule('z-index', '1');
    });
  });

  describe('MapHeaderContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<MapHeaderContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<MapHeaderContainer />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct align-items style', () => {
      const { container } = render(<MapHeaderContainer />);
      expect(container.firstChild).toHaveStyleRule('align-items', 'center');
    });

    it('has correct justify-content style', () => {
      const { container } = render(<MapHeaderContainer />);
      expect(container.firstChild).toHaveStyleRule(
        'justify-content',
        'space-between',
      );
    });

    it('has correct padding style', () => {
      const { container } = render(<MapHeaderContainer />);
      expect(container.firstChild).toHaveStyleRule('padding', '16px');
    });

    it('has correct border-bottom style', () => {
      const { container } = render(<MapHeaderContainer />);
      expect(container.firstChild).toHaveStyleRule(
        'border-bottom',
        '1px solid #d4d7dc',
      );
    });
  });

  describe('MapHeader', () => {
    it('renders without crashing', () => {
      const { container } = render(<MapHeader />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<MapHeader />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct align-items style', () => {
      const { container } = render(<MapHeader />);
      expect(container.firstChild).toHaveStyleRule('align-items', 'center');
    });
  });

  describe('MapStatsContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<MapStatsContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<MapStatsContainer />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct align-items style', () => {
      const { container } = render(<MapStatsContainer />);
      expect(container.firstChild).toHaveStyleRule('align-items', 'center');
    });
  });

  describe('HeaderImage', () => {
    it('renders without crashing', () => {
      const { container } = render(<HeaderImage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct margin-right style', () => {
      const { container } = render(<HeaderImage />);
      expect(container.firstChild).toHaveStyleRule('margin-right', '8px');
    });
  });

  describe('ClockedInMarker', () => {
    it('renders without crashing', () => {
      const { container } = render(<ClockedInMarker />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('is a div element', () => {
      const { container } = render(<ClockedInMarker />);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('has correct height style', () => {
      const { container } = render(<ClockedInMarker />);
      expect(container.firstChild).toHaveStyleRule('height', '8px');
    });

    it('has correct width style', () => {
      const { container } = render(<ClockedInMarker />);
      expect(container.firstChild).toHaveStyleRule('width', '8px');
    });

    it('has correct border-radius style', () => {
      const { container } = render(<ClockedInMarker />);
      expect(container.firstChild).toHaveStyleRule('border-radius', '50%');
    });

    it('has correct background style', () => {
      const { container } = render(<ClockedInMarker />);
      expect(container.firstChild).toHaveStyleRule('background', '#108000');
    });
  });

  describe('StyledIconControl', () => {
    it('renders without crashing', () => {
      const { container } = render(<StyledIconControl />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct margin-left style', () => {
      const { container } = render(<StyledIconControl />);
      expect(container.firstChild).toHaveStyleRule('margin-left', '12px');
    });
  });

  describe('ClockedInCountContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<ClockedInCountContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('is a div element', () => {
      const { container } = render(<ClockedInCountContainer />);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('has correct padding style', () => {
      const { container } = render(<ClockedInCountContainer />);
      expect(container.firstChild).toHaveStyleRule('padding', '0 12px');
    });

    it('has correct line-height style', () => {
      const { container } = render(<ClockedInCountContainer />);
      expect(container.firstChild).toHaveStyleRule('line-height', 'normal');
    });

    it('has correct border-right style', () => {
      const { container } = render(<ClockedInCountContainer />);
      expect(container.firstChild).toHaveStyleRule('border-right', '1px solid');
    });
  });

  describe('Component Composition', () => {
    it('renders map header layout correctly', () => {
      const { container, getByText } = render(
        <WorkerMapContainer>
          <MapHeaderContainer>
            <MapHeader>
              <HeaderImage />
              <span>Team&apos;s Locations</span>
            </MapHeader>
            <MapStatsContainer>
              <ClockedInMarker />
              <ClockedInCountContainer>
                5 of 20 on clock
              </ClockedInCountContainer>
              <StyledIconControl />
            </MapStatsContainer>
          </MapHeaderContainer>
          <MapContainer>
            <MapToggleContainer>
              <button type="button">Map</button>
              <button type="button">Satellite</button>
            </MapToggleContainer>
          </MapContainer>
        </WorkerMapContainer>,
      );

      expect(container.firstChild).toBeInTheDocument();
      expect(getByText("Team's Locations")).toBeInTheDocument(); // eslint-disable-line quotes
      expect(getByText('5 of 20 on clock')).toBeInTheDocument();
      expect(getByText('Map')).toBeInTheDocument();
      expect(getByText('Satellite')).toBeInTheDocument();
    });
  });
});
