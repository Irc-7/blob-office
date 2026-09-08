import { describe, it, expect } from 'vitest';
import { easeInOutCubic } from '../src/blob/BlobModel';

describe('Physics and Radial Position Benchmarks', () => {
  it('should interpolate smooth easing curve', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 1);
  });

  it('should calculate wide 4-quadrant non-overlapping positions for widescreen layouts', () => {
    // Test geometry math directly
    const W = 1200;
    const H = 520;
    const centerX = W / 2;
    const centerY = (H - 35) / 2;
    const rx = Math.max(160, Math.min(W * 0.38, W / 2 - 110));
    const ry = Math.max(110, Math.min((H - 45) * 0.38, (H - 45) / 2 - 65));

    const quadrantAngles = [-Math.PI * 0.75, -Math.PI * 0.25, Math.PI * 0.25, Math.PI * 0.75];
    const positions = quadrantAngles.map((angle) => [
      centerX + Math.cos(angle) * rx,
      centerY + Math.sin(angle) * ry,
    ]);

    // Check that agents are spaced widely apart (> 200px between any pair)
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = Math.hypot(positions[i][0] - positions[j][0], positions[i][1] - positions[j][1]);
        expect(dist).toBeGreaterThan(200);
      }
    }
  });
});
