import { renderHook } from '@testing-library/react-hooks';
import { useOvertimeTourSteps } from 'src/js/widgets/qbtOrchestrator/features/overtime/utils/overtimeTourSteps';

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

jest.mock('src/assets/animations/overtime.json', () => ({
  v: '5.5.7',
  fr: 30,
  layers: [],
}));

describe('useOvertimeTourSteps', () => {
  it('returns an array with one step', () => {
    const { result } = renderHook(() => useOvertimeTourSteps());
    expect(result.current).toHaveLength(1);
  });

  it('returns step with correct id', () => {
    const { result } = renderHook(() => useOvertimeTourSteps());
    expect(result.current[0].id).toBe('step-1');
  });

  it('returns step with intl title', () => {
    const { result } = renderHook(() => useOvertimeTourSteps());
    expect(result.current[0].title).toBe('overtime.tour.step.1.title');
  });

  it('returns step with intl description', () => {
    const { result } = renderHook(() => useOvertimeTourSteps());
    expect(result.current[0].description).toBe(
      'overtime.tour.step.1.description',
    );
  });

  it('returns step with intl doneLabel', () => {
    const { result } = renderHook(() => useOvertimeTourSteps());
    expect(result.current[0].doneLabel).toBe('overtime.tour.step.1.doneLabel');
  });

  it('returns step with lottieData from Overtime.json', () => {
    const { result } = renderHook(() => useOvertimeTourSteps());
    expect(result.current[0].lottieData).toBeDefined();
    expect(result.current[0].lottieData).toEqual(
      expect.objectContaining({ v: '5.5.7' }),
    );
  });
});
