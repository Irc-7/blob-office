import { describe, it, expect } from 'vitest';
import { STATUS_CFG, ONE_DARK, CODE_SNIPPETS } from '../src/blob/BlobModel';

describe('BlobModel and Status Configuration', () => {
  it('should verify all 7 agent states have valid parameters', () => {
    const statuses = ['idle', 'thinking', 'editing', 'reading', 'running', 'waiting', 'error'] as const;
    for (const st of statuses) {
      expect(STATUS_CFG[st]).toBeDefined();
      expect(STATUS_CFG[st].pulse).toBeGreaterThan(0);
      expect(STATUS_CFG[st].radius).toBeGreaterThan(15);
      expect(STATUS_CFG[st].opacity).toBeGreaterThan(100);
      expect(STATUS_CFG[st].label).toBeDefined();
    }
  });

  it('should verify One Dark theme and code snippets', () => {
    expect(ONE_DARK.bg.length).toBe(3);
    expect(CODE_SNIPPETS.length).toBeGreaterThan(4);
    expect(CODE_SNIPPETS[0].text).toContain('.ts');
  });
});
