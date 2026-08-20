export const formatCurrency = (
  input: string,
  allowNegative = false,
): string => {
  if (isValidCurrencyFormat(input, allowNegative)) return input;
  // Trim the input to remove leading and trailing spaces
  const trimmedInput = input.trim();

  // Convert to number and fix to two decimal places
  const num = parseFloat(trimmedInput);

  // Format the number to two decimal places
  return num.toFixed(2);
};

export const isValidCurrencyFormat = (
  inputValue: string,
  allowNegative = false,
): boolean => {
  const currencyRegex: RegExp = allowNegative
    ? /^-?\d+\.\d{2}$/
    : /^\d+\.\d{2}$/;
  return currencyRegex.test(inputValue);
};

export const processCurrencyInput = (
  input: string,
  maxLength: number,
  allowNegative = false,
): string => {
  // Allow negative sign, numbers, and a single decimal point (conditionally)
  const inputRegex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
  if (!inputRegex.test(input)) {
    return input;
  }

  // Split the value into integer and decimal parts
  const [integerPart, decimalPart] = input.split('.');

  // Handle truncation accounting for negative sign
  let truncatedIntegerPart: string;
  if (integerPart.startsWith('-')) {
    // For negative numbers, keep the sign and truncate digits only
    const digitsOnly = integerPart.substring(1);
    truncatedIntegerPart = `-${digitsOnly.slice(0, maxLength)}`;
  } else {
    truncatedIntegerPart = integerPart.slice(0, maxLength);
  }

  // Restrict to 2 decimal places
  const truncatedDecimalPart =
    decimalPart !== undefined ? decimalPart.slice(0, 2) : '';

  // Combine the integer and decimal parts
  const combinedValue =
    decimalPart !== undefined
      ? `${truncatedIntegerPart}.${truncatedDecimalPart}`
      : truncatedIntegerPart;

  return combinedValue;
};
