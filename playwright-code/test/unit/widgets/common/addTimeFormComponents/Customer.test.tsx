import React from 'react';
import { screen } from '@testing-library/react';

import { renderWithFormProvider } from 'test/unit/testUtils';
import {
  Customer,
  CustomerProps,
} from 'src/js/widgets/common/addTimeFormComponents/Customer';
import { SINGLE_TIME_TRACKING_POINTS } from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

describe('Customer Component', () => {
  let props: CustomerProps;

  beforeEach(() => {
    props = {
      name: 'customer',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.CUSTOMER,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithFormProvider(<Customer {...props} />, {
      defaultValues: {
        customer: {
          id: '',
          name: '',
        },
      },
    });

    // Check if the component renders with the correct label
    expect(screen.getByText(/customer/)).toBeInTheDocument();
  });
});
