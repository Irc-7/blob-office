import { describe, it, expect } from 'vitest';
import { easeInOutCubic } from '../src/blob/BlobModel';

describe('Physics and Radial Position Benchmarks', () => {
  it('should interpolate smooth easing curve', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 1);
  });
});
