import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import 'jest-styled-components';
import { GroupContent } from 'src/js/widgets/whosworking/components/workerList/WorkerListGrouped.styled';

describe('WorkerListGrouped.styled', () => {
  describe('GroupContent', () => {
    it('renders without crashing', () => {
      const { container } = render(<GroupContent />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('is a div element', () => {
      const { container } = render(<GroupContent />);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('renders children', () => {
      const { getByText } = render(
        <GroupContent>
          <span>Test Child</span>
        </GroupContent>,
      );
      expect(getByText('Test Child')).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<GroupContent />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct flex-direction style', () => {
      const { container } = render(<GroupContent />);
      expect(container.firstChild).toHaveStyleRule('flex-direction', 'column');
    });

    it('has correct width style', () => {
      const { container } = render(<GroupContent />);
      expect(container.firstChild).toHaveStyleRule('width', '100%');
    });
  });

  describe('Component Usage', () => {
    it('can be used as a wrapper for grouped worker content', () => {
      const { container, getByText } = render(
        <GroupContent>
          <div className="group-header">Engineering Team</div>
          <div className="worker-list">
            <span>Worker 1</span>
            <span>Worker 2</span>
          </div>
        </GroupContent>,
      );

      expect(container.firstChild).toBeInTheDocument();
      expect(getByText('Engineering Team')).toBeInTheDocument();
      expect(getByText('Worker 1')).toBeInTheDocument();
      expect(getByText('Worker 2')).toBeInTheDocument();
    });

    it('can contain multiple nested elements', () => {
      const { container } = render(
        <GroupContent>
          <table>
            <tbody>
              <tr>
                <td>Cell 1</td>
              </tr>
              <tr>
                <td>Cell 2</td>
              </tr>
            </tbody>
          </table>
        </GroupContent>,
      );

      expect(container.querySelector('table')).toBeInTheDocument();
      expect(container.querySelectorAll('tr')).toHaveLength(2);
    });
  });
});
