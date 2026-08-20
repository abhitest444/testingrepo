import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import 'jest-styled-components';
import { breakPoints } from 'src/js/common/screenSizeUtils';
import {
  WorkerListContainer,
  SearchContainer,
  FilterControl,
  PopoverContentWrapper,
  WorkerListContent,
  LoadingContainer,
  StyledTable,
  WorkerRow,
  WorkerCell,
  LoadingMoreContainer,
  LoadingMoreContent,
  HoursCellContainer,
  TimeOnClock,
  ProfileAvatar,
  ProfileAvatarContainer,
  WorkerNameContainer,
  WorkerNameDetails,
  ActionButton,
} from 'src/js/widgets/whosworking/components/workerList/WorkerList.styled';

describe('WorkerList.styled', () => {
  describe('WorkerListContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<WorkerListContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('is a div element', () => {
      const { container } = render(<WorkerListContainer />);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('has correct flex style', () => {
      const { container } = render(<WorkerListContainer />);
      expect(container.firstChild).toHaveStyleRule('flex', '1');
    });

    it('has correct display style', () => {
      const { container } = render(<WorkerListContainer />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct flex-direction style', () => {
      const { container } = render(<WorkerListContainer />);
      expect(container.firstChild).toHaveStyleRule('flex-direction', 'column');
    });

    it('has correct background style', () => {
      const { container } = render(<WorkerListContainer />);
      expect(container.firstChild).toHaveStyleRule('background', '#ffffff');
    });

    it('has correct overflow style', () => {
      const { container } = render(<WorkerListContainer />);
      expect(container.firstChild).toHaveStyleRule('overflow', 'hidden');
    });
  });

  describe('SearchContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<SearchContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<SearchContainer />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct margin-bottom style', () => {
      const { container } = render(<SearchContainer />);
      expect(container.firstChild).toHaveStyleRule('margin-bottom', '1rem');
    });

    it('has correct padding style', () => {
      const { container } = render(<SearchContainer />);
      expect(container.firstChild).toHaveStyleRule('padding', '1rem');
    });

    it('has correct align-items style', () => {
      const { container } = render(<SearchContainer />);
      expect(container.firstChild).toHaveStyleRule('align-items', 'flex-start');
    });
  });

  describe('FilterControl', () => {
    it('renders without crashing', () => {
      const { container } = render(<FilterControl />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct margin-left style', () => {
      const { container } = render(<FilterControl />);
      expect(container.firstChild).toHaveStyleRule('margin-left', '1rem');
    });
  });

  describe('PopoverContentWrapper', () => {
    it('renders without crashing', () => {
      const { container } = render(<PopoverContentWrapper />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<PopoverContentWrapper />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct flex-direction style', () => {
      const { container } = render(<PopoverContentWrapper />);
      expect(container.firstChild).toHaveStyleRule('flex-direction', 'column');
    });

    it('has correct gap style', () => {
      const { container } = render(<PopoverContentWrapper />);
      expect(container.firstChild).toHaveStyleRule('gap', '1rem');
    });

    it('has correct min-width style', () => {
      const { container } = render(<PopoverContentWrapper />);
      expect(container.firstChild).toHaveStyleRule('min-width', '300px');
    });
  });

  describe('WorkerListContent', () => {
    it('renders without crashing', () => {
      const { container } = render(<WorkerListContent />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct flex style for stacked layout', () => {
      const { container } = render(<WorkerListContent />);
      expect(container.firstChild).toHaveStyleRule('flex', '1');
    });

    it('uses bounded flex for wide layout scroll', () => {
      const { container } = render(<WorkerListContent />);
      const wide = `(min-width: ${breakPoints.md + 1}px)`;
      expect(container.firstChild).toHaveStyleRule('flex', '1 1 auto', {
        media: wide,
      });
      expect(container.firstChild).toHaveStyleRule('height', '0', {
        media: wide,
      });
    });

    it('has correct overflow-y style', () => {
      const { container } = render(<WorkerListContent />);
      expect(container.firstChild).toHaveStyleRule('overflow-y', 'auto');
    });

    it('accepts ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<WorkerListContent ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('LoadingContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<LoadingContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<LoadingContainer />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct align-items style', () => {
      const { container } = render(<LoadingContainer />);
      expect(container.firstChild).toHaveStyleRule('align-items', 'center');
    });

    it('has correct justify-content style', () => {
      const { container } = render(<LoadingContainer />);
      expect(container.firstChild).toHaveStyleRule('justify-content', 'center');
    });

    it('has correct width style', () => {
      const { container } = render(<LoadingContainer />);
      expect(container.firstChild).toHaveStyleRule('width', '100%');
    });

    it('has correct height style', () => {
      const { container } = render(<LoadingContainer />);
      expect(container.firstChild).toHaveStyleRule('height', '100%');
    });
  });

  describe('StyledTable', () => {
    it('renders without crashing', () => {
      const { container } = render(<StyledTable summary="test" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct width style', () => {
      const { container } = render(<StyledTable summary="test" />);
      expect(container.firstChild).toHaveStyleRule('width', '100%');
    });
  });

  describe('WorkerRow', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <table>
          <tbody>
            <WorkerRow />
          </tbody>
        </table>,
      );
      expect(container.querySelector('tr')).toBeInTheDocument();
    });

    it('has hover style', () => {
      const { container } = render(
        <table>
          <tbody>
            <WorkerRow $isSelected={false} />
          </tbody>
        </table>,
      );
      expect(container.querySelector('tr')).toHaveStyleRule(
        'background-color',
        '#f7f8f9',
        { modifier: ':hover' },
      );
    });
  });

  describe('WorkerCell', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <WorkerCell />
            </tr>
          </tbody>
        </table>,
      );
      expect(container.querySelector('td')).toBeInTheDocument();
    });

    it('has correct vertical-align style', () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <WorkerCell />
            </tr>
          </tbody>
        </table>,
      );
      expect(container.querySelector('td')).toHaveStyleRule(
        'vertical-align',
        'middle',
      );
    });
  });

  describe('LoadingMoreContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <table>
          <tbody>
            <LoadingMoreContainer />
          </tbody>
        </table>,
      );
      expect(container.querySelector('tr')).toBeInTheDocument();
    });
  });

  describe('LoadingMoreContent', () => {
    it('renders without crashing', () => {
      const { container } = render(<LoadingMoreContent />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<LoadingMoreContent />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct align-items style', () => {
      const { container } = render(<LoadingMoreContent />);
      expect(container.firstChild).toHaveStyleRule('align-items', 'center');
    });

    it('has correct justify-content style', () => {
      const { container } = render(<LoadingMoreContent />);
      expect(container.firstChild).toHaveStyleRule('justify-content', 'center');
    });

    it('has correct gap style', () => {
      const { container } = render(<LoadingMoreContent />);
      expect(container.firstChild).toHaveStyleRule('gap', '0.5rem');
    });

    it('has correct color style', () => {
      const { container } = render(<LoadingMoreContent />);
      expect(container.firstChild).toHaveStyleRule('color', '#6b7177');
    });
  });

  describe('HoursCellContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<HoursCellContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<HoursCellContainer />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct flex-direction style', () => {
      const { container } = render(<HoursCellContainer />);
      expect(container.firstChild).toHaveStyleRule('flex-direction', 'column');
    });

    it('has correct gap style', () => {
      const { container } = render(<HoursCellContainer />);
      expect(container.firstChild).toHaveStyleRule('gap', '0.25rem');
    });
  });

  describe('TimeOnClock', () => {
    it('renders without crashing', () => {
      const { container } = render(<TimeOnClock>1h 30m</TimeOnClock>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct color style', () => {
      const { container } = render(<TimeOnClock>1h 30m</TimeOnClock>);
      expect(container.firstChild).toHaveStyleRule('color', '#00892e');
    });
  });

  describe('ProfileAvatarContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<ProfileAvatarContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has transparent border when not selected', () => {
      const { container } = render(
        <ProfileAvatarContainer $isSelected={false} />,
      );
      expect(container.firstChild).toHaveStyleRule(
        'border',
        '2px solid transparent',
      );
    });

    it('has orange border when selected', () => {
      const { container } = render(<ProfileAvatarContainer $isSelected />);
      expect(container.firstChild).toHaveStyleRule(
        'border',
        '2px solid #ff8000',
      );
    });

    it('has correct border-radius style', () => {
      const { container } = render(<ProfileAvatarContainer />);
      expect(container.firstChild).toHaveStyleRule('border-radius', '50%');
    });
  });

  describe('ProfileAvatar', () => {
    it('renders without crashing', () => {
      const { container } = render(<ProfileAvatar />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<ProfileAvatar />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct align-items style', () => {
      const { container } = render(<ProfileAvatar />);
      expect(container.firstChild).toHaveStyleRule('align-items', 'center');
    });

    it('has correct justify-content style', () => {
      const { container } = render(<ProfileAvatar />);
      expect(container.firstChild).toHaveStyleRule('justify-content', 'center');
    });

    it('has correct width style', () => {
      const { container } = render(<ProfileAvatar />);
      expect(container.firstChild).toHaveStyleRule('width', '40px');
    });

    it('has correct height style', () => {
      const { container } = render(<ProfileAvatar />);
      expect(container.firstChild).toHaveStyleRule('height', '40px');
    });

    it('has correct border-radius style', () => {
      const { container } = render(<ProfileAvatar />);
      expect(container.firstChild).toHaveStyleRule('border-radius', '50%');
    });

    it('has correct background-color style', () => {
      const { container } = render(<ProfileAvatar />);
      expect(container.firstChild).toHaveStyleRule(
        'background-color',
        '#00892e',
      );
    });

    it('has correct color style', () => {
      const { container } = render(<ProfileAvatar />);
      expect(container.firstChild).toHaveStyleRule('color', '#ffffff');
    });
  });

  describe('WorkerNameContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<WorkerNameContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<WorkerNameContainer />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct align-items style', () => {
      const { container } = render(<WorkerNameContainer />);
      expect(container.firstChild).toHaveStyleRule('align-items', 'center');
    });

    it('has correct gap style', () => {
      const { container } = render(<WorkerNameContainer />);
      expect(container.firstChild).toHaveStyleRule('gap', '0.75rem');
    });
  });

  describe('WorkerNameDetails', () => {
    it('renders without crashing', () => {
      const { container } = render(<WorkerNameDetails />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<WorkerNameDetails />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct flex-flow style', () => {
      const { container } = render(<WorkerNameDetails />);
      expect(container.firstChild).toHaveStyleRule('flex-flow', 'column');
    });

    it('has correct gap style', () => {
      const { container } = render(<WorkerNameDetails />);
      expect(container.firstChild).toHaveStyleRule('gap', '0.25rem');
    });
  });

  describe('ActionButton', () => {
    it('renders without crashing', () => {
      const { container } = render(<ActionButton>Action</ActionButton>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has correct padding-right style', () => {
      const { container } = render(<ActionButton>Action</ActionButton>);
      expect(container.firstChild).toHaveStyleRule(
        'padding-right',
        '0 !important',
        {
          modifier: '',
        },
      );
    });

    it('has correct justify-content style', () => {
      const { container } = render(<ActionButton>Action</ActionButton>);
      expect(container.firstChild).toHaveStyleRule(
        'justify-content',
        'flex-end !important',
        {
          modifier: '',
        },
      );
    });
  });

  describe('Component Composition', () => {
    it('renders all components together in a list layout', () => {
      const { container } = render(
        <WorkerListContainer>
          <SearchContainer>
            <input placeholder="Search" />
            <FilterControl />
          </SearchContainer>
          <WorkerListContent>
            <StyledTable summary="Workers">
              <tbody>
                <WorkerRow $isSelected={false}>
                  <WorkerCell>
                    <WorkerNameContainer>
                      <ProfileAvatarContainer $isSelected={false}>
                        <ProfileAvatar>J</ProfileAvatar>
                      </ProfileAvatarContainer>
                      <WorkerNameDetails>
                        <span>John Doe</span>
                      </WorkerNameDetails>
                    </WorkerNameContainer>
                  </WorkerCell>
                  <WorkerCell>
                    <HoursCellContainer>
                      <TimeOnClock>1h 30m</TimeOnClock>
                    </HoursCellContainer>
                  </WorkerCell>
                </WorkerRow>
              </tbody>
            </StyledTable>
          </WorkerListContent>
        </WorkerListContainer>,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
