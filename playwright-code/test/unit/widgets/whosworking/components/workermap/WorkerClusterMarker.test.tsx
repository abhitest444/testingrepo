import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { PointFeature, ClusterProperties } from 'supercluster';
import { WorkerClusterMarker } from 'src/js/widgets/whosworking/components/workerMap/WorkerClusterMarker';

// Mock @payroll/quicksand to provide useIntl
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }, values?: any) => {
      const messages: Record<string, string> = {
        'whosWorking.map.cluster.title': `${
          values?.count || 0
        } workers in this area`,
      };
      return messages[id] || id;
    },
  }),
}));

// Mock @ids-ts/typography
jest.mock('@ids-ts/typography', () => ({
  B3: ({ children, weight }: any) => (
    <span data-testid="cluster-count" data-weight={weight}>
      {children}
    </span>
  ),
}));

// Helper to create mock cluster
const createMockCluster = (
  id: number,
  coordinates: [number, number],
  pointCount: number,
): PointFeature<ClusterProperties> => ({
  type: 'Feature',
  id,
  properties: {
    cluster: true,
    cluster_id: id,
    point_count: pointCount,
    point_count_abbreviated: pointCount,
  },
  geometry: {
    type: 'Point',
    coordinates,
  },
});

describe('WorkerClusterMarker', () => {
  const defaultCluster = createMockCluster(1, [-74.006, 40.7128], 5);

  const defaultProps = {
    cluster: defaultCluster,
    count: 5,
    lat: 40.7128,
    lng: -74.006,
    isSelected: false,
    onClusterClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component', () => {
      render(<WorkerClusterMarker {...defaultProps} />);

      expect(screen.getByTestId('cluster-count')).toBeInTheDocument();
    });

    it('displays the count with plus prefix', () => {
      render(<WorkerClusterMarker {...defaultProps} count={10} />);

      expect(screen.getByTestId('cluster-count')).toHaveTextContent('+10');
    });

    it('displays large counts correctly', () => {
      render(<WorkerClusterMarker {...defaultProps} count={999} />);

      expect(screen.getByTestId('cluster-count')).toHaveTextContent('+999');
    });

    it('displays single digit count', () => {
      render(<WorkerClusterMarker {...defaultProps} count={1} />);

      expect(screen.getByTestId('cluster-count')).toHaveTextContent('+1');
    });

    it('uses demi weight for typography', () => {
      render(<WorkerClusterMarker {...defaultProps} />);

      expect(screen.getByTestId('cluster-count')).toHaveAttribute(
        'data-weight',
        'demi',
      );
    });
  });

  describe('Selection State', () => {
    it('renders when isSelected is true', () => {
      render(<WorkerClusterMarker {...defaultProps} isSelected />);

      expect(screen.getByTestId('cluster-count')).toBeInTheDocument();
    });

    it('renders when isSelected is false', () => {
      render(<WorkerClusterMarker {...defaultProps} isSelected={false} />);

      expect(screen.getByTestId('cluster-count')).toBeInTheDocument();
    });

    it('defaults to non-selected when isSelected not provided', () => {
      const props = { ...defaultProps };
      delete (props as any).isSelected;

      render(<WorkerClusterMarker {...props} />);

      expect(screen.getByTestId('cluster-count')).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('calls onClusterClick with cluster when clicked', () => {
      const onClusterClick = jest.fn();
      render(
        <WorkerClusterMarker
          {...defaultProps}
          onClusterClick={onClusterClick}
        />,
      );

      fireEvent.click(screen.getByTestId('cluster-count'));

      expect(onClusterClick).toHaveBeenCalledWith(defaultCluster);
    });

    it('stops event propagation on click', () => {
      const parentClickHandler = jest.fn();
      render(
        /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
        <div onClick={parentClickHandler}>
          <WorkerClusterMarker {...defaultProps} />
        </div>,
      );

      fireEvent.click(screen.getByTestId('cluster-count'));

      expect(parentClickHandler).not.toHaveBeenCalled();
    });

    it('calls onClusterClick only once per click', () => {
      const onClusterClick = jest.fn();
      render(
        <WorkerClusterMarker
          {...defaultProps}
          onClusterClick={onClusterClick}
        />,
      );

      fireEvent.click(screen.getByTestId('cluster-count'));
      fireEvent.click(screen.getByTestId('cluster-count'));

      expect(onClusterClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Lat/Lng Props', () => {
    it('accepts latitude and longitude', () => {
      render(
        <WorkerClusterMarker {...defaultProps} lat={40.7128} lng={-74.006} />,
      );

      expect(screen.getByTestId('cluster-count')).toBeInTheDocument();
    });

    it('handles zero coordinates', () => {
      render(<WorkerClusterMarker {...defaultProps} lat={0} lng={0} />);

      expect(screen.getByTestId('cluster-count')).toBeInTheDocument();
    });

    it('handles negative coordinates', () => {
      render(
        <WorkerClusterMarker {...defaultProps} lat={-33.8688} lng={151.2093} />,
      );

      expect(screen.getByTestId('cluster-count')).toBeInTheDocument();
    });
  });

  describe('Cluster Properties', () => {
    it('handles cluster with different IDs', () => {
      const cluster1 = createMockCluster(100, [-74, 40], 3);
      const cluster2 = createMockCluster(200, [-118, 34], 7);

      const onClusterClick = jest.fn();

      const { rerender } = render(
        <WorkerClusterMarker
          {...defaultProps}
          cluster={cluster1}
          count={3}
          onClusterClick={onClusterClick}
        />,
      );

      fireEvent.click(screen.getByTestId('cluster-count'));
      expect(onClusterClick).toHaveBeenCalledWith(cluster1);

      rerender(
        <WorkerClusterMarker
          {...defaultProps}
          cluster={cluster2}
          count={7}
          onClusterClick={onClusterClick}
        />,
      );

      fireEvent.click(screen.getByTestId('cluster-count'));
      expect(onClusterClick).toHaveBeenCalledWith(cluster2);
    });

    it('passes correct cluster to callback', () => {
      const cluster = createMockCluster(42, [-100, 35], 15);
      const onClusterClick = jest.fn();

      render(
        <WorkerClusterMarker
          {...defaultProps}
          cluster={cluster}
          count={15}
          onClusterClick={onClusterClick}
        />,
      );

      fireEvent.click(screen.getByTestId('cluster-count'));

      expect(onClusterClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 42,
          properties: expect.objectContaining({
            cluster: true,
            cluster_id: 42,
            point_count: 15,
          }),
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles zero count', () => {
      render(<WorkerClusterMarker {...defaultProps} count={0} />);

      expect(screen.getByTestId('cluster-count')).toHaveTextContent('+0');
    });

    it('handles very large count', () => {
      render(<WorkerClusterMarker {...defaultProps} count={10000} />);

      expect(screen.getByTestId('cluster-count')).toHaveTextContent('+10000');
    });
  });
});
