import { PointFeature } from 'supercluster';
import { WhoIsWorkingWorkerNode } from '../hooks/useWhoIsWorkingLoadMore';

export interface WorkerGeoJSONProperties {
  workerDetails: WhoIsWorkingWorkerNode;
  isSelected: boolean;
}

/**
 * Transform worker data to GeoJSON Point Feature
 * Required format for supercluster library
 */
export const transformWorkerToGeoJSON = (
  worker: WhoIsWorkingWorkerNode,
  selectedWorkerId: string,
): PointFeature<WorkerGeoJSONProperties> => {
  const location = worker.currentLocation!;

  return {
    type: 'Feature',
    properties: {
      workerDetails: worker,
      isSelected: worker.timeForContactDAS?.id === selectedWorkerId,
    },
    geometry: {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    },
  };
};
