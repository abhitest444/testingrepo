import {
  blockInvalidHoursKeys,
  blockInvalidHoursPaste,
} from 'src/js/widgets/timeProject/utils/hoursInputGuards';

const makeKeyEvent = (
  key: string,
  modifiers: Partial<{
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
  }> = {},
  currentValue = '',
) => {
  const preventDefault = jest.fn();
  return {
    event: {
      key,
      metaKey: modifiers.metaKey ?? false,
      ctrlKey: modifiers.ctrlKey ?? false,
      altKey: modifiers.altKey ?? false,
      currentTarget: { value: currentValue } as HTMLInputElement,
      preventDefault,
    } as unknown as React.KeyboardEvent<HTMLInputElement>,
    preventDefault,
  };
};

const makePasteEvent = (text: string) => {
  const preventDefault = jest.fn();
  return {
    event: {
      clipboardData: { getData: () => text },
      preventDefault,
    } as unknown as React.ClipboardEvent<HTMLInputElement>,
    preventDefault,
  };
};

describe('blockInvalidHoursKeys', () => {
  it.each(['0', '1', '5', '9', '.'])('allows digit/decimal "%s"', (key) => {
    const { event, preventDefault } = makeKeyEvent(key);
    blockInvalidHoursKeys(event);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it.each(['e', 'E', '+', '-', 'a', 'Z', '$', '/'])(
    'blocks invalid character "%s"',
    (key) => {
      const { event, preventDefault } = makeKeyEvent(key);
      blockInvalidHoursKeys(event);
      expect(preventDefault).toHaveBeenCalledTimes(1);
    },
  );

  it('blocks a second decimal point', () => {
    const { event, preventDefault } = makeKeyEvent('.', {}, '12.3');
    blockInvalidHoursKeys(event);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it.each([
    'Backspace',
    'Delete',
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ])('allows control key "%s"', (key) => {
    const { event, preventDefault } = makeKeyEvent(key);
    blockInvalidHoursKeys(event);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('allows clipboard shortcuts (meta/ctrl held)', () => {
    const { event: meta, preventDefault: pdMeta } = makeKeyEvent('v', {
      metaKey: true,
    });
    blockInvalidHoursKeys(meta);
    expect(pdMeta).not.toHaveBeenCalled();

    const { event: ctrl, preventDefault: pdCtrl } = makeKeyEvent('a', {
      ctrlKey: true,
    });
    blockInvalidHoursKeys(ctrl);
    expect(pdCtrl).not.toHaveBeenCalled();
  });
});

describe('blockInvalidHoursPaste', () => {
  it('allows a valid positive decimal', () => {
    const { event, preventDefault } = makePasteEvent('123.45');
    blockInvalidHoursPaste(event);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('allows the maximum value', () => {
    const { event, preventDefault } = makePasteEvent('1193046.47');
    blockInvalidHoursPaste(event);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('blocks values above the maximum', () => {
    const { event, preventDefault } = makePasteEvent('1193046.48');
    blockInvalidHoursPaste(event);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('blocks negatives', () => {
    const { event, preventDefault } = makePasteEvent('-5');
    blockInvalidHoursPaste(event);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('blocks scientific notation / non-numeric junk', () => {
    const cases = ['1e5', 'abc', '12.3.4', '1,000', '+5'];
    cases.forEach((value) => {
      const { event, preventDefault } = makePasteEvent(value);
      blockInvalidHoursPaste(event);
      expect(preventDefault).toHaveBeenCalledTimes(1);
    });
  });

  it('does nothing when clipboard payload is empty', () => {
    const { event, preventDefault } = makePasteEvent('');
    blockInvalidHoursPaste(event);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
