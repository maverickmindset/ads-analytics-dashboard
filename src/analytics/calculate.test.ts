import { describe, expect, it } from 'vitest';
import { divide, summarize, dailyPerformance } from './calculate';
import { demoRows } from '../data/demo';
import { formatINR, formatPercent, formatRatio } from './format';
describe('analytics semantics', () => {
  it('distinguishes unavailable metrics from zero', () => {
    expect(summarize([]).spend).toBeNull();
    expect(summarize([{ ...demoRows[0], spend: 0 }]).spend).toBe(0);
    expect(summarize([{ ...demoRows[0], revenue: null }]).roas).toBeNull();
    expect(summarize([demoRows[0], { ...demoRows[1], revenue: null }]).revenue).toBeNull();
  });
  it('never divides by zero or exposes non-finite values', () => {
    expect(divide(1, 0)).toBeNull(); expect(divide(Infinity, 2)).toBeNull();
    expect(formatINR(NaN)).toBe('—'); expect(formatRatio(Infinity)).toBe('—'); expect(formatPercent(0)).toBe('0.00%');
  });
  it('aggregates daily totals and derives weighted ratios', () => {
    const rows = [{ ...demoRows[0], spend: 100, revenue: 300, orders: 2 }, { ...demoRows[0], id: 'second', spend: 200, revenue: 900, orders: 4 }];
    expect(summarize(rows)).toMatchObject({ spend: 300, revenue: 1200, orders: 6, cac: 50, roas: 4 });
    expect(dailyPerformance(rows)).toHaveLength(1);
    expect(dailyPerformance(rows)[0].revenue).toBe(1200);
  });
});
