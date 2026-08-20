import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AssignmentPagination from 'src/js/widgets/common/AssignmentDrawer/components/AssignmentPagination';

// Mock @ids-ts/pagination
jest.mock('@ids-ts/pagination', () => ({
  Pagination: ({
    totalPages,
    totalItems,
    pageSize,
    activePage,
    labels,
    onPageChange,
    preventPageJump,
  }: any) => {
    const startItem = (activePage - 1) * pageSize + 1;
    const endItem = Math.min(activePage * pageSize, totalItems);

    return (
      <div data-testid="pagination" data-prevent-page-jump={preventPageJump}>
        <button
          data-testid="prev-button"
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage === 1}
        >
          Previous
        </button>
        <span data-testid="page-range">
          {startItem}-{endItem} of {totalItems} {labels.summaryItems}
        </span>
        <button
          data-testid="next-button"
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage === totalPages}
        >
          Next
        </button>
      </div>
    );
  },
}));

describe('AssignmentPagination Component', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 50,
    pageSize: 10,
    summaryItems: 'customers',
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render pagination with correct range', () => {
    render(<AssignmentPagination {...defaultProps} />);
    expect(screen.getByTestId('page-range')).toHaveTextContent(
      '1-10 of 50 customers',
    );
  });

  it('should render previous and next buttons', () => {
    render(<AssignmentPagination {...defaultProps} currentPage={2} />);
    expect(screen.getByTestId('prev-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
  });

  test.each([
    {
      description: 'disables previous button on first page',
      currentPage: 1,
      buttonTestId: 'prev-button',
    },
    {
      description: 'disables next button on last page',
      currentPage: 5,
      buttonTestId: 'next-button',
    },
  ])('should $description', ({ currentPage, buttonTestId }) => {
    render(
      <AssignmentPagination {...defaultProps} currentPage={currentPage} />,
    );
    const button = screen.getByTestId(buttonTestId);
    expect(button).toBeDisabled();
  });

  it('should call onPageChange with previous page when clicking previous', () => {
    const onPageChange = jest.fn();
    render(
      <AssignmentPagination
        {...defaultProps}
        currentPage={3}
        onPageChange={onPageChange}
      />,
    );

    const prevButton = screen.getByTestId('prev-button');
    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange with next page when clicking next', () => {
    const onPageChange = jest.fn();
    render(
      <AssignmentPagination
        {...defaultProps}
        currentPage={2}
        onPageChange={onPageChange}
      />,
    );

    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('should display correct range for middle page', () => {
    render(<AssignmentPagination {...defaultProps} currentPage={3} />);
    expect(screen.getByTestId('page-range')).toHaveTextContent(
      '21-30 of 50 customers',
    );
  });

  it('should display correct range for last page with partial items', () => {
    render(
      <AssignmentPagination
        {...defaultProps}
        currentPage={5}
        totalPages={5}
        totalItems={45}
      />,
    );
    expect(screen.getByTestId('page-range')).toHaveTextContent(
      '41-45 of 45 customers',
    );
  });

  it('should work with different entity types', () => {
    render(
      <AssignmentPagination {...defaultProps} summaryItems="team members" />,
    );
    expect(screen.getByTestId('page-range')).toHaveTextContent(
      '1-10 of 50 team members',
    );
  });

  test.each([
    {
      description: 'does not render when totalPages is 1',
      totalPages: 1,
      totalItems: 5,
      expectPresent: false,
    },
    {
      description: 'renders when totalPages is greater than 1',
      totalPages: 10,
      totalItems: 100,
      expectPresent: true,
    },
  ])('should $description', ({ totalPages, totalItems, expectPresent }) => {
    render(
      <AssignmentPagination
        {...defaultProps}
        totalPages={totalPages}
        totalItems={totalItems}
      />,
    );
    if (expectPresent) {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByTestId('next-button')).not.toBeDisabled();
    } else {
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    }
  });

  it('should pass preventPageJump prop to Pagination', () => {
    render(<AssignmentPagination {...defaultProps} />);
    const pagination = screen.getByTestId('pagination');
    expect(pagination).toHaveAttribute('data-prevent-page-jump', 'true');
  });
});
