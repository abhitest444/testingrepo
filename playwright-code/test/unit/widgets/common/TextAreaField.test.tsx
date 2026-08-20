import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { TextAreaField } from '../../../../src/js/widgets/common/TextAreaField';
import { MAX_NOTES_LENGTH } from '../../../../src/js/common/constants';

describe('TextAreaField', () => {
  // Renders TextArea with provided label and value
  it('should render TextArea with provided label and value', () => {
    const mockOnChange = jest.fn();
    const { getByLabelText } = render(
      <TextAreaField
        value="Test Value"
        onChange={mockOnChange}
        label="Test Label"
      />,
    );
    const textArea = getByLabelText('Test Label');
    expect(textArea).toBeInTheDocument();
    expect(textArea).toHaveValue('Test Value');
  });

  // Updates internal state on text change
  it('should update internal state when text changes', () => {
    const handleChange = jest.fn();
    const { getByRole } = render(
      <TextAreaField value="" onChange={handleChange} />,
    );
    const textArea = getByRole('textbox');
    fireEvent.change(textArea, { target: { value: 'new text' } });
    expect(textArea.textContent).toBe('new text');
  });

  // Calls onChange with new value on blur
  it('should call onChange with new value when blurred', () => {
    const handleChange = jest.fn();
    const { getByRole } = render(
      <TextAreaField value="initial" onChange={handleChange} />,
    );
    const textArea = getByRole('textbox');
    fireEvent.change(textArea, { target: { value: 'updated' } });
    fireEvent.blur(textArea);
    expect(handleChange).toHaveBeenCalledWith('updated');
  });

  // Calls onChange with null when internalValue is empty on blur
  it('should call onChange with null when internalValue is empty on blur', () => {
    const handleChange = jest.fn();
    const { getByRole } = render(
      <TextAreaField value="" onChange={handleChange} />,
    );
    const textArea = getByRole('textbox');
    fireEvent.change(textArea, { target: { value: '' } });
    fireEvent.blur(textArea);
    expect(handleChange).toHaveBeenCalledWith(null);
  });

  // Calls onChange with new value on blur
  it('should call textarea with max value 4000', () => {
    const handleChange = jest.fn();
    const { getByRole } = render(
      <TextAreaField value="initial" onChange={handleChange} />,
    );
    const textArea = getByRole('textbox');
    expect(textArea).toHaveAttribute('maxLength', MAX_NOTES_LENGTH.toString());
    expect(textArea).toHaveStyle('width: 100%');
  });

  describe('readOnly behavior', () => {
    test.each([
      {
        readOnly: true as true | undefined,
        description: 'readOnly prop is true',
        expectReadOnly: true,
      },
      {
        readOnly: false as false | undefined,
        description: 'readOnly prop is false',
        expectReadOnly: false,
      },
      {
        readOnly: undefined,
        description: 'readOnly not provided (default)',
        expectReadOnly: false,
      },
    ])('textarea is %s when $description', ({ readOnly, expectReadOnly }) => {
      const handleChange = jest.fn();
      const { getByRole } = render(
        <TextAreaField
          value="test"
          onChange={handleChange}
          readOnly={readOnly}
        />,
      );
      const textArea = getByRole('textbox');
      if (expectReadOnly) {
        expect(textArea).toHaveAttribute('readonly');
      } else {
        expect(textArea).not.toHaveAttribute('readonly');
      }
    });
  });
});
