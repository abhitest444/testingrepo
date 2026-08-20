import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import 'jest-styled-components';

import {
  FieldSectionTitle,
  FieldSectionSubTitle,
  CheckBoxWithToolTip,
  CheckBoxText,
  ToolTipIcon,
  RequiredFieldContainer,
  RequiredFieldText,
  FieldsGrid,
  FieldRow,
  SectionHeader,
  CheckboxHeader,
  RequiredFieldHeader,
  ButtonContainer,
  StyledButton,
  StyledTable,
  TableHeaderCell,
  FieldLabelContainer,
  StyledChevron,
} from '../../../../../src/js/widgets/timeTrackingSettings/components/styles';

const renderWithTheme = (component: React.ReactElement) =>
  render(<ThemeProvider theme={{}}>{component}</ThemeProvider>);

describe('TimeTrackingSettings Styles', () => {
  describe('FieldSectionTitle', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithTheme(
        <FieldSectionTitle>Test Title</FieldSectionTitle>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule('color', 'var(--color-text-primary)');
      expect(element).toHaveStyleRule(
        'font-size',
        'var(--font-size-heading-3)',
      );
      expect(element).toHaveStyleRule('font-style', 'normal');
      expect(element).toHaveStyleRule(
        'font-weight',
        'var(--font-weight-heading)',
      );
      expect(element).toHaveStyleRule('line-height', '44px');
      expect(element).toHaveStyleRule('margin-bottom', '8px');
    });
  });

  describe('FieldSectionSubTitle', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithTheme(
        <FieldSectionSubTitle>Test Subtitle</FieldSectionSubTitle>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule(
        'font-size',
        'var(--font-size-component-medium)',
      );
      expect(element).toHaveStyleRule('font-style', 'normal');
      expect(element).toHaveStyleRule(
        'font-weight',
        'var(--font-weight-component)',
      );
      expect(element).toHaveStyleRule('line-height', '24px');
      expect(element).toHaveStyleRule('margin-bottom', '28px');
    });
  });

  describe('CheckBoxWithToolTip', () => {
    it('should render with correct styles when isSubField is false', () => {
      const { container } = renderWithTheme(
        <CheckBoxWithToolTip isSubField={false}>
          Test Content
        </CheckBoxWithToolTip>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule('padding-left', '16px');
      expect(element).toHaveStyleRule('position', 'relative');
      expect(element).toHaveStyleRule('gap', '15px');
    });

    it('should render with correct styles when isSubField is true', () => {
      const { container } = renderWithTheme(
        <CheckBoxWithToolTip isSubField>Test Content</CheckBoxWithToolTip>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule('padding-left', '38px');
      expect(element).toHaveStyleRule('position', 'relative');
      expect(element).toHaveStyleRule('gap', '15px');
    });
  });

  describe('CheckBoxText', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithTheme(
        <CheckBoxText>Test Text</CheckBoxText>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule(
        'font-size',
        'var(--font-size-input-text)',
      );
      expect(element).toHaveStyleRule('font-style', 'normal');
      expect(element).toHaveStyleRule(
        'font-weight',
        'var(--font-weight-input-label)',
      );
      expect(element).toHaveStyleRule('line-height', '24px');
      expect(element).toHaveStyleRule('padding-right', '8px');
    });
  });

  describe('ToolTipIcon', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithTheme(<ToolTipIcon />);

      const element = container.firstChild;
      expect(element).toHaveStyleRule('position', 'absolute');
      expect(element).toHaveStyleRule('bottom', '18px');
    });
  });

  describe('RequiredFieldContainer', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithTheme(
        <RequiredFieldContainer>Test Container</RequiredFieldContainer>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule('display', 'flex');
      expect(element).toHaveStyleRule('align-items', 'center');
      expect(element).toHaveStyleRule('gap', '15px');
      expect(element).toHaveStyleRule('position', 'relative');
      expect(element).toHaveStyleRule('font-size', '14px');
    });
  });

  describe('RequiredFieldText', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithTheme(
        <RequiredFieldText>Test Text</RequiredFieldText>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule(
        'font-size',
        'var(--font-size-input-text)',
      );
      expect(element).toHaveStyleRule('font-style', 'normal');
      expect(element).toHaveStyleRule(
        'font-weight',
        'var(--font-weight-input-label)',
      );
      expect(element).toHaveStyleRule('line-height', '24px');
      expect(element).toHaveStyleRule('padding-right', '8px');
    });
  });

  describe('FieldsGrid', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithTheme(<FieldsGrid>Test Grid</FieldsGrid>);

      const element = container.firstChild;
      expect(element).toHaveStyleRule('display', 'grid');
      expect(element).toHaveStyleRule(
        'grid-template-columns',
        'minmax(320px,1fr) 80px',
      );
      expect(element).toHaveStyleRule('align-items', 'start');
      expect(element).toHaveStyleRule('width', '100%');
    });
  });

  describe('FieldRow', () => {
    it('should render with correct styles when isSubField is undefined', () => {
      const { container } = renderWithTheme(<FieldRow>Test Row</FieldRow>);

      const element = container.firstChild;
      expect(element).toHaveStyleRule('display', 'contents');
      expect(element).toHaveStyleRule('align-items', 'left');
    });

    it('should render with correct styles when isSubField is false', () => {
      const { container } = renderWithTheme(
        <FieldRow isSubField={false}>Test Row</FieldRow>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule('display', 'contents');
      expect(element).toHaveStyleRule('align-items', 'left');
    });

    it('should render with correct styles when isSubField is true', () => {
      const { container } = renderWithTheme(
        <FieldRow isSubField>Test Row</FieldRow>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule('display', 'contents');
      expect(element).toHaveStyleRule('align-items', 'left');
    });
  });

  describe('SectionHeader', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithTheme(
        <SectionHeader>Test Header</SectionHeader>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule('display', 'grid');
      expect(element).toHaveStyleRule(
        'grid-template-columns',
        'minmax(320px,1fr) 80px',
      );
      expect(element).toHaveStyleRule('align-items', 'start');
      expect(element).toHaveStyleRule('margin-bottom', '16px');
      expect(element).toHaveStyleRule(
        'font-weight',
        'var(--font-weight-heading)',
      );
      expect(element).toHaveStyleRule(
        'font-size',
        'var(--font-size-component-medium)',
      );
      expect(element).toHaveStyleRule('color', 'var(--color-text-primary)');
    });
  });

  describe('CheckboxHeader', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithTheme(
        <CheckboxHeader>Test Header</CheckboxHeader>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule(
        'font-weight',
        'var(--font-weight-heading)',
      );
      expect(element).toHaveStyleRule(
        'font-size',
        'var(--font-size-component-medium)',
      );
      expect(element).toHaveStyleRule('color', 'var(--color-text-primary)');
      expect(element).toHaveStyleRule('margin-left', '5px');
    });
  });

  describe('RequiredFieldHeader', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithTheme(
        <RequiredFieldHeader>Test Header</RequiredFieldHeader>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule(
        'font-weight',
        'var(--font-weight-heading)',
      );
      expect(element).toHaveStyleRule(
        'font-size',
        'var(--font-size-component-medium)',
      );
      expect(element).toHaveStyleRule('color', 'var(--color-text-primary)');
      expect(element).toHaveStyleRule('margin-left', '38px');
    });
  });

  describe('ButtonContainer', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithTheme(
        <ButtonContainer>Test Container</ButtonContainer>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule('display', 'flex');
      expect(element).toHaveStyleRule('align-items', 'center');
      expect(element).toHaveStyleRule('margin-bottom', '24px');
    });
  });

  describe('StyledButton', () => {
    it('should render with correct styles', () => {
      const { container } = renderWithTheme(
        <StyledButton>Test Button</StyledButton>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule('padding-left', '0px');
      expect(element).toHaveStyleRule('padding-right', '0px');
    });
  });

  describe('StyledTable', () => {
    it('should render with correct table styles', () => {
      const { container } = renderWithTheme(
        <StyledTable>
          <tbody>
            <tr>
              <td>Test Content</td>
            </tr>
          </tbody>
        </StyledTable>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule('width', '100%');
      expect(element).toHaveStyleRule('table-layout', 'auto');
      expect(element).toHaveStyleRule('min-width', '600px');
    });
  });

  describe('TableHeaderCell', () => {
    it('should render with correct header cell styles', () => {
      const { container } = renderWithTheme(
        <StyledTable>
          <thead>
            <tr>
              <TableHeaderCell>Header</TableHeaderCell>
            </tr>
          </thead>
        </StyledTable>,
      );

      const headerCell = container.querySelector('td, th');
      expect(headerCell).toHaveStyleRule('text-transform', 'none');
    });
  });

  describe('FieldLabelContainer', () => {
    it('should render with correct flexbox styles', () => {
      const { container } = renderWithTheme(
        <FieldLabelContainer>
          <span>Test Label</span>
        </FieldLabelContainer>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule('display', 'flex');
      expect(element).toHaveStyleRule('align-items', 'center');
      expect(element).toHaveStyleRule('gap', '8px');
    });
  });

  describe('StyledChevron', () => {
    it('should render with correct chevron styles', () => {
      const { container } = renderWithTheme(
        <StyledChevron>
          <svg />
        </StyledChevron>,
      );

      const element = container.firstChild;
      expect(element).toHaveStyleRule('display', 'inline-block');
      expect(element).toHaveStyleRule('padding-right', '4px');
      expect(element).toHaveStyleRule('cursor', 'pointer');
    });
  });
});
