import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AssignmentSummary from 'src/js/widgets/common/AssignmentDrawer/components/AssignmentSummary';

// Mock @ids-ts/typography components
jest.mock('@ids-ts/typography', () => ({
  B3: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="b3-text">{children}</div>
  ),
  Demi: ({ children }: { children: React.ReactNode }) => (
    <strong data-testid="demi-text">{children}</strong>
  ),
}));

describe('AssignmentSummary Component', () => {
  test.each([
    {
      description: 'renders summary with correct counts',
      selectedCount: 5,
      totalCount: 10,
      fieldName: 'Region',
      summaryType: 'customers',
      expectedText: '5 of 10 customers',
    },
    {
      description: 'renders with team members type',
      selectedCount: 3,
      totalCount: 15,
      fieldName: 'Department',
      summaryType: 'team members',
      expectedText: '3 of 15 team members',
    },
    {
      description: 'renders with all selected',
      selectedCount: 10,
      totalCount: 10,
      fieldName: 'Location',
      summaryType: 'customers',
      expectedText: '10 of 10 customers',
    },
    {
      description: 'renders with zero selected',
      selectedCount: 0,
      totalCount: 25,
      fieldName: 'Region',
      summaryType: 'customers',
      expectedText: '0 of 25 customers',
    },
    {
      description: 'handles large numbers correctly',
      selectedCount: 999,
      totalCount: 1500,
      fieldName: 'Custom Field',
      summaryType: 'time tracking fields',
      expectedText: '999 of 1500 time tracking fields',
    },
  ])(
    'should $description',
    ({ selectedCount, totalCount, fieldName, summaryType, expectedText }) => {
      render(
        <AssignmentSummary
          selectedCount={selectedCount}
          totalCount={totalCount}
          fieldName={fieldName}
          summaryType={summaryType}
        />,
      );

      expect(screen.getByText(expectedText)).toBeInTheDocument();
      expect(screen.getByText(fieldName)).toBeInTheDocument();
    },
  );

  it('should use default fieldName when not provided', () => {
    render(
      <AssignmentSummary
        selectedCount={5}
        totalCount={10}
        summaryType="customers"
      />,
    );

    expect(screen.getByText('Region')).toBeInTheDocument();
  });

  it('should render with hasChanges flag', () => {
    render(
      <AssignmentSummary
        selectedCount={5}
        totalCount={10}
        fieldName="Region"
        summaryType="customers"
        hasChanges
        changeCount={2}
      />,
    );

    // Summary should still render correctly
    expect(screen.getByText('5 of 10 customers')).toBeInTheDocument();
  });

  it('should render b3-text wrapper', () => {
    render(
      <AssignmentSummary
        selectedCount={5}
        totalCount={10}
        fieldName="Region"
        summaryType="customers"
      />,
    );

    expect(screen.getByTestId('b3-text')).toBeInTheDocument();
  });
});
