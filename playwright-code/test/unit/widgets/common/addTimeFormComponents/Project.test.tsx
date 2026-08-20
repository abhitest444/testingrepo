import React from 'react';
import { screen } from '@testing-library/react';

import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  Project,
  ProjectProps,
} from 'src/js/widgets/common/addTimeFormComponents/Project';
import { SINGLE_TIME_TRACKING_POINTS } from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

describe('Project Component', () => {
  let props: ProjectProps;

  beforeEach(() => {
    props = {
      name: 'project',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.PROJECT,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithFormProvider(<Project {...props} />, {
      defaultValues: {
        project: {
          id: '1',
          name: '',
        },
      },
    });

    // Check if the component renders with the correct label
    expect(screen.getByText(/project/)).toBeInTheDocument();
  });
});
