import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import 'jest-styled-components';
import {
  PlaceholderContainer,
  ContentMapContainer,
  Header,
} from 'src/js/widgets/whosworking/components/WhosWorkingContent.styled';

describe('WhosWorkingContent.styled', () => {
  describe('PlaceholderContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<PlaceholderContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('is a div element', () => {
      const { container } = render(<PlaceholderContainer />);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('renders children', () => {
      const { getByText } = render(
        <PlaceholderContainer>
          <span>Test Child</span>
        </PlaceholderContainer>,
      );
      expect(getByText('Test Child')).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<PlaceholderContainer />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct flex-flow style', () => {
      const { container } = render(<PlaceholderContainer />);
      expect(container.firstChild).toHaveStyleRule('flex-flow', 'column');
    });

    it('has correct width style', () => {
      const { container } = render(<PlaceholderContainer />);
      expect(container.firstChild).toHaveStyleRule('width', '80%');
    });

    it('has correct margin style', () => {
      const { container } = render(<PlaceholderContainer />);
      expect(container.firstChild).toHaveStyleRule('margin', 'auto');
    });

    it('has correct height style', () => {
      const { container } = render(<PlaceholderContainer />);
      expect(container.firstChild).toHaveStyleRule('height', '100%');
    });
  });

  describe('ContentMapContainer', () => {
    it('renders without crashing', () => {
      const { container } = render(<ContentMapContainer />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('is a div element', () => {
      const { container } = render(<ContentMapContainer />);
      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('renders children', () => {
      const { getByText } = render(
        <ContentMapContainer>
          <span>Map Content</span>
        </ContentMapContainer>,
      );
      expect(getByText('Map Content')).toBeInTheDocument();
    });

    it('has correct display style', () => {
      const { container } = render(<ContentMapContainer />);
      expect(container.firstChild).toHaveStyleRule('display', 'flex');
    });

    it('has correct flex style', () => {
      const { container } = render(<ContentMapContainer />);
      expect(container.firstChild).toHaveStyleRule('flex', '1');
    });

    it('has correct border style', () => {
      const { container } = render(<ContentMapContainer />);
      expect(container.firstChild).toHaveStyleRule(
        'border',
        '1px solid #d4d7dc',
      );
    });

    it('has correct border-radius style', () => {
      const { container } = render(<ContentMapContainer />);
      expect(container.firstChild).toHaveStyleRule('border-radius', '12px');
    });

    it('has correct overflow style', () => {
      const { container } = render(<ContentMapContainer />);
      expect(container.firstChild).toHaveStyleRule('overflow', 'hidden');
    });
  });

  describe('Header', () => {
    it('renders without crashing', () => {
      const { container } = render(<Header>Header Text</Header>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders children', () => {
      const { getByText } = render(<Header>Header Text</Header>);
      expect(getByText('Header Text')).toBeInTheDocument();
    });

    it('has correct margin-bottom style', () => {
      const { container } = render(<Header>Header</Header>);
      expect(container.firstChild).toHaveStyleRule('margin-bottom', '12px');
    });
  });

  describe('Component Composition', () => {
    it('renders all components together', () => {
      const { container, getByText } = render(
        <PlaceholderContainer>
          <Header>Who&apos;s Working</Header>
          <ContentMapContainer>
            <span>Content</span>
          </ContentMapContainer>
        </PlaceholderContainer>,
      );

      expect(container.firstChild).toBeInTheDocument();
      expect(getByText("Who's Working")).toBeInTheDocument();
      expect(getByText('Content')).toBeInTheDocument();
    });
  });
});
